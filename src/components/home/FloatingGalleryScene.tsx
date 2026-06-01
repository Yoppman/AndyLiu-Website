import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { MotionValue } from 'framer-motion';
import { cldFull } from '../gallery/shared/cloudinaryUtils';
import { galleryDimensions } from '../../data/galleryDimensions';
import ReleaseContextOnUnmount from './ReleaseContextOnUnmount';

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// The photograph: clipped to a rounded rectangle, with a gentle print vignette.
const FRAG_PHOTO = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D map;
  uniform float uOpacity;
  uniform float uRadius;
  uniform float uAspect;
  void main() {
    vec3 col = texture2D(map, vUv).rgb;
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
    vec2 halfSize = vec2(0.5 * uAspect, 0.5);
    vec2 q = abs(p) - (halfSize - uRadius);
    float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
    float alpha = 1.0 - smoothstep(0.0, 0.01, dist);
    // soft inner vignette for a refined, printed look
    float vig = smoothstep(0.95, 0.25, length(p));
    col *= mix(0.8, 1.0, vig);
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(col, alpha * uOpacity);
  }
`;

// A soft dark halo rendered behind each photo so it lifts off the background.
const FRAG_SHADOW = /* glsl */ `
  varying vec2 vUv;
  uniform float uOpacity;
  uniform float uRadius;
  uniform float uAspect;
  void main() {
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
    vec2 halfSize = vec2(0.5 * uAspect, 0.5);
    vec2 q = abs(p) - (halfSize - uRadius);
    float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
    float a = 1.0 - smoothstep(-0.12, 0.06, dist); // very soft edge → blurred shadow
    gl_FragColor = vec4(0.0, 0.0, 0.0, a * uOpacity * 0.5);
  }
`;

// DENSITY KNOB #1: depth between successive photos. Lower = more frames packed
// into the camera's view at once (denser constellation); higher = sparser, one
// at a time. Pairs with the far-fade distance in the opacity formula below.
const SPACING = 3.6;
const H = 2.6; // base panel height in world units
const GOLDEN = Math.PI * (3 - Math.sqrt(5)); // golden angle ≈ 2.399 rad

const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

interface Layout {
  x: number;
  y: number;
  z: number;
  rotY: number;
  rotZ: number;
  scale: number;
  phase: number;
}

/** A golden-angle spiral corridor: photos wind around the flight axis at varied
 *  radius, size and tilt, so the camera threads through a living constellation. */
function layoutFor(i: number): Layout {
  const angle = i * GOLDEN;
  const radius = 1.8 + (((i * 53) % 100) / 100) * 1.9; // 1.8 .. 3.7
  const scale = 0.78 + (((i * 37) % 100) / 100) * 0.72; // 0.78 .. 1.5
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius * 0.62; // flatten the spiral vertically
  return {
    x,
    y,
    z: -i * SPACING,
    rotY: -x * 0.04, // angle slightly toward the central aisle
    rotZ: ((((i * 29) % 100) / 100) - 0.5) * 0.08, // tiny artful tilt
    scale,
    phase: i * 1.37,
  };
}

/** Frame aspect from stored dimensions. Every fly-through photo is horizontal,
 *  so 3:2 is a safe fallback while metadata is missing — this lets us size the
 *  geometry correctly before the texture's own pixels have arrived. */
const aspectOf = (src: string): number => {
  const d = galleryDimensions[src];
  return d ? d.w / d.h : 1.5;
};

/**
 * Load each texture independently, returning a sparse array that fills in as
 * images decode. `useLoader(TextureLoader, array)` suspends until EVERY texture
 * resolves, so on a cold cache one slow image blanks the whole constellation —
 * that was the "frames are black until you scroll back" bug. Here each
 * photograph appears the moment its own bytes are ready, and a frame whose
 * texture has not loaded yet simply stays invisible instead of rendering black.
 */
function useProgressiveTextures(urls: string[], maxAniso: number) {
  // A ref, not state: filling a slot must NOT re-render the scene, because every
  // material's uniforms are inline object literals that a re-render would rebuild.
  // useFrame polls this each frame and binds each photo's map once its slot fills.
  const ref = useRef<(THREE.Texture | null)[]>(urls.map(() => null));

  useEffect(() => {
    ref.current = urls.map(() => null);
    let alive = true;
    const made: THREE.Texture[] = [];

    urls.forEach((url, i) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // required for WebGL to read the pixels
      const commit = () => {
        if (!alive) return;
        const tex = new THREE.Texture(img);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearMipmapLinearFilter; // crisp at every depth
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        tex.anisotropy = Math.min(4, maxAniso);
        tex.needsUpdate = true;
        made.push(tex);
        ref.current[i] = tex;
      };

      img.src = url;
      // decode() resolves only once the bitmap is FULLY decoded, so the very first
      // GPU upload is never a half-decoded (black) frame — the Safari/JPEG-XL trap
      // where the load event fires before decoding finishes. Fall back to onload
      // for the rare browser/image that rejects decode().
      if (img.decode) {
        img.decode().then(commit).catch(() => {
          if (img.complete && img.naturalWidth) commit();
          else img.onload = commit;
        });
      } else {
        img.onload = commit;
      }
    });

    return () => {
      alive = false;
      made.forEach((t) => t.dispose());
    };
  }, [urls, maxAniso]);

  return ref;
}

const Scene: React.FC<{ images: string[]; progress: MotionValue<number>; reduce: boolean }> = ({
  images,
  progress,
  reduce,
}) => {
  const n = images.length;
  const { camera, gl } = useThree();
  const maxAniso = gl.capabilities.getMaxAnisotropy();

  const urls = useMemo(() => images.map((s) => cldFull(s, 1280)), [images]);
  const textures = useProgressiveTextures(urls, maxAniso);

  const layouts = useMemo(() => images.map((_, i) => layoutFor(i)), [images]);
  const aspects = useMemo(() => images.map((s) => aspectOf(s)), [images]);

  const photoMesh = useRef<THREE.Mesh[]>([]);
  const photoMat = useRef<THREE.ShaderMaterial[]>([]);
  const shadowMesh = useRef<THREE.Mesh[]>([]);
  const shadowMat = useRef<THREE.ShaderMaterial[]>([]);
  const scales = useRef<number[]>(layouts.map((l) => l.scale));
  const hovered = useRef(-1);

  // The camera flies from camZ = 8 (just in front of frame 0) to 8 − travel. The
  // trailing constant carries it a few units PAST the last frame, so the final
  // photos get the same close, fully-lit pass as the first ones. Too small and the
  // camera stops short of the tail frames — they stay distant, small, and dim.
  const travel = (n - 1) * SPACING + 12;

  useFrame((state, delta) => {
    const p = progress.get();
    const camZ = 8 - p * travel;
    const { pointer, clock } = state;

    // fly forward on scroll; drift toward the cursor for parallax
    camera.position.z = camZ;
    camera.position.x += (pointer.x * 1.9 - camera.position.x) * 0.06;
    camera.position.y += (pointer.y * 1.3 - camera.position.y) * 0.06;
    camera.rotation.y = -pointer.x * 0.05;
    camera.rotation.x = pointer.y * 0.05;

    const t = clock.elapsedTime;
    const bob = reduce ? 0 : 0.2;
    for (let i = 0; i < n; i++) {
      const pm = photoMesh.current[i];
      const sm = shadowMesh.current[i];
      const pMat = photoMat.current[i];
      const sMat = shadowMat.current[i];
      const L = layouts[i];
      if (!pm || !sm || !pMat || !sMat) continue;

      const yb = L.y + Math.sin(t * 0.5 + L.phase) * bob;
      const rz = L.rotZ + (reduce ? 0 : Math.sin(t * 0.3 + L.phase) * 0.012);

      const target = L.scale * (hovered.current === i ? 1.16 : 1.0);
      scales.current[i] += (target - scales.current[i]) * Math.min(1, delta * 8);
      const s = scales.current[i];

      pm.position.set(L.x, yb, L.z);
      pm.rotation.set(0, L.rotY, rz);
      pm.scale.setScalar(s);

      // shadow sits behind and a touch below, softly oversized
      sm.position.set(L.x + 0.06, yb - 0.12, L.z - 0.4);
      sm.rotation.set(0, L.rotY, rz);
      sm.scale.setScalar(s * 1.12);

      // Bind the photo as soon as its texture has decoded. Until then the frame
      // stays fully transparent, so a not-yet-loaded photo reads as empty space
      // rather than a black panel — and never waits on its slower siblings.
      const tex = textures.current[i];
      if (tex && pMat.uniforms.map.value !== tex) pMat.uniforms.map.value = tex;
      // DENSITY KNOB #2: the first number is how far ahead (in world units) a
      // frame begins fading in — raise it to reveal more distant frames at once,
      // lower it to keep only the nearest few. ~38 / SPACING ≈ how many are in view.
      const op = tex ? smoothstep(38, 15, camZ - L.z) * smoothstep(0, 3.5, camZ - L.z) : 0;
      pMat.uniforms.uOpacity.value = op;
      sMat.uniforms.uOpacity.value = op;
    }
  });

  return (
    <group>
      {layouts.map((L, i) => {
        const a = aspects[i];
        return (
          <group key={i}>
            {/* soft shadow halo */}
            <mesh
              ref={(el) => {
                if (el) shadowMesh.current[i] = el;
              }}
              position={[L.x + 0.06, L.y - 0.12, L.z - 0.4]}
            >
              <planeGeometry args={[a * H, H, 1, 1]} />
              <shaderMaterial
                ref={(el) => {
                  if (el) shadowMat.current[i] = el;
                }}
                vertexShader={VERT}
                fragmentShader={FRAG_SHADOW}
                transparent
                depthWrite={false}
                uniforms={{ uOpacity: { value: 0 }, uRadius: { value: 0.16 }, uAspect: { value: a } }}
              />
            </mesh>

            {/* photograph */}
            <mesh
              ref={(el) => {
                if (el) photoMesh.current[i] = el;
              }}
              position={[L.x, L.y, L.z]}
              onPointerOver={(e) => {
                e.stopPropagation();
                hovered.current = i;
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                hovered.current = -1;
                document.body.style.cursor = '';
              }}
            >
              <planeGeometry args={[a * H, H, 1, 1]} />
              <shaderMaterial
                ref={(el) => {
                  if (el) photoMat.current[i] = el;
                }}
                vertexShader={VERT}
                fragmentShader={FRAG_PHOTO}
                transparent
                depthWrite={false}
                uniforms={{
                  map: { value: null },
                  uOpacity: { value: 0 },
                  uRadius: { value: 0.14 },
                  uAspect: { value: a },
                }}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

/** A constellation of photographs the camera flies through on scroll. Lazily
 *  imported so three.js stays out of the initial bundle. */
const FloatingGalleryScene: React.FC<{
  images: string[];
  progress: MotionValue<number>;
  active: boolean;
}> = ({ images, progress, active }) => {
  const reduce =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
      camera={{ fov: 55, position: [0, 0, 8], near: 0.1, far: 160 }}
      frameloop={active ? 'always' : 'never'}
    >
      <ReleaseContextOnUnmount />
      <Scene images={images} progress={progress} reduce={reduce} />
    </Canvas>
  );
};

export default FloatingGalleryScene;
