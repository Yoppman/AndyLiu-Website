import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as THREE from 'three';
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import type { BufferGeometryNode } from '@react-three/fiber';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { motion } from 'motion/react';
import SceneErrorBoundary from '../webgl/SceneErrorBoundary';
import ReleaseContextOnUnmount from '../webgl/ReleaseContextOnUnmount';

extend({ RoundedBoxGeometry });

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      roundedBoxGeometry: BufferGeometryNode<RoundedBoxGeometry, typeof RoundedBoxGeometry>;
    }
  }
}

/**
 * "The Tool Before the Work" — a Sony A7C II floats alone in a black void,
 * reveals itself with a 315° turn, takes the viewer's photograph (one shutter
 * click), then quietly disassembles and hands the page over to the collection.
 *
 * The model is procedural: every dial, plate and ring is its own mesh built
 * from primitives, which is what makes the seam-split dissolution possible —
 * the parts that were always separate simply drift apart. No GLB to download,
 * so Phase 1's two seconds of darkness are pure pacing, identical on every
 * connection.
 *
 * Plays in full on every visit, and cannot be skipped or accelerated — the
 * viewer watches. Anticipation is the design.
 */

/* ----------------------------- timeline ----------------------------- */

const T_ROT_START = 2.0; // emergence ends, reveal rotation begins
const T_ROT_END = 6.0; // rotation lands on the top-front 3/4 pose
const T_SHUTTER = 6.8; // 0.4s of complete stillness, then the click
const T_DISSOLVE = 7.4;
const T_DISSOLVE_END = 10.0;
const T_END = 10.2;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
// Approximates the spec's cubic-bezier(0.16, 1, 0.3, 1): fast attack, long settle.
const outQuart = (x: number) => 1 - Math.pow(1 - clamp01(x), 4);
const inOutCubic = (x: number) => {
  const t = clamp01(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/**
 * The reveal rotation is deliberately non-uniform — it lingers on the front
 * and the top plate and hurries past the rear, the way a person turns an
 * object in their hands. Cubic-Hermite keyframes over normalized rotation
 * time; angles in degrees, tangents in deg per unit u.
 */
const ROT_KEYS = [
  { u: 0.0, a: 0, m: 70 }, // front: mount, grip, badge — slow
  { u: 0.32, a: 95, m: 360 }, // side profile
  { u: 0.55, a: 160, m: 450 }, // rear: functional, not beautiful — fastest
  { u: 0.78, a: 250, m: 280 },
  { u: 1.0, a: 315, m: 0 }, // decelerate into the resting pose
];

function revealAngle(u: number): number {
  const x = clamp01(u);
  let i = 0;
  while (i < ROT_KEYS.length - 2 && x > ROT_KEYS[i + 1].u) i++;
  const k0 = ROT_KEYS[i];
  const k1 = ROT_KEYS[i + 1];
  const span = k1.u - k0.u;
  const t = (x - k0.u) / span;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    k0.a * (2 * t3 - 3 * t2 + 1) +
    k0.m * span * (t3 - 2 * t2 + t) +
    k1.a * (-2 * t3 + 3 * t2) +
    k1.m * span * (t3 - t2)
  );
}

/* ----------------------------- shutter sound ----------------------------- */

/**
 * Synthesized A7C II-style mechanical click: two filtered noise bursts
 * (first curtain, second curtain ~60ms later), a sharp transient on top, a
 * low body thump underneath, and one quiet delay tap for room. No audio file,
 * <1ms of synthesis. If the browser blocks autoplay (no prior gesture on the
 * page), it fails silently — silence was the design's default anyway.
 */
function playShutterSound() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();

    const fire = () => {
      if (ctx.state !== 'running') {
        ctx.close().catch(() => {});
        return;
      }
      const t0 = ctx.currentTime + 0.02;
      const master = ctx.createGain();
      master.gain.value = 0.4; // intimate, not startling
      master.connect(ctx.destination);

      // single soft early reflection ≈ small studio
      const room = ctx.createDelay(0.2);
      room.delayTime.value = 0.05;
      const roomGain = ctx.createGain();
      roomGain.gain.value = 0.16;
      master.connect(room);
      room.connect(roomGain);
      roomGain.connect(ctx.destination);

      const noise = (at: number, dur: number, freq: number, q: number, vol: number) => {
        const len = Math.ceil(ctx.sampleRate * dur);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = freq;
        bp.Q.value = q;
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol, at);
        g.gain.exponentialRampToValueAtTime(0.001, at + dur);
        src.connect(bp).connect(g).connect(master);
        src.start(at);
      };
      const thump = (at: number, vol: number) => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(170, at);
        osc.frequency.exponentialRampToValueAtTime(70, at + 0.06);
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol, at);
        g.gain.exponentialRampToValueAtTime(0.001, at + 0.07);
        osc.connect(g).connect(master);
        osc.start(at);
        osc.stop(at + 0.08);
      };

      // first curtain
      noise(t0, 0.02, 1500, 1.2, 0.9);
      noise(t0 + 0.003, 0.012, 3900, 2.2, 0.5);
      thump(t0, 0.22);
      // second curtain
      noise(t0 + 0.058, 0.026, 1150, 1.1, 0.8);
      noise(t0 + 0.062, 0.01, 3100, 2.0, 0.35);
      thump(t0 + 0.058, 0.16);

      window.setTimeout(() => ctx.close().catch(() => {}), 1200);
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(fire).catch(() => ctx.close().catch(() => {}));
    } else {
      fire();
    }
  } catch {
    /* sound is garnish — never let it break the picture */
  }
}

/* ----------------------------- parts registry ----------------------------- */

type SizeClass = 'sm' | 'md' | 'body' | 'badge';

interface PartEntry {
  id: string;
  group: THREE.Group;
  mat: THREE.MeshStandardMaterial;
  basePos: THREE.Vector3;
  baseRot: THREE.Euler;
  dir: THREE.Vector3; // dissolution drift direction
  dist: number; // dissolution drift distance
  win: [number, number]; // dissolution window (smallest pieces first)
  spin: THREE.Vector3; // gentle tumble while drifting
  baseRough: number;
  baseMetal: number;
  baseEnv: number;
  baseEmissive: number;
}

const Registry = createContext<{ register: (e: PartEntry) => () => void } | null>(null);

function hash01(s: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

const DRIFT: Record<SizeClass, { win: [number, number]; dist: number }> = {
  sm: { win: [0.0, 0.42], dist: 0.46 },
  md: { win: [0.18, 0.68], dist: 0.34 },
  body: { win: [0.45, 0.92], dist: 0.2 },
  badge: { win: [0.86, 1.0], dist: 0.12 },
};

interface PartProps {
  id: string;
  size: SizeClass;
  pos: [number, number, number];
  rot?: [number, number, number];
  color: string;
  roughness: number;
  metalness: number;
  envMapIntensity?: number;
  emissive?: string;
  emissiveIntensity?: number;
  /** Alpha-masked decal texture (logos, the α badge glyph). */
  map?: THREE.Texture;
  /** Override drift direction (e.g. the badge floats forward, not outward). */
  drift?: [number, number, number];
  children: React.ReactNode;
}

const Part: React.FC<PartProps> = ({
  id,
  size,
  pos,
  rot,
  color,
  roughness,
  metalness,
  envMapIntensity = 0.5,
  emissive,
  emissiveIntensity = 0,
  map,
  drift,
  children,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const registry = useContext(Registry);

  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness,
        envMapIntensity,
        emissive: emissive ?? '#000000',
        emissiveIntensity,
        map: map ?? null,
        alphaTest: map ? 0.05 : 0,
        transparent: true,
        opacity: 0,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useEffect(() => () => mat.dispose(), [mat]);

  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group || !registry) return;
    const basePos = new THREE.Vector3(...pos);
    const h = (n: number) => hash01(id, n);
    const dir = drift
      ? new THREE.Vector3(...drift)
      : basePos
          .clone()
          .add(new THREE.Vector3((h(1) - 0.5) * 0.2, 0.2 + h(2) * 0.15, (h(3) - 0.5) * 0.2));
    if (dir.lengthSq() < 1e-4) dir.set(0, 0.6, 0.3); // the chassis sits at the origin
    dir.normalize();
    const { win, dist } = DRIFT[size];
    const stagger = size === 'sm' || size === 'md' ? h(4) * 0.12 : 0;
    const unregister = registry.register({
      id,
      group,
      mat,
      basePos,
      baseRot: group.rotation.clone(),
      dir,
      dist: dist * (0.8 + h(5) * 0.4),
      win: [win[0] + stagger, win[1]],
      spin: new THREE.Vector3((h(6) - 0.5) * 1.1, (h(7) - 0.5) * 1.1, (h(8) - 0.5) * 0.7),
      baseRough: roughness,
      baseMetal: metalness,
      baseEnv: envMapIntensity,
      baseEmissive: emissiveIntensity,
    });
    return unregister;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registry, mat]);

  return (
    <group ref={groupRef} position={pos} rotation={rot}>
      <mesh material={mat}>{children}</mesh>
    </group>
  );
};

/* ----------------------------- the camera ----------------------------- */

const RX90: [number, number, number] = [Math.PI / 2, 0, 0];
const RZ90: [number, number, number] = [0, 0, Math.PI / 2];

/** Alpha-masked text decal (the SONY mark, the α badge glyph). */
function useTextTexture(text: string, font: string, color: string, stretchX = 1) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 128;
    const g = c.getContext('2d');
    if (g) {
      g.clearRect(0, 0, c.width, c.height);
      g.font = font;
      g.fillStyle = color;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.setTransform(stretchX, 0, 0, 1, c.width / 2, c.height / 2);
      g.fillText(text, 0, 6);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [text, font, color, stretchX]);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

/**
 * A stylized Sony A7C II at 1 unit ≈ 100mm: 1.24 × 0.71 × 0.63 overall.
 * Front faces +Z, grip on -X (the viewer's left). Bare body, no lens — the
 * E-mount stays exposed because the sensor inside it is what "photographs"
 * the viewer at the shutter moment.
 */
const CameraModel: React.FC = () => {
  const sonyTex = useTextTexture('SONY', '700 78px "Times New Roman", serif', '#c4c7cc', 1.3);
  const alphaTex = useTextTexture('α', 'italic 700 104px Georgia, serif', '#ff4d00');

  return (
  <group>
    {/* chassis + top plate (separate, so the dissolution has a seam) */}
    <Part id="chassis" size="body" pos={[0, -0.03, 0]} color="#171717" roughness={0.6} metalness={0.32} envMapIntensity={0.45}>
      <roundedBoxGeometry args={[1.24, 0.64, 0.44, 4, 0.05]} />
    </Part>
    <Part id="top-plate" size="body" pos={[0, 0.315, 0]} color="#151515" roughness={0.52} metalness={0.4} envMapIntensity={0.55}>
      <roundedBoxGeometry args={[1.21, 0.1, 0.4, 4, 0.03]} />
    </Part>

    {/* grip — rubberized, the only fully matte mass */}
    <Part id="grip" size="md" pos={[-0.46, -0.02, 0.16]} color="#0e0e0e" roughness={0.92} metalness={0} envMapIntensity={0.18}>
      <roundedBoxGeometry args={[0.34, 0.66, 0.26, 4, 0.1]} />
    </Part>
    <Part id="thumb-rest" size="sm" pos={[-0.5, 0.16, -0.245]} color="#0e0e0e" roughness={0.92} metalness={0} envMapIntensity={0.18}>
      <roundedBoxGeometry args={[0.18, 0.2, 0.05, 2, 0.02]} />
    </Part>

    {/* E-mount: barrel, bayonet flange, dark throat, and the sensor itself */}
    <Part id="mount-barrel" size="md" pos={[0.1, 0, 0.245]} rot={RX90} color="#121212" roughness={0.45} metalness={0.55} envMapIntensity={0.6}>
      <cylinderGeometry args={[0.25, 0.25, 0.08, 48]} />
    </Part>
    <Part id="mount-flange" size="md" pos={[0.1, 0, 0.285]} color="#a8acb3" roughness={0.38} metalness={1} envMapIntensity={0.8}>
      <torusGeometry args={[0.2, 0.022, 16, 64]} />
    </Part>
    <Part id="mount-throat" size="md" pos={[0.1, 0, 0.252]} color="#020202" roughness={1} metalness={0} envMapIntensity={0}>
      <circleGeometry args={[0.21, 48]} />
    </Part>
    <Part id="sensor" size="md" pos={[0.1, 0, 0.258]} color="#15333c" roughness={0.12} metalness={0.85} envMapIntensity={0.9} emissive="#ffffff" emissiveIntensity={0}>
      <planeGeometry args={[0.3, 0.2]} />
    </Part>
    <Part id="lens-release" size="sm" pos={[-0.19, -0.12, 0.235]} rot={RX90} color="#1d1d1f" roughness={0.45} metalness={0.7} envMapIntensity={0.6}>
      <cylinderGeometry args={[0.035, 0.035, 0.025, 24]} />
    </Part>
    <Part id="af-lamp" size="sm" pos={[-0.27, 0.16, 0.224]} rot={RX90} color="#0a0a0c" roughness={0.08} metalness={0.5} envMapIntensity={1.2}>
      <cylinderGeometry args={[0.024, 0.024, 0.014, 20]} />
    </Part>

    {/* EVF bump, offset left — the rangefinder silhouette */}
    <Part id="evf" size="md" pos={[0.45, 0.405, -0.03]} color="#161616" roughness={0.58} metalness={0.35} envMapIntensity={0.45}>
      <roundedBoxGeometry args={[0.28, 0.11, 0.34, 3, 0.04]} />
    </Part>
    <Part id="eyecup" size="sm" pos={[0.45, 0.405, -0.22]} color="#0c0c0c" roughness={0.95} metalness={0} envMapIntensity={0.15}>
      <roundedBoxGeometry args={[0.2, 0.1, 0.04, 2, 0.015]} />
    </Part>
    <Part id="hot-shoe" size="sm" pos={[0.45, 0.458, -0.02]} color="#b4b8be" roughness={0.38} metalness={1} envMapIntensity={1}>
      <boxGeometry args={[0.16, 0.03, 0.18]} />
    </Part>

    {/* top plate — the cockpit */}
    <Part id="mode-dial" size="sm" pos={[0.1, 0.385, -0.1]} color="#1d1d1f" roughness={0.42} metalness={0.75} envMapIntensity={0.65}>
      <cylinderGeometry args={[0.095, 0.095, 0.05, 40]} />
    </Part>
    <Part id="exp-dial" size="sm" pos={[-0.16, 0.385, -0.13]} color="#1d1d1f" roughness={0.42} metalness={0.75} envMapIntensity={0.65}>
      <cylinderGeometry args={[0.075, 0.075, 0.05, 36]} />
    </Part>
    <Part id="shutter-base" size="sm" pos={[-0.44, 0.315, 0.25]} color="#1d1d1f" roughness={0.42} metalness={0.75} envMapIntensity={0.65}>
      <cylinderGeometry args={[0.07, 0.07, 0.04, 32]} />
    </Part>
    <Part id="shutter-button" size="sm" pos={[-0.44, 0.345, 0.25]} color="#cdd1d6" roughness={0.28} metalness={1} envMapIntensity={1.1}>
      <cylinderGeometry args={[0.045, 0.045, 0.02, 28]} />
    </Part>
    <Part id="front-dial" size="sm" pos={[-0.46, 0.2, 0.27]} rot={RZ90} color="#1d1d1f" roughness={0.42} metalness={0.75} envMapIntensity={0.65}>
      <cylinderGeometry args={[0.05, 0.05, 0.04, 28]} />
    </Part>

    {/* rear: LCD (dark mirror) and the control column */}
    <Part id="lcd" size="md" pos={[0.05, -0.04, -0.245]} color="#050507" roughness={0.06} metalness={0.45} envMapIntensity={1.4}>
      <roundedBoxGeometry args={[0.74, 0.48, 0.04, 3, 0.02]} />
    </Part>
    <Part id="rear-dial" size="sm" pos={[-0.5, 0.14, -0.235]} rot={RX90} color="#1d1d1f" roughness={0.42} metalness={0.75} envMapIntensity={0.65}>
      <cylinderGeometry args={[0.07, 0.07, 0.03, 32]} />
    </Part>
    <Part id="rear-btn-a" size="sm" pos={[-0.5, -0.02, -0.232]} rot={RX90} color="#19191b" roughness={0.5} metalness={0.6} envMapIntensity={0.5}>
      <cylinderGeometry args={[0.03, 0.03, 0.018, 20]} />
    </Part>
    <Part id="rear-btn-b" size="sm" pos={[-0.5, -0.14, -0.232]} rot={RX90} color="#19191b" roughness={0.5} metalness={0.6} envMapIntensity={0.5}>
      <cylinderGeometry args={[0.03, 0.03, 0.018, 20]} />
    </Part>

    {/* strap lugs — small, but they make the silhouette */}
    <Part id="lug-l" size="sm" pos={[-0.605, 0.2, 0]} rot={RZ90} color="#b4b8be" roughness={0.35} metalness={1} envMapIntensity={1}>
      <cylinderGeometry args={[0.025, 0.025, 0.06, 20]} />
    </Part>
    <Part id="lug-r" size="sm" pos={[0.605, 0.2, 0]} rot={RZ90} color="#b4b8be" roughness={0.35} metalness={1} envMapIntensity={1}>
      <cylinderGeometry args={[0.025, 0.025, 0.06, 20]} />
    </Part>

    {/* the SONY mark — quiet, silver, top-right of the front plate */}
    <Part id="sony-mark" size="sm" pos={[0.44, 0.17, 0.2225]} map={sonyTex} color="#c4c7cc" roughness={0.4} metalness={0.8} envMapIntensity={0.7}>
      <planeGeometry args={[0.3, 0.075]} />
    </Part>

    {/* the α badge — the only color on the entire model, and the last to go */}
    <Part id="badge" size="badge" pos={[-0.46, 0.02, 0.292]} drift={[0, 0, 1]} map={alphaTex} color="#ff4d00" roughness={0.6} metalness={0.1} envMapIntensity={0.15} emissive="#ff4800" emissiveIntensity={0.55}>
      <planeGeometry args={[0.22, 0.055]} />
    </Part>
  </group>
  );
};

/* ----------------------------- scene + sequencer ----------------------------- */

/** PMREM RoomEnvironment so the metals have something to reflect in the void. */
const StudioEnvironment: React.FC = () => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
};

interface IntroSceneProps {
  onSequenceEnd: () => void;
}

const IntroScene: React.FC<IntroSceneProps> = ({ onSequenceEnd }) => {
  const parts = useRef<PartEntry[]>([]);
  const registry = useMemo(
    () => ({
      register: (e: PartEntry) => {
        parts.current.push(e);
        return () => {
          parts.current = parts.current.filter((p) => p !== e);
        };
      },
    }),
    [],
  );

  const rootRef = useRef<THREE.Group>(null);
  const turnRef = useRef<THREE.Group>(null);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const rimRef = useRef<THREE.DirectionalLight>(null);
  const badgeLightRef = useRef<THREE.PointLight>(null);
  const flashRef = useRef<THREE.PointLight>(null);

  const t = useRef(0);
  const shutterFiredAt = useRef<number | null>(null);
  const ended = useRef(false);

  // Mobile: same animation, same timing, smaller object. Scale from the
  // visible width in world units so portrait phones never crop the body
  // (1.24 wide, ~1.4 on the diagonal mid-rotation).
  const viewportWidth = useThree((s) => s.viewport.width);
  const fitScale = Math.min(1, viewportWidth / 2.1);

  useFrame((_, delta) => {
    if (ended.current) return;
    t.current += Math.min(delta, 0.05);

    const time = t.current;
    const root = rootRef.current;
    const turn = turnRef.current;
    if (!root || !turn) return;

    /* phase 1 — emergence: rim first, surface later, 95% → 100% scale */
    const emerge = outQuart(time / 1.5);
    const scale = (0.95 + 0.05 * outQuart(time / 2)) * fitScale;
    root.scale.setScalar(scale);

    /* phase 2 — the reveal rotation, with a breathing tilt that dies before the pose */
    const u = clamp01((time - T_ROT_START) / (T_ROT_END - T_ROT_START));
    const still = 1 - smoothstep(5.1, T_ROT_END, time); // bob/tilt fade into stillness
    // Starts at -30° (front 3/4) and turns 315°, resting at +15° — front 3/4
    // from the other shoulder, which with the settle nod reads top-front.
    turn.rotation.y = -0.52 - THREE.MathUtils.degToRad(revealAngle(u));
    turn.rotation.x =
      0.14 * Math.sin(time * 0.85 + 0.6) * still +
      0.24 * inOutCubic((time - T_ROT_END) / 0.45); // settle: nod forward, show the top plate
    root.position.y = 0.014 * Math.sin(time * 1.3) * still;

    /* phase 3 — the shutter */
    if (shutterFiredAt.current === null && time >= T_SHUTTER) {
      shutterFiredAt.current = time;
      playShutterSound();
    }
    const press = clamp01((time - (T_SHUTTER - 0.14)) / 0.14);
    const release = clamp01((time - (T_SHUTTER + 0.1)) / 0.22);
    const pressY = -0.014 * (press * press) * (1 - inOutCubic(release));
    let flash = 0;
    if (shutterFiredAt.current !== null) {
      flash = clamp01(1 - (time - shutterFiredAt.current) / 0.09);
      // mechanical slap: a two-frame shiver
      if (time - shutterFiredAt.current < 0.05) {
        root.position.x = (Math.random() - 0.5) * 0.008;
        root.position.y += (Math.random() - 0.5) * 0.006;
      } else {
        root.position.x = 0;
      }
    }
    if (flashRef.current) flashRef.current.intensity = 9 * flash;

    /* phase 4 — dissolution: matte first, then the seams let go */
    const d = clamp01((time - T_DISSOLVE) / (T_DISSOLVE_END - T_DISSOLVE));
    const ghost = smoothstep(0, 0.5, d); // physical presence drains away
    const lightFade = 1 - smoothstep(0.5, 0.95, d);

    for (const p of parts.current) {
      const k = clamp01((d - p.win[0]) / (p.win[1] - p.win[0]));
      const ke = inOutCubic(k);
      p.group.position
        .copy(p.basePos)
        .addScaledVector(p.dir, ke * p.dist);
      if (p.id === 'shutter-button') p.group.position.y += pressY;
      p.group.rotation.set(
        p.baseRot.x + p.spin.x * ke,
        p.baseRot.y + p.spin.y * ke,
        p.baseRot.z + p.spin.z * ke,
      );
      p.mat.opacity = emerge * (1 - ke);
      p.mat.roughness = lerp(p.baseRough, 1, ghost);
      p.mat.metalness = lerp(p.baseMetal, 0, ghost);
      p.mat.envMapIntensity = lerp(p.baseEnv, 0.04, ghost);
      if (p.id === 'sensor') {
        p.mat.emissiveIntensity = 22 * flash;
      } else if (p.id === 'badge') {
        // the orange mark holds its glow until it is the only thing left
        p.mat.emissiveIntensity = p.baseEmissive * (1 - k * k);
      }
    }

    /* lights — rim leads (silhouette before surface), key and fill follow */
    if (rimRef.current)
      rimRef.current.intensity =
        lerp(3.6, 2.3, smoothstep(1.2, 2.6, time)) * outQuart(time / 0.7) * lightFade;
    if (keyRef.current)
      keyRef.current.intensity = 2.6 * outQuart((time - 0.55) / 1.45) * lightFade;
    if (fillRef.current)
      fillRef.current.intensity = 0.3 * outQuart((time - 0.8) / 1.4) * lightFade;
    if (badgeLightRef.current)
      badgeLightRef.current.intensity = 0.12 * emerge * lightFade * (1 - smoothstep(0.86, 1, d));

    if (time >= T_END) {
      ended.current = true;
      onSequenceEnd();
    }
  });

  return (
    <Registry.Provider value={registry}>
      <StudioEnvironment />
      <color attach="background" args={['#000000']} />

      {/* key: 5600K softbox, upper-left */}
      <directionalLight ref={keyRef} color="#eef3ff" position={[-3, 3.2, 2.6]} intensity={0} />
      {/* fill: 3200K whisper from lower-right */}
      <directionalLight ref={fillRef} color="#ffd9b0" position={[2.4, -1.8, 1.6]} intensity={0} />
      {/* rim: cold edge from behind — separates the object from the void */}
      <directionalLight ref={rimRef} color="#cfe0ff" position={[0.4, 0.9, -3.4]} intensity={0} />

      <group ref={rootRef}>
        <group ref={turnRef}>
          <CameraModel />
          {/* the badge's faint orange spill onto the grip */}
          <pointLight ref={badgeLightRef} color="#ff6a1a" position={[-0.46, 0.02, 0.38]} intensity={0} distance={0.5} decay={2} />
          {/* the sensor "capturing" the viewer */}
          <pointLight ref={flashRef} color="#ffffff" position={[0.1, 0, 0.6]} intensity={0} distance={3.5} decay={2} />
        </group>
      </group>
    </Registry.Provider>
  );
};

/* ----------------------------- overlay shell ----------------------------- */

/** Rendered by the error boundary if WebGL dies mid-intro: bail out gracefully. */
const AbortToCollection: React.FC<{ onAbort: () => void }> = ({ onAbort }) => {
  useEffect(() => onAbort(), [onAbort]);
  return null;
};

interface CameraIntroProps {
  /** Dissolution finished — mount the collection beneath the fading black. */
  onRevealed: () => void;
  /** Black overlay fully transparent — safe to unmount the intro. */
  onFinished: () => void;
}

const CameraIntro: React.FC<CameraIntroProps> = ({ onRevealed, onFinished }) => {
  const [fading, setFading] = useState(false);

  const endSequence = useCallback(() => {
    onRevealed();
    setFading(true);
  }, [onRevealed]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-black"
      aria-hidden
      initial={false}
      animate={{ opacity: fading ? 0 : 1 }}
      transition={{ duration: 1.1, ease: 'easeInOut' }}
      onAnimationComplete={() => fading && onFinished()}
      style={{ pointerEvents: fading ? 'none' : 'auto' }}
    >
      {!fading && (
        <SceneErrorBoundary fallback={<AbortToCollection onAbort={endSequence} />}>
          <Canvas
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
            camera={{ position: [0, 0.16, 2.75], fov: 33 }}
            onCreated={({ camera }) => camera.lookAt(0, 0.02, 0)}
            style={{ position: 'absolute', inset: 0 }}
          >
            <ReleaseContextOnUnmount />
            <IntroScene onSequenceEnd={endSequence} />
          </Canvas>
        </SceneErrorBoundary>
      )}
    </motion.div>
  );
};

export default CameraIntro;
