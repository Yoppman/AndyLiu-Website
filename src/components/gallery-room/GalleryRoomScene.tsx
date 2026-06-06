import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import type { MotionValue } from 'framer-motion';
import { cldFull } from '../gallery/shared/cloudinaryUtils';
import ReleaseContextOnUnmount from '../webgl/ReleaseContextOnUnmount';

/**
 * "The Gallery Room" — a 3D museum corridor the camera glides down on scroll.
 *
 * Photographs hang on both walls, each washed by a warm spotlight pool (faked
 * with additive radial gradients, not real lights — so there is no per-light
 * shader cost and nothing to blow the WebGL budget). The print nearest the
 * camera brightens and reports itself up as the "focused" piece; click any
 * frame to step into that gallery. Everything is unlit + fog, in the spirit of
 * the site's other scenes.
 */

export interface Artwork {
  src: string;
  slug: string;
  title: string;
  region?: string;
  aspect: number;
}

// ── Room dimensions (world units) ──
const HALF_W = 3.4; // half the aisle width — walls sit at ±HALF_W
const FLOOR_Y = -2.2;
const CEIL_Y = 3.0;
const SPACING = 5.2; // z-gap between successive artworks (they alternate walls)
const FIRST_Z = -7; // z of the first artwork
const CAM_START = 5;
const TARGET_H = 2.0; // nominal print height; clamped by a max width below
const MAX_W = 3.1;
const BG = '#08080a';

/** Fit a print inside a tasteful box while respecting its real aspect. */
function printSize(aspect: number): [number, number] {
  let h = aspect < 1 ? TARGET_H * 1.18 : TARGET_H; // give verticals a little height
  let w = h * aspect;
  if (w > MAX_W) {
    w = MAX_W;
    h = w / aspect;
  }
  return [w, h];
}

/** A soft warm radial gradient — the spotlight wash, shared by every pool. */
function makePoolTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,246,228,0.95)');
  g.addColorStop(0.45, 'rgba(255,232,196,0.42)');
  g.addColorStop(1, 'rgba(255,232,196,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Per-texture progressive loader (the FloatingGallery pattern): a ref, not
 * state, so a slot filling in never re-renders the scene; decode() before
 * commit so the first GPU upload is never a half-decoded black frame; dispose
 * everything on unmount.
 */
function useProgressiveTextures(urls: string[], maxAniso: number) {
  const ref = useRef<(THREE.Texture | null)[]>(urls.map(() => null));
  useEffect(() => {
    ref.current = urls.map(() => null);
    let alive = true;
    const made: THREE.Texture[] = [];
    urls.forEach((url, i) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const commit = () => {
        if (!alive) return;
        const tex = new THREE.Texture(img);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        tex.anisotropy = Math.min(8, maxAniso);
        tex.needsUpdate = true;
        made.push(tex);
        ref.current[i] = tex;
      };
      img.src = url;
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

interface Placement {
  side: number; // -1 left wall, +1 right wall
  wallX: number;
  z: number;
  w: number;
  h: number;
  rotY: number;
}

const Scene: React.FC<{
  artworks: Artwork[];
  progress: MotionValue<number>;
  reduce: boolean;
  onFocus: (i: number) => void;
  onSelect: (i: number) => void;
}> = ({ artworks, progress, reduce, onFocus, onSelect }) => {
  const n = artworks.length;
  const { camera, gl } = useThree();
  const maxAniso = gl.capabilities.getMaxAnisotropy();

  const urls = useMemo(() => artworks.map((a) => cldFull(a.src, 820)), [artworks]);
  const textures = useProgressiveTextures(urls, maxAniso);
  const poolTex = useMemo(makePoolTexture, []);

  const places = useMemo<Placement[]>(
    () =>
      artworks.map((a, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const [w, h] = printSize(a.aspect);
        return {
          side,
          wallX: side * HALF_W,
          z: FIRST_Z - i * SPACING,
          w,
          h,
          rotY: side === -1 ? Math.PI / 2 : -Math.PI / 2,
        };
      }),
    [artworks],
  );

  // Corridor extent → camera travel + room geometry length.
  const lastZ = FIRST_Z - (n - 1) * SPACING;
  const camEnd = lastZ - 7;
  const travel = CAM_START - camEnd;
  const roomLen = travel + 60;
  const roomMidZ = (CAM_START + camEnd) / 2;

  // refs we mutate per-frame
  const printMesh = useRef<THREE.Mesh[]>([]);
  const printMat = useRef<THREE.MeshBasicMaterial[]>([]);
  const wallPoolMat = useRef<THREE.MeshBasicMaterial[]>([]);
  const floorPoolMat = useRef<THREE.MeshBasicMaterial[]>([]);
  const appear = useRef<number[]>(artworks.map(() => 0));
  const lit = useRef<number[]>(artworks.map(() => 0));
  const scl = useRef<number[]>(artworks.map(() => 1));
  const hovered = useRef(-1);
  const focusIdx = useRef(-1);

  useFrame((state, delta) => {
    const p = progress.get();
    const camZ = CAM_START - p * travel;
    const { pointer, clock } = state;
    const t = clock.elapsedTime;
    const k = Math.min(1, delta * 6);

    // Glide forward; drift gently toward the cursor and look down the walls.
    camera.position.z = camZ;
    camera.position.x += (pointer.x * 1.25 - camera.position.x) * 0.05;
    camera.position.y += (pointer.y * 0.7 - camera.position.y) * 0.05;
    const sway = reduce ? 0 : Math.sin(t * 0.25) * 0.012;
    camera.rotation.y = -pointer.x * 0.09 + sway;
    camera.rotation.x = pointer.y * 0.06;

    // The piece the camera is currently passing (a touch ahead of the lens).
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < n; i++) {
      const d = Math.abs(places[i].z - (camZ - 2.5));
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best !== focusIdx.current) {
      focusIdx.current = best;
      onFocus(best);
    }

    for (let i = 0; i < n; i++) {
      const pm = printMesh.current[i];
      const pMat = printMat.current[i];
      const wMat = wallPoolMat.current[i];
      const fMat = floorPoolMat.current[i];
      if (!pm || !pMat || !wMat || !fMat) continue;

      // Bind the photo once it has decoded, then ramp the print's color from
      // black to full — a "fade up from black" over the dark frame. The print is
      // opaque (color reveal, not alpha), so it never fights the additive pools
      // in the transparent sort, and a not-yet-loaded frame just reads as dark.
      const tex = textures.current[i];
      if (tex && pMat.map !== tex) {
        pMat.map = tex;
        pMat.needsUpdate = true;
      }
      const aTarget = tex ? 1 : 0;
      appear.current[i] += (aTarget - appear.current[i]) * Math.min(1, delta * 3);
      pMat.color.setScalar(appear.current[i]);

      // spotlight response — the focused (or hovered) piece blooms
      const isFocus = i === focusIdx.current || i === hovered.current;
      lit.current[i] += ((isFocus ? 1 : 0) - lit.current[i]) * k;
      const L = lit.current[i];
      wMat.opacity = 0.5 + L * 0.5;
      fMat.opacity = 0.22 + L * 0.32;

      const sTarget = i === hovered.current ? 1.05 : 1 + L * 0.02;
      scl.current[i] += (sTarget - scl.current[i]) * k;
      pm.scale.setScalar(scl.current[i]);
    }
  });

  const onOver = (i: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hovered.current = i;
    document.body.style.cursor = 'pointer';
  };
  const onOut = () => {
    hovered.current = -1;
    document.body.style.cursor = '';
  };
  const onClick = (i: number) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(i);
  };

  return (
    <group>
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 9, 58]} />

      {/* ── The room shell ── */}
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, roomMidZ]}>
        <planeGeometry args={[HALF_W * 2, roomLen]} />
        <meshBasicMaterial color="#070708" toneMapped={false} />
      </mesh>
      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, CEIL_Y, roomMidZ]}>
        <planeGeometry args={[HALF_W * 2, roomLen]} />
        <meshBasicMaterial color="#0a0a0c" toneMapped={false} />
      </mesh>
      {/* left + right walls */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-HALF_W, (FLOOR_Y + CEIL_Y) / 2, roomMidZ]}>
        <planeGeometry args={[roomLen, CEIL_Y - FLOOR_Y]} />
        <meshBasicMaterial color="#101013" toneMapped={false} />
      </mesh>
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[HALF_W, (FLOOR_Y + CEIL_Y) / 2, roomMidZ]}>
        <planeGeometry args={[roomLen, CEIL_Y - FLOOR_Y]} />
        <meshBasicMaterial color="#101013" toneMapped={false} />
      </mesh>
      {/* a faint warm track of light down the ceiling centre */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, CEIL_Y - 0.02, roomMidZ]}>
        <planeGeometry args={[0.5, roomLen]} />
        <meshBasicMaterial
          map={poolTex}
          color="#ffe9c4"
          transparent
          opacity={0.12}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* ── The hung works ── */}
      {places.map((pl, i) => {
        const frameW = pl.w + 0.16;
        const frameH = pl.h + 0.16;
        return (
          <group key={i}>
            {/* wall spotlight wash (behind the frame, on the wall) */}
            <mesh position={[pl.side * (HALF_W - 0.02), 0, pl.z]} rotation={[0, pl.rotY, 0]}>
              <planeGeometry args={[frameW + 2.0, frameH + 2.2]} />
              <meshBasicMaterial
                ref={(el) => el && (wallPoolMat.current[i] = el)}
                map={poolTex}
                color="#ffe7be"
                transparent
                opacity={0.5}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </mesh>

            {/* dark float frame */}
            <mesh position={[pl.side * (HALF_W - 0.05), 0, pl.z]} rotation={[0, pl.rotY, 0]}>
              <planeGeometry args={[frameW, frameH]} />
              <meshBasicMaterial color="#050506" toneMapped={false} />
            </mesh>

            {/* the print — fades in over the frame once its texture decodes */}
            <mesh
              ref={(el) => el && (printMesh.current[i] = el)}
              position={[pl.side * (HALF_W - 0.07), 0, pl.z]}
              rotation={[0, pl.rotY, 0]}
              onPointerOver={onOver(i)}
              onPointerOut={onOut}
              onClick={onClick(i)}
            >
              <planeGeometry args={[pl.w, pl.h]} />
              <meshBasicMaterial
                ref={(el) => el && (printMat.current[i] = el)}
                color="#050506"
                toneMapped={false}
              />
            </mesh>

            {/* pooled light on the polished floor in front of the piece */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[pl.side * (HALF_W - 1.1), FLOOR_Y + 0.01, pl.z]}
            >
              <planeGeometry args={[pl.w + 1.4, 3.6]} />
              <meshBasicMaterial
                ref={(el) => el && (floorPoolMat.current[i] = el)}
                map={poolTex}
                color="#ffdfae"
                transparent
                opacity={0.22}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

/** The corridor canvas. Lazily imported so three.js stays out of the main bundle. */
const GalleryRoomScene: React.FC<{
  artworks: Artwork[];
  progress: MotionValue<number>;
  active: boolean;
  reduce: boolean;
  onFocus: (i: number) => void;
  onSelect: (i: number) => void;
}> = ({ artworks, progress, active, reduce, onFocus, onSelect }) => (
  <Canvas
    dpr={[1, 1.75]}
    gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
    style={{ position: 'absolute', inset: 0 }}
    camera={{ fov: 62, position: [0, 0, CAM_START], near: 0.1, far: 260 }}
    frameloop={active ? 'always' : 'never'}
  >
    <ReleaseContextOnUnmount />
    <Scene
      artworks={artworks}
      progress={progress}
      reduce={reduce}
      onFocus={onFocus}
      onSelect={onSelect}
    />
  </Canvas>
);

export default GalleryRoomScene;
