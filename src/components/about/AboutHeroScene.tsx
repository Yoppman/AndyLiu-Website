import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import ReleaseContextOnUnmount from '../webgl/ReleaseContextOnUnmount';
import SceneErrorBoundary from '../webgl/SceneErrorBoundary';

// Organic vertex displacement (Ashima simplex noise) + a fresnel-lit surface,
// so the orb wobbles like liquid glass and glows amber at its rim.
const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  varying vec3 vNormal;
  varying vec3 vView;

  vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main(){
    float n1 = snoise(normal * 1.5 + vec3(0.0, 0.0, uTime * 0.3));
    float n2 = snoise(normal * 3.0 - vec3(uTime * 0.22));
    float disp = (n1 * 0.7 + n2 * 0.3) * uAmp;
    vec3 newPos = position + normal * disp;
    vec4 mv = modelViewMatrix * vec4(newPos, 1.0);
    vView = -mv.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec3 vNormal;
  varying vec3 vView;
  void main(){
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vView);
    float fres = pow(1.0 - max(dot(N, V), 0.0), 2.3);
    vec3 col = mix(uColorA, uColorB, fres);
    col += pow(fres, 3.0) * 0.6; // bright amber rim
    gl_FragColor = vec4(col, 1.0);
  }
`;

const Orb: React.FC<{ reduce: boolean }> = ({ reduce }) => {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: 0.32 },
      uColorA: { value: new THREE.Color('#10132e') },
      uColorB: { value: new THREE.Color('#f0b35f') },
    }),
    [],
  );

  useFrame((state, delta) => {
    if (matRef.current && !reduce) matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    const mesh = meshRef.current;
    if (mesh) {
      if (!reduce) mesh.rotation.y += delta * 0.12;
      mesh.rotation.x += (state.pointer.y * 0.4 - mesh.rotation.x) * 0.04;
      mesh.rotation.z += (-state.pointer.x * 0.25 - mesh.rotation.z) * 0.04;
    }
  });

  return (
    <mesh ref={meshRef} scale={1.7} position={[1.4, 0.15, 0]}>
      <icosahedronGeometry args={[1, 5]} />
      <shaderMaterial ref={matRef} vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} />
    </mesh>
  );
};

/** The drifting iridescent orb behind the About hero. Lazily imported so
 *  three.js stays out of the initial bundle. */
const AboutHeroScene: React.FC = () => {
  const reduce =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <SceneErrorBoundary>
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ position: 'absolute', inset: 0 }}
        camera={{ fov: 45, position: [0, 0, 5], near: 0.1, far: 50 }}
        frameloop={reduce ? 'demand' : 'always'}
      >
        <ReleaseContextOnUnmount />
        <Orb reduce={reduce} />
      </Canvas>
    </SceneErrorBoundary>
  );
};

export default AboutHeroScene;
