import { useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useNearViewport } from '../home/useNearViewport';
import ReleaseContextOnUnmount from '../webgl/ReleaseContextOnUnmount';
import SceneErrorBoundary from '../webgl/SceneErrorBoundary';

export type ProjectShape = 'crystal' | 'globe' | 'cube' | 'knot';

const Shape: React.FC<{ shape: ProjectShape; reduce: boolean }> = ({ shape, reduce }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    const m = ref.current;
    if (!m) return;
    if (!reduce) {
      m.rotation.y += delta * 0.5;
      m.rotation.z += delta * 0.04;
    }
    // lean toward the cursor when hovering the card
    m.rotation.x += (state.pointer.y * 0.6 - m.rotation.x) * 0.05;
  });

  return (
    <mesh ref={ref}>
      {shape === 'crystal' && <icosahedronGeometry args={[1.25, 0]} />}
      {shape === 'cube' && <boxGeometry args={[1.6, 1.6, 1.6]} />}
      {shape === 'knot' && <torusKnotGeometry args={[0.78, 0.27, 180, 28]} />}
      {shape === 'globe' && <icosahedronGeometry args={[1.35, 3]} />}
      {shape === 'globe' ? (
        <meshBasicMaterial color="#2b2b34" wireframe />
      ) : (
        <meshStandardMaterial color="#1c1c22" metalness={0.6} roughness={0.35} flatShading />
      )}
    </mesh>
  );
};

/** A small rotating 3D object themed to a project, lazily imported so three.js
 *  stays out of the initial bundle. Transparent canvas — the card shows behind.
 *
 *  Four of these live on the About page at once. Each holds its own WebGL context,
 *  so we (1) only mount the canvas while the card is near the viewport and unmount
 *  it once scrolled well away, (2) force the context to release on unmount, and
 *  (3) wrap it in an error boundary — together this keeps the page from blowing
 *  past the browser's per-page context budget (which froze the home scenes and
 *  blanked this route to white once the budget was exhausted). */
const ProjectObject: React.FC<{ shape: ProjectShape }> = ({ shape }) => {
  const reduce =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const hostRef = useRef<HTMLDivElement>(null);
  const near = useNearViewport(hostRef, '200px');

  return (
    <div ref={hostRef} className="absolute inset-0">
      {near && (
        <SceneErrorBoundary>
          <Canvas
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            camera={{ fov: 40, position: [0, 0, 4] }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <ReleaseContextOnUnmount />
            <ambientLight intensity={0.6} />
            <directionalLight position={[3, 4, 5]} intensity={1.4} />
            <pointLight position={[-4, -2, 3]} intensity={0.9} color="#f0b35f" />
            <Shape shape={shape} reduce={reduce} />
          </Canvas>
        </SceneErrorBoundary>
      )}
    </div>
  );
};

export default ProjectObject;
