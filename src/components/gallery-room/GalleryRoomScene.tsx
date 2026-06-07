import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import type { MotionValue } from 'framer-motion';
import { cldFull } from '../gallery/shared/cloudinaryUtils';
import ReleaseContextOnUnmount from '../webgl/ReleaseContextOnUnmount';

/**
 * "The Gallery Room" — a dark, minimal hall of light the camera glides through.
 *
 * Modern and abstract, not a literal museum: the architecture recedes into the
 * dark (ink walls, a near-black glossy floor, an open void overhead) so the
 * light and the photographs are the only subjects. Each frameless print is
 * carved out by a soft volumetric beam descending in front of it, a crisp wash
 * behind it, and a pool of light gathering on the floor; the piece the camera
 * is passing ignites amber. The hall switchbacks through 90° turns, and a lone
 * silhouette visitor walks the route a few paces ahead of you.
 *
 * Everything is unlit (additive light gradients + fog), so there is no per-light
 * shader cost — the WebGL budget discipline (gate, ReleaseContextOnUnmount,
 * error→poster, progressive decode textures) is unchanged.
 */

export interface Artwork {
  src: string;
  slug: string;
  title: string;
  region?: string;
  aspect: number;
}

// ── Room metrics (world units) ──
const HALF_W = 3.4;
const AISLE = HALF_W * 2;
const FLOOR_Y = -2.2;
const CEIL_Y = 3.2;
const MID_Y = (FLOOR_Y + CEIL_Y) / 2;
const WALL_H = CEIL_Y - FLOOR_Y;
const SEG = 5.0;
const PER_LEG = 6;
const SLOT_PAD = 4.5;
const END_PAD = 4.5;
const LEG_LEN = SLOT_PAD + (PER_LEG - 1) * SEG + END_PAD;
const CORNER_BLEND = 2.8;
const CAM_START_D = -5;
const FIG_LEAD = 4.6;
const FIG_H = 1.78;
const FIG_W = 0.92;

const BG = '#0a0a0b';
const WALL = '#0c0c0e';
const FLOOR_COL = '#070708';
const BACKING = '#050506';
const BASE_LIGHT = new THREE.Color('#efeae1'); // bone — the neutral wash
const AMBER = new THREE.Color('#f59e0b'); // the focused piece

const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const lerpAngle = (a: number, b: number, t: number) => {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};

function printSize(aspect: number): [number, number] {
  let h = aspect < 1 ? 2.0 * 1.18 : 2.0;
  let w = h * aspect;
  if (w > 3.1) {
    w = 3.1;
    h = w / aspect;
  }
  return [w, h];
}

interface Leg {
  start: { x: number; z: number };
  dir: { x: number; z: number };
  yaw: number; // group/camera yaw that maps local -Z onto dir
  startS: number;
  slots: { gi: number; localZ: number; side: number }[];
}

function posAlong(legs: Leg[], d: number): [number, number] {
  if (d <= 0) {
    const l = legs[0];
    return [l.start.x + l.dir.x * d, l.start.z + l.dir.z * d];
  }
  let rem = d;
  for (let k = 0; k < legs.length; k++) {
    if (k === legs.length - 1 || rem <= LEG_LEN) {
      const l = legs[k];
      return [l.start.x + l.dir.x * rem, l.start.z + l.dir.z * rem];
    }
    rem -= LEG_LEN;
  }
  const l = legs[legs.length - 1];
  return [l.start.x + l.dir.x * rem, l.start.z + l.dir.z * rem];
}

function camYawAt(legs: Leg[], d: number): number {
  let rem = d;
  let k = 0;
  if (d > 0) {
    for (; k < legs.length; k++) {
      if (k === legs.length - 1 || rem <= LEG_LEN) break;
      rem -= LEG_LEN;
    }
  }
  let yaw = legs[k].yaw;
  if (k >= 1 && Math.abs(d - legs[k].startS) < CORNER_BLEND) {
    const s = legs[k].startS;
    yaw = lerpAngle(legs[k - 1].yaw, legs[k].yaw, smoothstep(s - CORNER_BLEND, s + CORNER_BLEND, d));
  } else if (k < legs.length - 1) {
    const s = legs[k + 1].startS;
    if (Math.abs(d - s) < CORNER_BLEND) {
      yaw = lerpAngle(legs[k].yaw, legs[k + 1].yaw, smoothstep(s - CORNER_BLEND, s + CORNER_BLEND, d));
    }
  }
  return yaw;
}

/** Soft radial gradient (neutral white) — tinted per material for the pools. */
function makePool(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.4)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A soft vertical beam — bright core, fading sides, fading toward the floor. */
function makeShaft(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const h = ctx.createLinearGradient(0, 0, 64, 0);
  h.addColorStop(0, 'rgba(255,255,255,0)');
  h.addColorStop(0.5, 'rgba(255,255,255,1)');
  h.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = h;
  ctx.fillRect(0, 0, 64, 256);
  // taper the column vertically (soft at the source, fading out at the floor)
  ctx.globalCompositeOperation = 'destination-in';
  const v = ctx.createLinearGradient(0, 0, 0, 256);
  v.addColorStop(0, 'rgba(0,0,0,0.25)');
  v.addColorStop(0.28, 'rgba(0,0,0,1)');
  v.addColorStop(0.8, 'rgba(0,0,0,0.65)');
  v.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, 64, 256);
  ctx.globalCompositeOperation = 'source-over';
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeShadow(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(0,0,0,0.7)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.28)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/** An elegant standing visitor, drawn as a clean dark silhouette (long coat). */
function makeFigure(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#111013';
  ctx.beginPath();
  ctx.arc(128, 78, 29, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(117, 100, 22, 26);
  ctx.beginPath();
  ctx.moveTo(98, 128);
  ctx.bezierCurveTo(80, 138, 76, 150, 80, 168);
  ctx.lineTo(88, 320);
  ctx.bezierCurveTo(84, 400, 82, 450, 98, 486);
  ctx.lineTo(120, 486);
  ctx.lineTo(124, 360);
  ctx.lineTo(132, 360);
  ctx.lineTo(140, 486);
  ctx.lineTo(162, 486);
  ctx.bezierCurveTo(176, 450, 174, 398, 168, 320);
  ctx.lineTo(176, 168);
  ctx.bezierCurveTo(180, 150, 176, 138, 158, 128);
  ctx.closePath();
  ctx.fill();
  return new THREE.CanvasTexture(c);
}

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

/** A bare dark wall with two thin cove-light lines — modern, minimal. */
const WallRun: React.FC<{ side: number; len: number; poolTex: THREE.Texture }> = ({ side, len, poolTex }) => {
  const rotY = side === -1 ? Math.PI / 2 : -Math.PI / 2;
  const x = side * HALF_W;
  const xi = side * (HALF_W - 0.02);
  return (
    <group>
      <mesh position={[x, MID_Y, -len / 2]} rotation={[0, rotY, 0]}>
        <planeGeometry args={[len + 4, WALL_H]} />
        <meshBasicMaterial color={WALL} toneMapped={false} />
      </mesh>
      {/* cove light lines at floor + top — a faint architectural glow */}
      <mesh position={[xi, FLOOR_Y + 0.06, -len / 2]} rotation={[0, rotY, 0]}>
        <planeGeometry args={[len + 4, 0.5]} />
        <meshBasicMaterial map={poolTex} color={BASE_LIGHT} transparent opacity={0.18} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh position={[xi, CEIL_Y - 0.12, -len / 2]} rotation={[0, rotY, 0]}>
        <planeGeometry args={[len + 4, 0.4]} />
        <meshBasicMaterial map={poolTex} color={BASE_LIGHT} transparent opacity={0.14} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
    </group>
  );
};

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
  const poolTex = useMemo(makePool, []);
  const shaftTex = useMemo(makeShaft, []);
  const shadowTex = useMemo(makeShadow, []);
  const figureTex = useMemo(makeFigure, []);

  // Build the switchback path, the per-leg slots, and the world-space beams.
  const built = useMemo(() => {
    const legCount = Math.ceil(n / PER_LEG);
    const legs: Leg[] = [];
    const sArr = new Array<number>(n);
    const shafts = new Array<{ x: number; z: number; w: number }>(n);
    let cur = { x: 0, z: 0 };
    let dir = { x: 0, z: -1 };
    const rotateY = (v: { x: number; z: number }, a: number) => ({
      x: v.x * Math.cos(a) + v.z * Math.sin(a),
      z: -v.x * Math.sin(a) + v.z * Math.cos(a),
    });
    for (let k = 0; k < legCount; k++) {
      const yaw = Math.atan2(-dir.x, -dir.z);
      const startS = k * LEG_LEN;
      const perp = { x: Math.cos(yaw), z: -Math.sin(yaw) }; // world dir of local +X
      const slots: { gi: number; localZ: number; side: number }[] = [];
      for (let slot = 0; slot < PER_LEG; slot++) {
        const gi = k * PER_LEG + slot;
        if (gi >= n) break;
        const side = slot % 2 === 0 ? -1 : 1;
        const along = SLOT_PAD + slot * SEG;
        slots.push({ gi, localZ: -along, side });
        sArr[gi] = startS + along;
        const [w] = printSize(artworks[gi].aspect);
        // beam sits just in front of the piece, out in the aisle
        const cx = cur.x + dir.x * along + perp.x * side * (HALF_W - 0.8);
        const cz = cur.z + dir.z * along + perp.z * side * (HALF_W - 0.8);
        shafts[gi] = { x: cx, z: cz, w: w * 1.3 };
      }
      legs.push({ start: { ...cur }, dir: { ...dir }, yaw, startS, slots });
      cur = { x: cur.x + dir.x * LEG_LEN, z: cur.z + dir.z * LEG_LEN };
      dir = rotateY(dir, k % 2 === 0 ? Math.PI / 2 : -Math.PI / 2);
    }
    const totalLen = legCount * LEG_LEN;
    const camEndD = Math.min(sArr[n - 1] + 8, totalLen - 3);
    return { legs, sArr, shafts, totalLen, travelD: camEndD - CAM_START_D };
  }, [n, artworks]);

  const { legs, sArr, shafts, totalLen, travelD } = built;

  const printMesh = useRef<THREE.Mesh[]>([]);
  const printMat = useRef<THREE.MeshBasicMaterial[]>([]);
  const wallPoolMat = useRef<THREE.MeshBasicMaterial[]>([]);
  const floorPoolMat = useRef<THREE.MeshBasicMaterial[]>([]);
  const shaftMesh = useRef<THREE.Mesh[]>([]);
  const shaftMat = useRef<THREE.MeshBasicMaterial[]>([]);
  const figureRef = useRef<THREE.Mesh>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const appear = useRef<number[]>(artworks.map(() => 0));
  const litRef = useRef<number[]>(artworks.map(() => 0));
  const sclRef = useRef<number[]>(artworks.map(() => 1));
  const hovered = useRef(-1);
  const focusIdx = useRef(-1);

  useEffect(() => {
    camera.rotation.order = 'YXZ';
  }, [camera]);

  useFrame((state, delta) => {
    const p = progress.get();
    const d = CAM_START_D + p * travelD;
    const k = Math.min(1, delta * 6);
    const t = state.clock.elapsedTime;
    const { pointer } = state;

    const [cx, cz] = posAlong(legs, d);
    camera.position.set(cx, reduce ? 0 : Math.sin(t * 0.6) * 0.02, cz);
    camera.rotation.y = camYawAt(legs, d) - pointer.x * 0.06;
    camera.rotation.x = pointer.y * 0.05;

    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < n; i++) {
      const ds = Math.abs(sArr[i] - (d + 2.5));
      if (ds < bestD) {
        bestD = ds;
        best = i;
      }
    }
    if (best !== focusIdx.current) {
      focusIdx.current = best;
      onFocus(best);
    }

    const fd = Math.max(0.6, Math.min(totalLen - 0.6, d + FIG_LEAD));
    const [fx, fz] = posAlong(legs, fd);
    const fig = figureRef.current;
    const sh = shadowRef.current;
    if (fig) {
      const fbob = reduce ? 0 : Math.abs(Math.sin(t * 1.7)) * 0.045;
      fig.position.set(fx, FLOOR_Y + FIG_H / 2 + fbob, fz);
      fig.rotation.y = Math.atan2(camera.position.x - fx, camera.position.z - fz);
    }
    if (sh) sh.position.set(fx, FLOOR_Y + 0.02, fz);

    for (let i = 0; i < n; i++) {
      const pm = printMesh.current[i];
      const pMat = printMat.current[i];
      const wMat = wallPoolMat.current[i];
      const fMat = floorPoolMat.current[i];
      const sMat = shaftMat.current[i];
      const sMesh = shaftMesh.current[i];
      if (!pm || !pMat || !wMat || !fMat || !sMat || !sMesh) continue;

      const tex = textures.current[i];
      if (tex && pMat.map !== tex) {
        pMat.map = tex;
        pMat.needsUpdate = true;
      }
      appear.current[i] += ((tex ? 1 : 0) - appear.current[i]) * Math.min(1, delta * 3);
      pMat.color.setScalar(appear.current[i]); // fade up from black, opaque

      const isFocus = i === focusIdx.current || i === hovered.current;
      litRef.current[i] += ((isFocus ? 1 : 0) - litRef.current[i]) * k;
      const L = litRef.current[i];

      wMat.opacity = 0.42 + L * 0.6;
      wMat.color.copy(BASE_LIGHT).lerp(AMBER, L * 0.85);
      fMat.opacity = 0.2 + L * 0.42;
      fMat.color.copy(BASE_LIGHT).lerp(AMBER, L * 0.85);
      sMat.opacity = 0.1 + L * 0.26;
      sMat.color.copy(BASE_LIGHT).lerp(AMBER, L * 0.9);
      sMesh.rotation.y = Math.atan2(camera.position.x - shafts[i].x, camera.position.z - shafts[i].z);

      const sTarget = i === hovered.current ? 1.05 : 1 + L * 0.02;
      sclRef.current[i] += (sTarget - sclRef.current[i]) * k;
      pm.scale.setScalar(sclRef.current[i]);
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
      <fog attach="fog" args={[BG, 10, 60]} />

      {/* the visitor + contact shadow (world space) */}
      <mesh ref={figureRef} position={[0, FLOOR_Y + FIG_H / 2, -5]}>
        <planeGeometry args={[FIG_W, FIG_H]} />
        <meshBasicMaterial map={figureTex} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y + 0.02, -5]}>
        <planeGeometry args={[1.5, 1.05]} />
        <meshBasicMaterial map={shadowTex} color="#000000" transparent opacity={0.5} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* volumetric beams, in world space so they billboard cleanly */}
      {shafts.map((s, i) => (
        <mesh key={i} ref={(el) => el && (shaftMesh.current[i] = el)} position={[s.x, MID_Y + 0.3, s.z]}>
          <planeGeometry args={[s.w, WALL_H + 1.6]} />
          <meshBasicMaterial
            ref={(el) => el && (shaftMat.current[i] = el)}
            map={shaftTex}
            color={BASE_LIGHT}
            transparent
            opacity={0.1}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* one transformed group per leg — a straight hall in local space */}
      {legs.map((leg, li) => (
        <group key={li} position={[leg.start.x, 0, leg.start.z]} rotation={[0, leg.yaw, 0]}>
          {/* glossy dark floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y - li * 0.001, -LEG_LEN / 2]}>
            <planeGeometry args={[AISLE, LEG_LEN + 4]} />
            <meshBasicMaterial color={FLOOR_COL} toneMapped={false} />
          </mesh>

          <WallRun side={-1} len={LEG_LEN} poolTex={poolTex} />
          <WallRun side={1} len={LEG_LEN} poolTex={poolTex} />

          {/* a glow at the end of the hall — light you walk toward, then turn */}
          <mesh position={[0, MID_Y, -LEG_LEN - 1]}>
            <planeGeometry args={[AISLE + 2, WALL_H + 2]} />
            <meshBasicMaterial map={poolTex} color={BASE_LIGHT} transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </mesh>

          {/* the hung works on this leg */}
          {leg.slots.map((s) => {
            const [w, h] = printSize(artworks[s.gi].aspect);
            const rotY = s.side === -1 ? Math.PI / 2 : -Math.PI / 2;
            return (
              <group key={s.gi}>
                {/* broad wash on the wall */}
                <mesh position={[s.side * (HALF_W - 0.02), 0, s.localZ]} rotation={[0, rotY, 0]}>
                  <planeGeometry args={[w + 2.4, h + 2.8]} />
                  <meshBasicMaterial
                    ref={(el) => el && (wallPoolMat.current[s.gi] = el)}
                    map={poolTex}
                    color={BASE_LIGHT}
                    transparent
                    opacity={0.42}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    toneMapped={false}
                  />
                </mesh>
                {/* razor-thin dark reveal, then the frameless print */}
                <mesh position={[s.side * (HALF_W - 0.05), 0, s.localZ]} rotation={[0, rotY, 0]}>
                  <planeGeometry args={[w + 0.05, h + 0.05]} />
                  <meshBasicMaterial color={BACKING} toneMapped={false} />
                </mesh>
                <mesh
                  ref={(el) => el && (printMesh.current[s.gi] = el)}
                  position={[s.side * (HALF_W - 0.07), 0, s.localZ]}
                  rotation={[0, rotY, 0]}
                  onPointerOver={onOver(s.gi)}
                  onPointerOut={onOut}
                  onClick={onClick(s.gi)}
                >
                  <planeGeometry args={[w, h]} />
                  <meshBasicMaterial
                    ref={(el) => el && (printMat.current[s.gi] = el)}
                    color="#050506"
                    toneMapped={false}
                  />
                </mesh>
                {/* pool gathering on the polished floor */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[s.side * (HALF_W - 1.25), FLOOR_Y + 0.014, s.localZ]}>
                  <planeGeometry args={[w + 1.6, 4.2]} />
                  <meshBasicMaterial
                    ref={(el) => el && (floorPoolMat.current[s.gi] = el)}
                    map={poolTex}
                    color={BASE_LIGHT}
                    transparent
                    opacity={0.2}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    toneMapped={false}
                  />
                </mesh>
              </group>
            );
          })}
        </group>
      ))}
    </group>
  );
};

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
    camera={{ fov: 62, position: [0, 0, 5], near: 0.1, far: 320 }}
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
