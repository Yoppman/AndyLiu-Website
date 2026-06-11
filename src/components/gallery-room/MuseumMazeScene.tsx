import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import ReleaseContextOnUnmount from '../webgl/ReleaseContextOnUnmount';
import { cldFull } from '../gallery/shared/cloudinaryUtils';
import { collide, worldToCell, type Maze, type WallFace } from './maze';

/**
 * "The Gallery Room" as a first-person museum at night.
 *
 * A seeded maze of charcoal walls hung with prints drawn at random from the
 * whole archive. The visitor walks it like a game — arrow keys / WASD, drag
 * to look, a fog-of-war minimap — hunting for the Heart, the lit chamber at
 * the farthest point of the building.
 *
 * Techniques worth knowing about before editing:
 * - All walls, moldings and picture-lamps are INSTANCED (3 draw calls for
 *   ~300 objects). Art planes are per-piece (each needs its own texture).
 * - Textures STREAM by proximity: a budgeted LRU keeps ~28 nearby prints in
 *   memory (Cloudinary w_512/w_1024), everything else lives as its
 *   dominant-color placeholder. Prints "develop" in over 0.9s as you near.
 * - Light is a POOL of 7 spotlights reassigned with hysteresis to the
 *   nearest hangs — the building reads fully lit but the GPU only ever pays
 *   for 7. Their warmth + FogExp2 does the night-museum grading.
 * - The floor "reflects" each print with a flipped-UV plane and a gradient
 *   alpha mask — wet-stone glow for the cost of one quad per piece.
 */

/* ----------------------------- shared types ----------------------------- */

export interface PlacedArt {
  src: string;
  title: string;
  slug: string;
  region?: string;
  aspect: number;
  color: string; // dominantColor, rgba(...) from gallery data
  face: WallFace;
  w: number;
  h: number;
  hero: boolean;
}

export interface MazeInput {
  keys: Set<string>;
  /** virtual joystick, -1..1 (mobile) */
  joyX: number;
  joyY: number;
  /** accumulated look-drag pixels since last frame (mouse/touch) */
  dragX: number;
}

export interface HudBridge {
  /** mutable tracking the page reads at its own pace (minimap) */
  track: { x: number; z: number; yaw: number; visited: Set<number>; rev: number };
  setFocus(a: PlacedArt | null): void;
  onDiscover(count: number): void;
  onGoal(): void;
  onReady(): void;
}

interface SceneProps {
  maze: Maze;
  arts: PlacedArt[];
  hud: HudBridge;
  input: React.MutableRefObject<MazeInput>;
  muted: React.MutableRefObject<boolean>;
  reduce: boolean;
  isMobile: boolean;
  /** `?start=heart` — spawn inside the Heart (light tuning / verification) */
  spawnAtHeart?: boolean;
}

/* ----------------------------- constants ----------------------------- */

const EYE = 1.62;
const WALL_H = 3.6;
const HANG_Y = 1.58;
const WALK = 2.7; // m/s
const RUN = 4.4;
const TURN = 2.2; // rad/s from arrow keys
const RADIUS = 0.38;

const LOAD_R = 12; // start streaming a print inside this
const DROP_R = 17; // dispose beyond this
const BUDGET = 28; // max simultaneously-loaded textures

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const damp = THREE.MathUtils.damp;

const rgbOf = (rgba: string): string => {
  const m = rgba.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  return m ? `rgb(${m[1]},${m[2]},${m[3]})` : '#1a1a1c';
};

/* ----------------------------- shared GPU resources ----------------------------- */

const BOX = new THREE.BoxGeometry(1, 1, 1);
const PLANE = new THREE.PlaneGeometry(1, 1);
// flipped-UV plane: same texture renders mirrored — the floor reflection
const PLANE_FLIP = (() => {
  const g = new THREE.PlaneGeometry(1, 1);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
  return g;
})();

function grainCanvas(seedMul: number, n: number, lo: number, hi: number): THREE.CanvasTexture {
  const size = 128;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  let s = seedMul;
  const rand = () => {
    s = (s * 48271) % 2147483647;
    return s / 2147483647;
  };
  if (g) {
    g.fillStyle = '#808080';
    g.fillRect(0, 0, size, size);
    for (let i = 0; i < n; i++) {
      const v = lo + Math.floor(rand() * (hi - lo));
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(rand() * size, rand() * size, 1 + Math.round(rand()), 1 + Math.round(rand()));
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** vertical fade for the floor reflections (bright at the wall, gone by the toe) */
const reflectionMask = (() => {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 64;
  const g = c.getContext('2d');
  if (g) {
    // canvas bottom = the wall side after the UV flip — bright there, gone at the toe
    const grad = g.createLinearGradient(0, 0, 0, 64);
    grad.addColorStop(0, '#000000');
    grad.addColorStop(0.45, '#3a3a3a');
    grad.addColorStop(1, '#ffffff');
    g.fillStyle = grad;
    g.fillRect(0, 0, 4, 64);
  }
  const t = new THREE.CanvasTexture(c);
  return t;
})();

/* ----------------------------- audio ----------------------------- */

/** Footsteps, discovery blips, the Heart chord — all synthesized, all quiet. */
class MazeAudio {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
      this.out = this.ctx.createGain();
      this.out.gain.value = 0.5;
      this.out.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  step(side: number) {
    const ctx = this.ensure();
    if (!ctx || !this.out || ctx.state !== 'running') return;
    const t0 = ctx.currentTime;
    const len = Math.ceil(ctx.sampleRate * 0.07);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 620 + Math.random() * 160;
    const pan = ctx.createStereoPanner();
    pan.pan.value = side * 0.22;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.16, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);
    src.connect(lp).connect(pan).connect(g).connect(this.out);
    src.start(t0);
  }

  blip() {
    const ctx = this.ensure();
    if (!ctx || !this.out || ctx.state !== 'running') return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1180, t0);
    osc.frequency.exponentialRampToValueAtTime(1760, t0 + 0.07);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
    osc.connect(g).connect(this.out);
    osc.start(t0);
    osc.stop(t0 + 0.25);
  }

  chord() {
    const ctx = this.ensure();
    if (!ctx || !this.out || ctx.state !== 'running') return;
    const t0 = ctx.currentTime;
    [220, 277.18, 329.63, 440].forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0 + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.045, t0 + i * 0.07 + 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.6);
      osc.connect(g).connect(this.out!);
      osc.start(t0 + i * 0.07);
      osc.stop(t0 + 2.8);
    });
  }

  /** Audio needs a user gesture; the page calls this on the first input. */
  unlock() {
    const ctx = this.ensure();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  }

  dispose() {
    this.ctx?.close().catch(() => {});
    this.ctx = null;
  }
}

/* ----------------------------- per-art runtime ----------------------------- */

interface ArtRuntime {
  art: PlacedArt;
  group: THREE.Group;
  photoMat: THREE.MeshStandardMaterial;
  photoMesh: THREE.Mesh;
  reflMat: THREE.MeshBasicMaterial;
  state: 0 | 1 | 2; // cold / loading / ready
  tex: THREE.Texture | null;
  fade: number;
  discovered: boolean;
  dist: number;
}

/* ----------------------------- the scene ----------------------------- */

const Inner: React.FC<SceneProps> = ({
  maze,
  arts,
  hud,
  input,
  muted,
  reduce,
  isMobile,
  spawnAtHeart,
}) => {
  const camera = useThree((s) => s.camera);

  /* --- materials (memo per mount; textures shared at module level) --- */
  const mats = useMemo(() => {
    const plaster = grainCanvas(7919, 5600, 108, 150);
    plaster.repeat.set(2.5, 2.5);
    const stone = grainCanvas(104729, 6200, 100, 156);
    stone.repeat.set(28, 22);
    return {
      wall: new THREE.MeshStandardMaterial({
        color: '#312f37',
        roughness: 0.94,
        metalness: 0,
        bumpMap: plaster,
        bumpScale: 0.004,
      }),
      floor: new THREE.MeshStandardMaterial({
        color: '#1a191d',
        roughness: 0.32,
        metalness: 0.32,
        bumpMap: stone,
        bumpScale: 0.0015,
      }),
      ceiling: new THREE.MeshStandardMaterial({ color: '#101013', roughness: 0.95, metalness: 0 }),
      molding: new THREE.MeshStandardMaterial({ color: '#080809', roughness: 0.42, metalness: 0.5 }),
      lamp: new THREE.MeshStandardMaterial({
        color: '#3a3325',
        roughness: 0.4,
        metalness: 0.6,
        emissive: '#ffc98a',
        emissiveIntensity: 2.0,
      }),
      can: new THREE.MeshStandardMaterial({
        color: '#0c0c0e',
        roughness: 0.6,
        metalness: 0.2,
        emissive: '#6a7184',
        emissiveIntensity: 0.55,
      }),
    };
  }, []);
  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => {
        m.bumpMap?.dispose();
        m.dispose();
      });
    },
    [mats],
  );

  /* --- static architecture: instanced walls + ceiling cans, single floor/ceiling --- */
  const wallsRef = useRef<THREE.InstancedMesh>(null);
  const cansRef = useRef<THREE.InstancedMesh>(null);
  const W = maze.cols * maze.cell;
  const D = maze.rows * maze.cell;

  useEffect(() => {
    const m = new THREE.Matrix4();
    const walls = wallsRef.current;
    if (walls) {
      maze.walls.forEach((w, i) => {
        m.makeScale(w.hx * 2, WALL_H, w.hz * 2);
        m.setPosition(w.cx, WALL_H / 2, w.cz);
        walls.setMatrixAt(i, m);
      });
      walls.instanceMatrix.needsUpdate = true;
      walls.computeBoundingSphere();
    }
    const cans = cansRef.current;
    if (cans) {
      let i = 0;
      for (let x = 0; x < maze.cols; x++)
        for (let y = 0; y < maze.rows; y++) {
          const wx = (x + 0.5 - maze.cols / 2) * maze.cell;
          const wz = (y + 0.5 - maze.rows / 2) * maze.cell;
          m.makeScale(0.5, 0.05, 0.5);
          m.setPosition(wx, WALL_H - 0.026, wz);
          cans.setMatrixAt(i++, m);
        }
      cans.instanceMatrix.needsUpdate = true;
      cans.computeBoundingSphere();
    }
  }, [maze]);

  /* --- the hang: imperative art layer (planes need per-piece textures) --- */
  const artLayer = useMemo(() => {
    const group = new THREE.Group();
    const moldings = new THREE.InstancedMesh(BOX, mats.molding, arts.length);
    const lamps = new THREE.InstancedMesh(BOX, mats.lamp, arts.length);
    const baseMats: THREE.MeshStandardMaterial[] = [];
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);

    const runtimes: ArtRuntime[] = arts.map((art, i) => {
      const { face } = art;
      const yaw = Math.atan2(face.nx, face.nz);
      q.setFromAxisAngle(up, yaw);

      // molding: a satin-black box the print floats on
      m.compose(
        new THREE.Vector3(face.wx + face.nx * 0.035, HANG_Y, face.wz + face.nz * 0.035),
        q,
        new THREE.Vector3(art.w + 0.09, art.h + 0.09, 0.07),
      );
      moldings.setMatrixAt(i, m);

      // picture lamp: a warm bar above the print
      m.compose(
        new THREE.Vector3(
          face.wx + face.nx * 0.12,
          HANG_Y + art.h / 2 + 0.34,
          face.wz + face.nz * 0.12,
        ),
        q,
        new THREE.Vector3(Math.min(art.w * 0.55, 0.9), 0.035, 0.05),
      );
      lamps.setMatrixAt(i, m);

      const g = new THREE.Group();
      g.position.set(face.wx, 0, face.wz);
      g.rotation.y = yaw;

      // placeholder: the print's dominant color, sleeping in the dark until
      // its texture streams in
      const baseMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(rgbOf(art.color)).multiplyScalar(0.55),
        roughness: 0.88,
        metalness: 0,
      });
      baseMats.push(baseMat);
      const base = new THREE.Mesh(PLANE, baseMat);
      base.position.set(0, HANG_Y, 0.073);
      base.scale.set(art.w, art.h, 1);
      g.add(base);

      // the print itself — fades in as the texture streams
      const photoMat = new THREE.MeshStandardMaterial({
        roughness: 0.6,
        metalness: 0,
        transparent: true,
        opacity: 0,
      });
      const photo = new THREE.Mesh(PLANE, photoMat);
      photo.position.set(0, HANG_Y, 0.078);
      photo.scale.set(art.w, art.h, 1);
      g.add(photo);

      // wet-floor reflection: flipped UVs + vertical alpha falloff
      const reflMat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        alphaMap: reflectionMask,
        depthWrite: false,
      });
      const refl = new THREE.Mesh(PLANE_FLIP, reflMat);
      refl.rotation.x = -Math.PI / 2;
      refl.scale.set(art.w, art.h * 0.85, 1);
      refl.position.set(0, 0.012, 0.05 + art.h * 0.42);
      g.add(refl);

      group.add(g);
      return {
        art,
        group: g,
        photoMat,
        photoMesh: photo,
        reflMat,
        state: 0 as const,
        tex: null,
        fade: 0,
        discovered: false,
        dist: 1e9,
      };
    });

    moldings.instanceMatrix.needsUpdate = true;
    lamps.instanceMatrix.needsUpdate = true;
    group.add(moldings);
    group.add(lamps);
    return { group, runtimes, moldings, lamps, baseMats };
  }, [arts, mats]);

  useEffect(
    () => () => {
      artLayer.runtimes.forEach((r) => {
        r.tex?.dispose();
        r.photoMat.dispose();
        r.reflMat.dispose();
      });
      artLayer.baseMats.forEach((m) => m.dispose());
      artLayer.moldings.dispose();
      artLayer.lamps.dispose();
    },
    [artLayer],
  );

  /* --- spotlight pool --- */
  const pool = useMemo(() => {
    const count = isMobile ? 4 : 7;
    const g = new THREE.Group();
    const spots = Array.from({ length: count }, () => {
      const s = new THREE.SpotLight('#ffd9a8', 0, 9, 0.62, 0.9, 1.4);
      s.target.position.set(0, HANG_Y, 0);
      g.add(s);
      g.add(s.target);
      return { light: s, target: -1, level: 0 };
    });
    return { g, spots };
  }, [isMobile]);
  useEffect(() => () => pool.spots.forEach((s) => s.light.dispose()), [pool]);

  /* --- heart room dressing --- */
  const heartLightRef = useRef<THREE.PointLight>(null);
  const heartRingRef = useRef<THREE.Mesh>(null);
  const heartRingMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1c130a',
        roughness: 0.5,
        metalness: 0.3,
        emissive: '#f59e0b',
        emissiveIntensity: 0.7,
      }),
    [],
  );
  useEffect(() => () => heartRingMat.dispose(), [heartRingMat]);

  /* --- dust motes --- */
  const dust = useMemo(() => {
    const N = 260;
    const pos = new Float32Array(N * 3);
    let s = 31337;
    const rand = () => {
      s = (s * 48271) % 2147483647;
      return s / 2147483647;
    };
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (rand() - 0.5) * W;
      pos[i * 3 + 1] = 0.3 + rand() * (WALL_H - 0.6);
      pos[i * 3 + 2] = (rand() - 0.5) * D;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: '#cdb88f',
      size: 0.014,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geo, mat };
  }, [W, D]);
  useEffect(
    () => () => {
      dust.geo.dispose();
      dust.mat.dispose();
    },
    [dust],
  );
  const dustRef = useRef<THREE.Points>(null);

  /* --- the visitor's lantern: a faint warm glow that travels with you, so
         the nearest walls always read even between picture lights --- */
  const lanternRef = useRef<THREE.PointLight>(null);

  /* --- player state --- */
  const player = useRef({
    x: 0,
    z: 0,
    yaw: 0,
    vx: 0,
    vz: 0,
    turnV: 0,
    bob: 0,
    stepSide: 1,
    speedSm: 0,
  });
  const audio = useMemo(() => new MazeAudio(), []);
  useEffect(() => () => audio.dispose(), [audio]);
  // the page forwards the first user gesture so footsteps can sound
  useEffect(() => {
    const unlock = () => audio.unlock();
    window.addEventListener('maze-audio-unlock', unlock);
    return () => window.removeEventListener('maze-audio-unlock', unlock);
  }, [audio]);

  // spawn at the entrance, facing the open corridor
  useEffect(() => {
    const p = player.current;
    const sx = (maze.start.x + 0.5 - maze.cols / 2) * maze.cell;
    const sz = (maze.start.y + 0.5 - maze.rows / 2) * maze.cell;
    p.x = sx;
    p.z = sz;
    const { x, y } = maze.start;
    if (y > 0 && !maze.wallH[x][y - 1]) p.yaw = Math.PI; // open to -z
    else if (x < maze.cols - 1 && !maze.wallV[x][y]) p.yaw = -Math.PI / 2; // +x
    else if (x > 0 && !maze.wallV[x - 1][y]) p.yaw = Math.PI / 2; // -x
    else p.yaw = 0; // +z
    if (spawnAtHeart) {
      p.x = maze.heartCenter.wx;
      p.z = maze.heartCenter.wz;
      const hero = arts.find((a) => a.hero);
      if (hero) p.yaw = Math.atan2(p.x - hero.face.wx, p.z - hero.face.wz);
    }
    camera.position.set(p.x, EYE, p.z);
    camera.rotation.set(0, p.yaw, 0, 'YXZ');
    hud.track.x = p.x;
    hud.track.z = p.z;
    hud.track.yaw = p.yaw;
    hud.track.visited.add(maze.start.x * 100 + maze.start.y);
    hud.track.rev++;
  }, [maze, camera, hud]);

  const tick = useRef({ stream: 0, spots: 0, sense: 0, discovered: 0, goalDone: false, readyDone: false });

  /* ----------------------------- the loop ----------------------------- */

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const p = player.current;
    const inp = input.current;
    const t = tick.current;
    const now = state.clock.elapsedTime;

    /* input → intent */
    const k = inp.keys;
    let fwd = (k.has('ArrowUp') || k.has('KeyW') ? 1 : 0) - (k.has('ArrowDown') || k.has('KeyS') ? 1 : 0);
    let strafe = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0);
    let turn = (k.has('ArrowLeft') ? 1 : 0) - (k.has('ArrowRight') ? 1 : 0);
    fwd += -inp.joyY;
    strafe += inp.joyX;
    fwd = THREE.MathUtils.clamp(fwd, -1, 1);
    strafe = THREE.MathUtils.clamp(strafe, -1, 1);

    /* turning: smoothed key turn + immediate drag */
    p.turnV = damp(p.turnV, turn * TURN, 9, dt);
    p.yaw += p.turnV * dt - inp.dragX * 0.0042;
    inp.dragX = 0;

    /* walking: damped velocity in facing space */
    const speed = k.has('ShiftLeft') || k.has('ShiftRight') ? RUN : WALK;
    const sin = Math.sin(p.yaw);
    const cos = Math.cos(p.yaw);
    const txv = (-sin * fwd + cos * strafe) * speed;
    const tzv = (-cos * fwd - sin * strafe) * speed;
    p.vx = damp(p.vx, txv, 8, dt);
    p.vz = damp(p.vz, tzv, 8, dt);

    const nx = p.x + p.vx * dt;
    const nz = p.z + p.vz * dt;
    const solved = collide(maze, nx, nz, RADIUS);
    p.x = solved.x;
    p.z = solved.z;

    /* head: bob with stride, lean into turns — the body, not a tripod */
    const planar = Math.hypot(p.vx, p.vz);
    p.speedSm = damp(p.speedSm, planar, 6, dt);
    const moving = p.speedSm > 0.25;
    if (moving && !reduce) {
      const prev = p.bob;
      p.bob += dt * (4.6 + p.speedSm * 1.6);
      // a footstep lands at each half-cycle of the bob
      if (Math.floor(prev / Math.PI) !== Math.floor(p.bob / Math.PI) && !muted.current) {
        p.stepSide *= -1;
        audio.step(p.stepSide);
      }
    }
    const bobAmp = reduce ? 0 : Math.min(0.05, p.speedSm * 0.016);
    const bobY = Math.abs(Math.sin(p.bob)) * bobAmp;
    const sway = Math.sin(p.bob * 0.5) * bobAmp * 0.6;
    const lean = reduce ? 0 : -p.turnV * 0.018 - sway * 0.5;

    camera.position.set(p.x + cos * sway * 0.4, EYE + bobY, p.z - sin * sway * 0.4);
    camera.rotation.set(Math.sin(p.bob * 0.5) * bobAmp * 0.08, p.yaw, lean, 'YXZ');
    if (lanternRef.current) lanternRef.current.position.set(p.x, EYE + 0.5, p.z);

    /* minimap + visited fog-of-war */
    hud.track.x = p.x;
    hud.track.z = p.z;
    hud.track.yaw = p.yaw;
    const cellW = worldToCell(maze, p.x, p.z);
    const key = cellW.x * 100 + cellW.y;
    if (!hud.track.visited.has(key)) {
      hud.track.visited.add(key);
      hud.track.rev++;
    }

    /* the Heart: arrival ceremony */
    const inHeart = maze.heart.some((c) => c.x === cellW.x && c.y === cellW.y);
    if (inHeart && !t.goalDone) {
      t.goalDone = true;
      hud.onGoal();
      if (!muted.current) audio.chord();
    }
    if (heartLightRef.current) {
      const target = t.goalDone ? 26 : 9;
      heartLightRef.current.intensity = damp(heartLightRef.current.intensity, target, 1.6, dt);
    }
    if (heartRingRef.current) {
      heartRingMat.emissiveIntensity = 0.7 + Math.sin(now * 1.4) * 0.22 + (t.goalDone ? 0.5 : 0);
      heartRingRef.current.rotation.z = now * 0.05;
    }

    /* per-art distances + visibility + develop-in fades */
    const runtimes = artLayer.runtimes;
    for (let i = 0; i < runtimes.length; i++) {
      const r = runtimes[i];
      const dx = r.art.face.wx - p.x;
      const dz = r.art.face.wz - p.z;
      r.dist = Math.hypot(dx, dz);
      r.group.visible = r.dist < 21;
      if (r.state === 2 && r.dist < LOAD_R) {
        r.fade = Math.min(1, r.fade + dt / 0.9);
      }
      if (r.fade > 0) {
        r.photoMat.opacity = r.fade;
        r.reflMat.opacity = 0.085 * r.fade;
      }
    }

    /* texture streaming, throttled. The whole building fits in ~32×25m, so
       eviction can't be a fixed radius (nothing would ever leave it) — the
       budget belongs to the BUDGET nearest prints, with a couple of metres
       of hysteresis so the boundary doesn't thrash while you pace it. */
    if (now - t.stream > 0.3) {
      t.stream = now;
      const want = runtimes
        .filter((r) => r.dist < LOAD_R)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, BUDGET);
      const wanted = new Set(want);
      const wantMax = want.length ? want[want.length - 1].dist : 0;

      // hand back the budget first…
      for (const r of runtimes) {
        if (r.state === 2 && !wanted.has(r) && (r.dist > wantMax + 2.5 || r.dist > DROP_R)) {
          r.photoMat.map = null;
          r.reflMat.map = null;
          r.photoMat.needsUpdate = true;
          r.reflMat.needsUpdate = true;
          r.tex?.dispose();
          r.tex = null;
          r.state = 0;
          r.fade = 0;
          r.photoMat.opacity = 0;
          r.reflMat.opacity = 0;
        }
      }
      // …then spend it nearest-first
      let inFlight = 0;
      for (const r of runtimes) if (r.state !== 0) inFlight++;
      for (const r of want) {
        if (r.state !== 0 || inFlight >= BUDGET + 4) continue;
        inFlight++;
        r.state = 1;
        const wpx = r.art.hero ? 1024 : 512;
        new THREE.TextureLoader().load(
          cldFull(r.art.src, wpx),
          (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.anisotropy = 4;
            r.tex = tex;
            r.photoMat.map = tex;
            r.reflMat.map = tex;
            r.photoMat.needsUpdate = true;
            r.reflMat.needsUpdate = true;
            r.state = 2;
            if (!t.readyDone) {
              t.readyDone = true;
              hud.onReady();
            }
          },
          undefined,
          () => {
            r.state = 0; // network hiccup: retry on a later pass
          },
        );
      }
    }

    /* spotlight pool with sticky reassignment */
    if (now - t.spots > 0.25) {
      t.spots = now;
      const near = runtimes
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => r.dist < 13)
        .sort((a, b) => a.r.dist - b.r.dist)
        .slice(0, pool.spots.length + 3);
      const nearIdx = near.map((n) => n.i);
      const taken = new Set<number>();
      for (const s of pool.spots) {
        if (s.target >= 0 && nearIdx.includes(s.target) && !taken.has(s.target)) {
          taken.add(s.target); // keep current assignment — no flicker
        } else {
          s.target = -1;
        }
      }
      for (const s of pool.spots) {
        if (s.target >= 0) continue;
        const free = near.find((n) => !taken.has(n.i));
        if (free) {
          taken.add(free.i);
          s.target = free.i;
        }
      }
    }
    for (const s of pool.spots) {
      const r = s.target >= 0 ? runtimes[s.target] : null;
      const on = r ? clamp01(1.4 - r.dist / 11) : 0;
      s.level = damp(s.level, on, 4, dt);
      s.light.intensity = s.level * 34;
      if (r) {
        const f = r.art.face;
        const ly = Math.min(WALL_H - 0.2, HANG_Y + r.art.h / 2 + 1.5);
        s.light.position.set(f.wx + f.nx * 1.7, ly, f.wz + f.nz * 1.7);
        s.light.target.position.set(f.wx, HANG_Y - r.art.h * 0.12, f.wz);
        s.light.angle = Math.min(0.75, 0.42 + r.art.w * 0.13);
      }
    }

    /* focus + discovery, throttled */
    if (now - t.sense > 0.18) {
      t.sense = now;
      const fx = -sin;
      const fz = -cos;
      let best: ArtRuntime | null = null;
      let bestScore = 0;
      let newly = 0;
      for (const r of runtimes) {
        if (r.dist > 4.6) continue;
        const dx = (r.art.face.wx - p.x) / (r.dist || 1);
        const dz = (r.art.face.wz - p.z) / (r.dist || 1);
        const facing = dx * fx + dz * fz;
        if (facing > 0.35 && r.dist < 3.6 && !r.discovered) {
          r.discovered = true;
          t.discovered++;
          newly++;
        }
        const score = facing - r.dist * 0.08;
        if (facing > 0.72 && score > bestScore) {
          bestScore = score;
          best = r;
        }
      }
      if (newly > 0) {
        hud.onDiscover(t.discovered);
        if (!muted.current) audio.blip();
      }
      hud.setFocus(best ? best.art : null);
    }

    /* dust drifts; barely */
    if (dustRef.current) dustRef.current.position.y = Math.sin(now * 0.11) * 0.18;
  });

  const hc = maze.heartCenter;

  return (
    <>
      <color attach="background" args={['#08080a']} />
      <fogExp2 attach="fog" args={['#08080a', 0.058]} />

      <ambientLight intensity={0.16} />
      <hemisphereLight args={['#2a2e3a', '#0e0d0c', 0.55]} />
      <pointLight ref={lanternRef} color="#e8d3b0" intensity={2.6} distance={6.5} decay={1.9} />

      {/* architecture */}
      <instancedMesh ref={wallsRef} args={[BOX, mats.wall, maze.walls.length]} />
      <instancedMesh ref={cansRef} args={[BOX, mats.can, maze.cols * maze.rows]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={mats.floor}>
        <planeGeometry args={[W + 1, D + 1]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, WALL_H, 0]} material={mats.ceiling}>
        <planeGeometry args={[W + 1, D + 1]} />
      </mesh>

      {/* the hang */}
      <primitive object={artLayer.group} />
      <primitive object={pool.g} />

      {/* the Heart */}
      <pointLight
        ref={heartLightRef}
        color="#f5a623"
        position={[hc.wx, 2.5, hc.wz]}
        intensity={9}
        distance={11}
        decay={1.8}
      />
      <mesh
        ref={heartRingRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[hc.wx, 0.02, hc.wz]}
        material={heartRingMat}
      >
        <ringGeometry args={[1.15, 1.32, 64]} />
      </mesh>

      <points ref={dustRef} geometry={dust.geo} material={dust.mat} />
    </>
  );
};

/* ----------------------------- canvas shell ----------------------------- */

const MuseumMazeScene: React.FC<SceneProps> = (props) => (
  <Canvas
    dpr={[1, props.isMobile ? 1.5 : 1.75]}
    gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
    camera={{ fov: 64, near: 0.05, far: 60 }}
    style={{ position: 'absolute', inset: 0 }}
  >
    <ReleaseContextOnUnmount />
    <Inner {...props} />
  </Canvas>
);

export default MuseumMazeScene;
