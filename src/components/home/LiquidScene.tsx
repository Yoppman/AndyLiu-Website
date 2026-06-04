import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import type { MotionValue } from 'framer-motion';
import { cldFull } from '../gallery/shared/cloudinaryUtils';
import ReleaseContextOnUnmount from '../webgl/ReleaseContextOnUnmount';

// Fullscreen quad: ignore the camera and draw straight in clip space.
const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uTexA;
  uniform sampler2D uTexB;
  uniform vec2 uRes;
  uniform vec2 uImgA;
  uniform vec2 uImgB;
  uniform vec2 uMouse;
  uniform float uTime;
  uniform float uProgress;
  uniform float uAmp;
  uniform float uReveal;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  // map a [0,1] uv onto an image so it "covers" the viewport
  vec2 coverUv(vec2 uv, vec2 res, vec2 img){
    float ca = res.x / res.y;
    float ia = img.x / img.y;
    vec2 s = (ca < ia) ? vec2(ca / ia, 1.0) : vec2(1.0, ia / ca);
    return (uv - 0.5) * s + 0.5;
  }
  void main(){
    // ---- inverse-genie reveal: the liquid unfurls from a narrow window at the
    // bottom-centre; the neck widens and the gooey wobble settles as uReveal → 1.
    float rv = uReveal;
    float e = rv * rv * (3.0 - 2.0 * rv);               // eased reveal
    float H = mix(0.05, 1.0, e);                        // emerged height: window → full
    float ny = clamp(vUv.y / H, 0.0, 1.0);             // height within the column
    float profile = pow(ny, 0.65);                      // neck curve (narrow base)
    float pinch = mix(mix(0.03, 1.0, profile), 1.0, e); // → 1.0 (no pinch) at full reveal
    float wob = 1.0 - e;                                // distortion fades out
    float gx = 0.5 + (vUv.x - 0.5) / max(pinch, 1e-3);
    float gy = vUv.y / H;
    gx += sin(vUv.y * 16.0 + uTime * 3.5) * 0.045 * wob; // gooey horizontal wobble
    gy += sin(vUv.x * 12.0 + uTime * 2.7) * 0.030 * wob;
    vec2 uv = vec2(gx, gy);

    // silhouette mask — soft edges during the reveal, effectively solid at the end.
    // Outside the genie shape stays black (the section background), so the liquid
    // appears to grow out of a small window at the bottom of the screen.
    float soft = 0.03 * wob + 0.0015;
    float mask =
        smoothstep(0.0, soft, gx) * smoothstep(1.0, 1.0 - soft, gx) *
        (1.0 - smoothstep(H - soft, H + 0.0001, vUv.y));

    float t = uTime * 0.08;
    // flowing domain warp (two octaves for a richer liquid)
    vec2 q = vec2(noise(uv * 3.0 + t), noise(uv * 3.0 - t + 7.3));
    q += 0.5 * vec2(noise(uv * 6.0 - t * 1.3), noise(uv * 6.0 + t * 1.1 + 3.1));
    vec2 disp = (q - 0.75) * uAmp;
    // cursor ripple
    float d = distance(vUv, uMouse);
    float ripple = smoothstep(0.45, 0.0, d) * 0.08;
    disp += normalize(vUv - uMouse + 0.0001) * ripple * sin(d * 26.0 - uTime * 2.2);

    float m = length(disp) * 1.6 + ripple * 4.0;
    vec2 ca = coverUv(uv + disp, uRes, uImgA);
    vec2 cb = coverUv(uv + disp, uRes, uImgB);

    // soft RGB split scaled by displacement
    vec3 colA = vec3(
      texture2D(uTexA, ca + vec2(m * 0.014, 0.0)).r,
      texture2D(uTexA, ca).g,
      texture2D(uTexA, ca - vec2(m * 0.014, 0.0)).b
    );
    vec3 colB = vec3(
      texture2D(uTexB, cb + vec2(m * 0.014, 0.0)).r,
      texture2D(uTexB, cb).g,
      texture2D(uTexB, cb - vec2(m * 0.014, 0.0)).b
    );
    vec3 col = mix(colA, colB, smoothstep(0.0, 1.0, uProgress));
    // subtle vignette
    float vig = smoothstep(1.15, 0.35, distance(vUv, vec2(0.5)));
    col *= mix(0.7, 1.0, vig);
    gl_FragColor = vec4(col * mask, 1.0);
  }
`;

const configure = (t: THREE.Texture) => {
  t.colorSpace = THREE.SRGBColorSpace;
  t.minFilter = THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
};

const Plane: React.FC<{ imgA: string; imgB: string; progress: MotionValue<number>; reduce: boolean }> = ({
  imgA,
  imgB,
  progress,
  reduce,
}) => {
  // useLoader suspends until both photos are decoded, so dimensions are ready.
  const texA = configure(useLoader(THREE.TextureLoader, cldFull(imgA, 1440)));
  const texB = configure(useLoader(THREE.TextureLoader, cldFull(imgB, 1440)));
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const smoothed = useRef(new THREE.Vector2(0.5, 0.5));

  const uniforms = useMemo(
    () => ({
      uTexA: { value: texA },
      uTexB: { value: texB },
      uRes: { value: new THREE.Vector2(1, 1) },
      uImgA: { value: new THREE.Vector2(texA.image?.width || 1, texA.image?.height || 1) },
      uImgB: { value: new THREE.Vector2(texB.image?.width || 1, texB.image?.height || 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uAmp: { value: 0.08 },
      uReveal: { value: reduce ? 1 : 0 },
    }),
    [texA, texB, reduce],
  );

  useFrame((state) => {
    const m = matRef.current;
    if (!m) return;
    const { size, pointer, clock } = state;
    m.uniforms.uRes.value.set(size.width, size.height);
    const tx = pointer.x * 0.5 + 0.5;
    const ty = pointer.y * 0.5 + 0.5;
    smoothed.current.x += (tx - smoothed.current.x) * 0.08;
    smoothed.current.y += (ty - smoothed.current.y) * 0.08;
    m.uniforms.uMouse.value.copy(smoothed.current);
    if (!reduce) m.uniforms.uTime.value = clock.elapsedTime;
    const p = progress.get();
    m.uniforms.uProgress.value = p;
    // genie unfurls over the first ~30% of the section's scroll (skipped on reduced motion)
    m.uniforms.uReveal.value = reduce ? 1 : Math.min(1, Math.max(0, p / 0.3));
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2, 1, 1]} />
      <shaderMaterial ref={matRef} vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} />
    </mesh>
  );
};

/** Act III scene, dynamically imported so three.js stays out of the initial bundle. */
const LiquidScene: React.FC<{ images: string[]; progress: MotionValue<number>; active: boolean }> = ({
  images,
  progress,
  active,
}) => {
  const imgA = images[0];
  const imgB = images[1] ?? images[0];
  const reduce =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
      frameloop={!active ? 'never' : reduce ? 'demand' : 'always'}
    >
      <ReleaseContextOnUnmount />
      <Plane imgA={imgA} imgB={imgB} progress={progress} reduce={reduce} />
    </Canvas>
  );
};

export default LiquidScene;
