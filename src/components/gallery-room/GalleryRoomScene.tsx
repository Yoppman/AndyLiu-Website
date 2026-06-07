import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import type { MotionValue } from 'framer-motion';
import { cldFull } from '../gallery/shared/cloudinaryUtils';
import ReleaseContextOnUnmount from '../webgl/ReleaseContextOnUnmount';

/**
 * "The Gallery Room" — walk a 3D museum the camera glides through on scroll.
 *
 * The hall no longer runs dead straight: it switchbacks through 90° turns
 * (a clean staircase into the -X/-Z quadrant, so it can never cross itself).
 * Each leg is built in local space as a straight hall and dropped into place
 * via a transformed group, so the turn geometry stays simple. A silhouette
 * visitor walks the route a few paces ahead of you, giving scale and life.
 * Dressing is Vatican-museum: marble checker floor, coffered ceiling, gold
 * frames, warm two-tone walls with pilasters + a gilt cornice — all unlit
 * (warm additive "spotlight pools" do the lighting), so there is no per-light
 * shader cost to threaten the WebGL budget.
 */

export interface Artwork {
  src: string;
  slug: string;
  title: string;
  region?: string;
  aspect: number;
}

// ── Room metrics (world units) ──
const HALF_W = 3.4; // half aisle width
const AISLE = HALF_W * 2;
const FLOOR_Y = -2.2;
const CEIL_Y = 3.0;
const MID_Y = (FLOOR_Y + CEIL_Y) / 2;
const WALL_H = CEIL_Y - FLOOR_Y;
const SEG = 5.0; // gap between artwork slots along a leg
const PER_LEG = 6; // slots per leg (alternating walls → 3 a side)
const SLOT_PAD = 4.5; // from a leg's start to its first slot
const END_PAD = 4.5; // from last slot to the corner
const LEG_LEN = SLOT_PAD + (PER_LEG - 1) * SEG + END_PAD; // every leg is full length
const CORNER_BLEND = 2.8; // how gently the gaze rounds each corner
const CAM_START_D = -5;
const FIG_LEAD = 4.6; // how far ahead the visitor walks
const FIG_H = 1.78;
const FIG_W = 0.92;

// Warm museum palette (unlit, so these read as-is under the additive pools).
const COL = {
  bg: '#0c0907',
  wall: '#4a3a2a',
  dado: '#33271b',
  gold: '#a07d42',
  pilaster: '#56432f',
  frame: '#b9933f',
  liner: '#1a140c',
};

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

interface Leg {
  start: { x: number; z: number };
  dir: { x: number; z: number };
  yaw: number; // camera/group yaw that maps local -Z onto dir
  startS: number; // path distance at this leg's start
  slots: { gi: number; localZ: number; side: number }[];
}

/** Point on the polyline path at distance d (extrapolates before the start). */
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

/** Camera yaw at distance d, blended smoothly through the nearest corner. */
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
  // corner at the start of this leg (turn from the previous one)
  if (k >= 1 && Math.abs(d - legs[k].startS) < CORNER_BLEND) {
    const s = legs[k].startS;
    yaw = lerpAngle(legs[k - 1].yaw, legs[k].yaw, smoothstep(s - CORNER_BLEND, s + CORNER_BLEND, d));
  } else if (k < legs.length - 1) {
    // corner at the end of this leg (turn into the next one)
    const s = legs[k + 1].startS;
    if (Math.abs(d - s) < CORNER_BLEND) {
      yaw = lerpAngle(legs[k].yaw, legs[k + 1].yaw, smoothstep(s - CORNER_BLEND, s + CORNER_BLEND, d));
    }
  }
  return yaw;
}

/** Warm radial gradient — the spotlight wash, shared by every pool. */
function makePool(): THREE.CanvasTexture {
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

/** Soft dark blob — the visitor's contact shadow. */
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

/** Travertine checker floor with faint veining and grout. */
function makeMarble(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#c0ac84';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#a68f67';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillRect(128, 128, 128, 128);
  // veins
  for (let i = 0; i < 24; i++) {
    ctx.strokeStyle = i % 2 ? 'rgba(255,250,240,0.06)' : 'rgba(70,52,34,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const x = (i * 53) % 256;
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + 30, 80, x - 20, 170, x + 15, 256);
    ctx.stroke();
  }
  // grout
  ctx.strokeStyle = 'rgba(40,28,16,0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 256, 256);
  ctx.beginPath();
  ctx.moveTo(128, 0);
  ctx.lineTo(128, 256);
  ctx.moveTo(0, 128);
  ctx.lineTo(256, 128);
  ctx.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/** A single coffer cell (recessed panel + gilt beads), tiled across the ceiling. */
function makeCoffer(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#2a2014';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#4a3a28';
  ctx.fillRect(20, 20, 216, 216);
  ctx.fillStyle = '#5a4730';
  ctx.fillRect(46, 46, 164, 164);
  ctx.strokeStyle = '#1d1509';
  ctx.lineWidth = 8;
  ctx.strokeRect(20, 20, 216, 216);
  ctx.fillStyle = '#9c7a43';
  for (const [x, y] of [[20, 20], [236, 20], [20, 236], [236, 236], [128, 128]] as const) {
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** An elegant standing visitor, drawn as a dark silhouette (long coat). */
function makeFigure(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#15110b';
  // head
  ctx.beginPath();
  ctx.arc(128, 78, 30, 0, Math.PI * 2);
  ctx.fill();
  // neck
  ctx.fillRect(116, 100, 24, 26);
  // shoulders + long coat, gently flared, with a hint of stride at the hem
  ctx.beginPath();
  ctx.moveTo(96, 128);
  ctx.bezierCurveTo(78, 138, 74, 150, 78, 168); // left shoulder/arm
  ctx.lineTo(86, 320);
  ctx.bezierCurveTo(82, 400, 80, 450, 96, 486); // left hem
  ctx.lineTo(120, 486);
  ctx.lineTo(124, 360); // inner split
  ctx.lineTo(132, 360);
  ctx.lineTo(140, 486);
  ctx.lineTo(164, 486);
  ctx.bezierCurveTo(178, 450, 176, 398, 170, 320); // right hem
  ctx.lineTo(178, 168);
  ctx.bezierCurveTo(182, 150, 178, 138, 160, 128); // right shoulder/arm
  ctx.closePath();
  ctx.fill();
  return new THREE.CanvasTexture(c);
}

/** Per-texture progressive loader (FloatingGallery pattern): decode() before
 *  commit so the first GPU upload is never a half-decoded black frame; a ref,
 *  not state, so a slot filling in never re-renders the scene. */
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

// Pilaster z-positions on every leg (between the slots, flanking each piece).
const PILASTER_Z: number[] = [];
for (let p = -1; p < PER_LEG; p++) PILASTER_Z.push(-(SLOT_PAD + (p + 0.5) * SEG));

const WallRun: React.FC<{ side: number; len: number }> = ({ side, len }) => {
  const rotY = side === -1 ? Math.PI / 2 : -Math.PI / 2;
  const x = side * HALF_W;
  const xi = side * (HALF_W - 0.02); // overlays sit just in front of the base wall
  return (
    <group>
      <mesh position={[x, MID_Y, -len / 2]} rotation={[0, rotY, 0]}>
        <planeGeometry args={[len + 4, WALL_H]} />
        <meshBasicMaterial color={COL.wall} toneMapped={false} />
      </mesh>
      {/* dado */}
      <mesh position={[xi, FLOOR_Y + 0.8, -len / 2]} rotation={[0, rotY, 0]}>
        <planeGeometry args={[len + 4, 1.6]} />
        <meshBasicMaterial color={COL.dado} toneMapped={false} />
      </mesh>
      {/* chair rail + cornice */}
      <mesh position={[xi, FLOOR_Y + 1.6, -len / 2]} rotation={[0, rotY, 0]}>
        <planeGeometry args={[len + 4, 0.07]} />
        <meshBasicMaterial color={COL.gold} toneMapped={false} />
      </mesh>
      <mesh position={[xi, CEIL_Y - 0.35, -len / 2]} rotation={[0, rotY, 0]}>
        <planeGeometry args={[len + 4, 0.14]} />
        <meshBasicMaterial color={COL.gold} toneMapped={false} />
      </mesh>
      {/* pilasters with gilt capitals */}
      {PILASTER_Z.map((z, i) => (
        <group key={i}>
          <mesh position={[xi, MID_Y + 0.2, z]} rotation={[0, rotY, 0]}>
            <planeGeometry args={[0.55, WALL_H - 1.0]} />
            <meshBasicMaterial color={COL.pilaster} toneMapped={false} />
          </mesh>
          <mesh position={[side * (HALF_W - 0.035), CEIL_Y - 0.72, z]} rotation={[0, rotY, 0]}>
            <planeGeometry args={[0.66, 0.16]} />
            <meshBasicMaterial color={COL.gold} toneMapped={false} />
          </mesh>
        </group>
      ))}
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
  const shadowTex = useMemo(makeShadow, []);
  const figureTex = useMemo(makeFigure, []);
  const marbleTex = useMemo(() => {
    const t = makeMarble();
    t.repeat.set((AISLE) / 2.6, (LEG_LEN + 4) / 2.6);
    return t;
  }, []);
  const cofferTex = useMemo(() => {
    const t = makeCoffer();
    t.repeat.set(AISLE / 3.4, (LEG_LEN + 4) / 3.4);
    return t;
  }, []);

  // Build the switchback path + per-leg slot layout.
  const built = useMemo(() => {
    const legCount = Math.ceil(n / PER_LEG);
    const legs: Leg[] = [];
    const sArr = new Array<number>(n);
    let cur = { x: 0, z: 0 };
    let dir = { x: 0, z: -1 }; // start heading -Z
    const rotateY = (v: { x: number; z: number }, a: number) => ({
      x: v.x * Math.cos(a) + v.z * Math.sin(a),
      z: -v.x * Math.sin(a) + v.z * Math.cos(a),
    });
    for (let k = 0; k < legCount; k++) {
      const yaw = Math.atan2(-dir.x, -dir.z);
      const startS = k * LEG_LEN;
      const slots: { gi: number; localZ: number; side: number }[] = [];
      for (let slot = 0; slot < PER_LEG; slot++) {
        const gi = k * PER_LEG + slot;
        if (gi >= n) break;
        slots.push({ gi, localZ: -(SLOT_PAD + slot * SEG), side: slot % 2 === 0 ? -1 : 1 });
        sArr[gi] = startS + SLOT_PAD + slot * SEG;
      }
      legs.push({ start: { ...cur }, dir: { ...dir }, yaw, startS, slots });
      cur = { x: cur.x + dir.x * LEG_LEN, z: cur.z + dir.z * LEG_LEN };
      dir = rotateY(dir, k % 2 === 0 ? Math.PI / 2 : -Math.PI / 2); // alternate turns → staircase
    }
    const totalLen = legCount * LEG_LEN;
    // End a touch past the last piece, but never walk out the far end of the hall.
    const camEndD = Math.min(sArr[n - 1] + 8, totalLen - 3);
    return { legs, sArr, totalLen, travelD: camEndD - CAM_START_D };
  }, [n]);

  const { legs, sArr, totalLen, travelD } = built;

  const printMesh = useRef<THREE.Mesh[]>([]);
  const printMat = useRef<THREE.MeshBasicMaterial[]>([]);
  const wallPoolMat = useRef<THREE.MeshBasicMaterial[]>([]);
  const floorPoolMat = useRef<THREE.MeshBasicMaterial[]>([]);
  const figureRef = useRef<THREE.Mesh>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const appear = useRef<number[]>(artworks.map(() => 0));
  const litRef = useRef<number[]>(artworks.map(() => 0));
  const sclRef = useRef<number[]>(artworks.map(() => 1));
  const hovered = useRef(-1);
  const focusIdx = useRef(-1);

  useEffect(() => {
    camera.rotation.order = 'YXZ'; // yaw then pitch, no roll coupling through turns
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

    // the piece the camera is passing (a touch ahead, measured along the path)
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

    // the visitor, a few paces ahead, turning the corners before you do
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
      if (!pm || !pMat || !wMat || !fMat) continue;

      const tex = textures.current[i];
      if (tex && pMat.map !== tex) {
        pMat.map = tex;
        pMat.needsUpdate = true;
      }
      appear.current[i] += ((tex ? 1 : 0) - appear.current[i]) * Math.min(1, delta * 3);
      pMat.color.setScalar(appear.current[i]); // fade up from black (opaque → no sort fight)

      const isFocus = i === focusIdx.current || i === hovered.current;
      litRef.current[i] += ((isFocus ? 1 : 0) - litRef.current[i]) * k;
      const L = litRef.current[i];
      wMat.opacity = 0.5 + L * 0.5;
      fMat.opacity = 0.22 + L * 0.32;

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
      <color attach="background" args={[COL.bg]} />
      <fog attach="fog" args={[COL.bg, 9, 60]} />

      {/* the visitor + contact shadow (world space) */}
      <mesh ref={figureRef} position={[0, FLOOR_Y + FIG_H / 2, -5]}>
        <planeGeometry args={[FIG_W, FIG_H]} />
        <meshBasicMaterial map={figureTex} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y + 0.02, -5]}>
        <planeGeometry args={[1.5, 1.05]} />
        <meshBasicMaterial map={shadowTex} color="#000000" transparent opacity={0.5} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* one transformed group per leg — a straight hall in local space */}
      {legs.map((leg, li) => (
        <group key={li} position={[leg.start.x, 0, leg.start.z]} rotation={[0, leg.yaw, 0]}>
          {/* floor + ceiling (tiny per-leg y offset avoids coplanar z-fighting at corners) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y - li * 0.001, -LEG_LEN / 2]}>
            <planeGeometry args={[AISLE, LEG_LEN + 4]} />
            <meshBasicMaterial map={marbleTex} toneMapped={false} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, CEIL_Y + li * 0.001, -LEG_LEN / 2]}>
            <planeGeometry args={[AISLE, LEG_LEN + 4]} />
            <meshBasicMaterial map={cofferTex} toneMapped={false} />
          </mesh>
          {/* a faint warm track of light down the ceiling centre */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, CEIL_Y - 0.03, -LEG_LEN / 2]}>
            <planeGeometry args={[0.5, LEG_LEN + 4]} />
            <meshBasicMaterial map={poolTex} color="#ffe9c4" transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </mesh>

          <WallRun side={-1} len={LEG_LEN} />
          <WallRun side={1} len={LEG_LEN} />

          {/* the hung works on this leg */}
          {leg.slots.map((s) => {
            const a = artworks[s.gi];
            const aspect = a.aspect;
            let h = aspect < 1 ? 2.0 * 1.18 : 2.0;
            let w = h * aspect;
            if (w > 3.1) {
              w = 3.1;
              h = w / aspect;
            }
            const fw = w + 0.2;
            const fh = h + 0.2;
            const rotY = s.side === -1 ? Math.PI / 2 : -Math.PI / 2;
            return (
              <group key={s.gi}>
                {/* wall spotlight wash */}
                <mesh position={[s.side * (HALF_W - 0.02), 0, s.localZ]} rotation={[0, rotY, 0]}>
                  <planeGeometry args={[fw + 2.0, fh + 2.2]} />
                  <meshBasicMaterial
                    ref={(el) => el && (wallPoolMat.current[s.gi] = el)}
                    map={poolTex}
                    color="#ffe7be"
                    transparent
                    opacity={0.5}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    toneMapped={false}
                  />
                </mesh>
                {/* gilt frame + dark liner */}
                <mesh position={[s.side * (HALF_W - 0.05), 0, s.localZ]} rotation={[0, rotY, 0]}>
                  <planeGeometry args={[fw, fh]} />
                  <meshBasicMaterial color={COL.frame} toneMapped={false} />
                </mesh>
                <mesh position={[s.side * (HALF_W - 0.06), 0, s.localZ]} rotation={[0, rotY, 0]}>
                  <planeGeometry args={[w + 0.06, h + 0.06]} />
                  <meshBasicMaterial color={COL.liner} toneMapped={false} />
                </mesh>
                {/* the print — fades up from black as its texture decodes */}
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
                {/* pooled light on the polished floor in front of the piece */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[s.side * (HALF_W - 1.1), FLOOR_Y + 0.014, s.localZ]}>
                  <planeGeometry args={[w + 1.4, 3.6]} />
                  <meshBasicMaterial
                    ref={(el) => el && (floorPoolMat.current[s.gi] = el)}
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
