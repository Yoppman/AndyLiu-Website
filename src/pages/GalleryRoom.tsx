import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { galleries } from '../data/galleries';
import { aspectOf, cldFull } from '../components/gallery/shared/cloudinaryUtils';
import { webglAvailable } from '../components/webgl/webglAvailable';
import SceneErrorBoundary from '../components/webgl/SceneErrorBoundary';
import PageTransition from '../components/PageTransition';
import BackButton from '../components/BackButton';
import { generateMaze, mulberry32, shuffled, type Maze } from '../components/gallery-room/maze';
import type {
  HudBridge,
  MazeInput,
  PlacedArt,
} from '../components/gallery-room/MuseumMazeScene';

const MuseumMazeScene = React.lazy(() => import('../components/gallery-room/MuseumMazeScene'));

/**
 * "The Gallery Room" — a museum at night, played in first person.
 *
 * Every visit raises a different building: a seeded maze whose walls are
 * hung with prints drawn at random from the entire archive (2000+ frames).
 * Arrow keys / WASD walk it, dragging looks around, and a fog-of-war
 * minimap sketches the floor plan as you go. Somewhere at the farthest
 * point of the maze is the Heart — a lit chamber that ends the hunt.
 * Walk close to any print to focus it; Enter (or a click) steps into its
 * gallery. `?seed=n` pins the building for a shareable run.
 */

/* ----------------------------- the hang ----------------------------- */

function buildHang(maze: Maze, seed: number): PlacedArt[] {
  const rand = mulberry32((seed ^ 0x9e3779b9) >>> 0);
  const pool = shuffled(
    galleries.flatMap((g) =>
      g.photos.map((p) => ({
        src: p.src,
        color: p.dominantColor,
        aspect: aspectOf(p),
        title: g.title,
        slug: g.slug,
        region: g.location?.region,
      })),
    ),
    rand,
  );
  let pi = 0;
  const take = (preferWide: boolean) => {
    if (preferWide) {
      for (let j = pi; j < Math.min(pi + 40, pool.length); j++) {
        if (pool[j].aspect > 1.2) {
          const [hit] = pool.splice(j, 1);
          return hit;
        }
      }
    }
    return pool[pi++];
  };

  const placed: PlacedArt[] = [];
  const heartFaces = maze.faces.filter((f) => f.inHeart);
  const rest = shuffled(
    maze.faces.filter((f) => !f.inHeart),
    rand,
  );

  // the Heart hangs heroes — big horizontals under their own light
  for (const face of heartFaces.slice(0, 6)) {
    const photo = take(true);
    if (!photo) break;
    const h = 1.42;
    const w = Math.min(h * photo.aspect, 2.9);
    placed.push({ ...photo, face, w, h: w / photo.aspect, hero: true });
  }

  // everywhere else: a varied hang with deliberate gaps — walls that all
  // shout leave nothing for the ones that matter
  for (const face of rest) {
    if (placed.length >= 88) break;
    if (rand() < 0.22) continue;
    const photo = take(false);
    if (!photo) break;
    const h = 0.95 + rand() * 0.42;
    const w = Math.min(h * photo.aspect, 2.6);
    placed.push({ ...photo, face, w, h: w / photo.aspect, hero: false });
  }
  return placed;
}

/* ----------------------------- minimap ----------------------------- */

const MAP_W = 168;
const MAP_H = 134;

function drawMinimap(
  canvas: HTMLCanvasElement,
  maze: Maze,
  track: HudBridge['track'],
  goalSeen: boolean,
  t: number,
) {
  const g = canvas.getContext('2d');
  if (!g) return;
  const pad = 10;
  const sx = (MAP_W - pad * 2) / (maze.cols * maze.cell);
  const sz = (MAP_H - pad * 2) / (maze.rows * maze.cell);
  const s = Math.min(sx, sz);
  const toX = (wx: number) => MAP_W / 2 + wx * s;
  const toY = (wz: number) => MAP_H / 2 + wz * s;

  g.clearRect(0, 0, MAP_W, MAP_H);

  // visited cells: a faint floor wash
  g.fillStyle = 'rgba(245,158,11,0.07)';
  const cs = maze.cell * s;
  track.visited.forEach((key) => {
    const x = Math.floor(key / 100);
    const y = key % 100;
    g.fillRect(toX((x - maze.cols / 2) * maze.cell), toY((y - maze.rows / 2) * maze.cell), cs, cs);
  });

  // walls bordering visited cells — the building reveals itself as it is walked
  g.strokeStyle = 'rgba(235,235,240,0.5)';
  g.lineWidth = 1.2;
  g.beginPath();
  const seen = (x: number, y: number) => track.visited.has(x * 100 + y);
  const ox = -maze.cols * maze.cell * 0.5;
  const oz = -maze.rows * maze.cell * 0.5;
  for (let x = 0; x < maze.cols - 1; x++)
    for (let y = 0; y < maze.rows; y++)
      if (maze.wallV[x][y] && (seen(x, y) || seen(x + 1, y))) {
        const wx = ox + (x + 1) * maze.cell;
        g.moveTo(toX(wx), toY(oz + y * maze.cell));
        g.lineTo(toX(wx), toY(oz + (y + 1) * maze.cell));
      }
  for (let x = 0; x < maze.cols; x++)
    for (let y = 0; y < maze.rows - 1; y++)
      if (maze.wallH[x][y] && (seen(x, y) || seen(x, y + 1))) {
        const wz = oz + (y + 1) * maze.cell;
        g.moveTo(toX(ox + x * maze.cell), toY(wz));
        g.lineTo(toX(ox + (x + 1) * maze.cell), toY(wz));
      }
  for (let x = 0; x < maze.cols; x++) {
    if (seen(x, 0)) {
      g.moveTo(toX(ox + x * maze.cell), toY(oz));
      g.lineTo(toX(ox + (x + 1) * maze.cell), toY(oz));
    }
    if (seen(x, maze.rows - 1)) {
      g.moveTo(toX(ox + x * maze.cell), toY(-oz));
      g.lineTo(toX(ox + (x + 1) * maze.cell), toY(-oz));
    }
  }
  for (let y = 0; y < maze.rows; y++) {
    if (seen(0, y)) {
      g.moveTo(toX(ox), toY(oz + y * maze.cell));
      g.lineTo(toX(ox), toY(oz + (y + 1) * maze.cell));
    }
    if (seen(maze.cols - 1, y)) {
      g.moveTo(toX(-ox), toY(oz + y * maze.cell));
      g.lineTo(toX(-ox), toY(oz + (y + 1) * maze.cell));
    }
  }
  g.stroke();

  // the Heart: a slow amber pulse — you know there is somewhere to get to
  const pulse = 0.45 + 0.3 * Math.sin(t * 0.0023);
  g.fillStyle = goalSeen ? 'rgba(245,158,11,0.95)' : `rgba(245,158,11,${pulse})`;
  g.beginPath();
  g.arc(toX(maze.heartCenter.wx), toY(maze.heartCenter.wz), goalSeen ? 4 : 3, 0, Math.PI * 2);
  g.fill();

  // the visitor
  g.save();
  g.translate(toX(track.x), toY(track.z));
  g.rotate(-track.yaw);
  g.fillStyle = '#f5f5f5';
  g.beginPath();
  g.moveTo(0, -5.4);
  g.lineTo(3.4, 3.6);
  g.lineTo(-3.4, 3.6);
  g.closePath();
  g.fill();
  g.restore();
}

/* ----------------------------- the page ----------------------------- */

const GalleryRoom: React.FC = () => {
  const navigate = useNavigate();

  const ok = useMemo(() => webglAvailable(), []);
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
    [],
  );

  // ?seed=n pins the building; otherwise every visit is a new hang
  const seed = useMemo(() => {
    const q = new URLSearchParams(window.location.search).get('seed');
    const n = q ? Number(q) : NaN;
    return Number.isFinite(n) ? n : Math.floor(Math.random() * 1e9);
  }, []);
  const spawnAtHeart = useMemo(
    () => new URLSearchParams(window.location.search).get('start') === 'heart',
    [],
  );
  const maze = useMemo(() => generateMaze(seed), [seed]);
  const arts = useMemo(() => buildHang(maze, seed), [maze, seed]);

  // full immersion: hide the site header (the Compact-mode mechanism) and own
  // the document background while the museum is open
  useEffect(() => {
    document.body.dataset.immersive = '1';
    document.documentElement.style.background = '#08080a';
    return () => {
      delete document.body.dataset.immersive;
      document.documentElement.style.background = '';
    };
  }, []);

  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [muted, setMutedState] = useState(false);
  const mutedRef = useRef(false);
  const [focus, setFocus] = useState<PlacedArt | null>(null);
  const [found, setFound] = useState(0);
  const [goal, setGoal] = useState(false);
  const [toast, setToast] = useState(false);

  const inputRef = useRef<MazeInput>({ keys: new Set(), joyX: 0, joyY: 0, dragX: 0 });
  const focusRef = useRef<PlacedArt | null>(null);

  const hud = useMemo<HudBridge>(
    () => ({
      track: { x: 0, z: 0, yaw: 0, visited: new Set<number>(), rev: 0 },
      setFocus: (a) => {
        if (focusRef.current?.src !== a?.src) {
          focusRef.current = a;
          setFocus(a);
        }
      },
      onDiscover: (n) => setFound(n),
      onGoal: () => {
        setGoal(true);
        setToast(true);
        window.setTimeout(() => setToast(false), 7000);
      },
      onReady: () => setReady(true),
    }),
    [],
  );

  // even on a slow network the building itself is worth seeing
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 3000);
    return () => window.clearTimeout(id);
  }, []);

  const begin = useCallback(() => {
    setStarted(true);
    window.dispatchEvent(new Event('maze-audio-unlock'));
  }, []);

  /* keyboard: movement keys feed the scene; Enter steps into the focused print */
  useEffect(() => {
    if (!ok) return;
    const down = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const code = e.code;
      if (
        code.startsWith('Arrow') ||
        ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight', 'Space'].includes(code)
      ) {
        e.preventDefault();
        inputRef.current.keys.add(code);
        begin();
      }
      if (code === 'Enter' && focusRef.current) {
        navigate(`/photography/${focusRef.current.slug}`);
      }
    };
    const up = (e: KeyboardEvent) => inputRef.current.keys.delete(e.code);
    const blur = () => inputRef.current.keys.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [ok, navigate, begin]);

  /* drag to look (mouse + touch on the world, not the joystick) */
  const dragState = useRef({ on: false, lastX: 0, total: 0, t0: 0 });
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-joystick],[data-ui]')) return;
    dragState.current = { on: true, lastX: e.clientX, total: 0, t0: performance.now() };
  }, []);
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragState.current;
    if (!d.on) return;
    const dx = e.clientX - d.lastX;
    d.lastX = e.clientX;
    d.total += Math.abs(dx);
    inputRef.current.dragX += dx;
  }, []);
  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = dragState.current;
      if (!d.on) return;
      d.on = false;
      begin();
      // a clean tap on a focused print steps inside
      if (
        d.total < 8 &&
        performance.now() - d.t0 < 400 &&
        focusRef.current &&
        !(e.target as HTMLElement).closest('[data-joystick],[data-ui]')
      ) {
        navigate(`/photography/${focusRef.current.slug}`);
      }
    },
    [navigate, begin],
  );

  /* virtual joystick (mobile) */
  const joyRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const pad = joyRef.current;
    const knob = knobRef.current;
    if (!pad || !knob || !isMobile) return;
    let pid = -1;
    const R = 44;
    const set = (dx: number, dy: number) => {
      const len = Math.hypot(dx, dy) || 1;
      const cl = Math.min(len, R);
      const nx = (dx / len) * cl;
      const ny = (dy / len) * cl;
      knob.style.transform = `translate(${nx}px, ${ny}px)`;
      const dead = (v: number) => (Math.abs(v) < 0.16 ? 0 : v);
      inputRef.current.joyX = dead(nx / R);
      inputRef.current.joyY = dead(ny / R);
    };
    const downH = (e: PointerEvent) => {
      pid = e.pointerId;
      pad.setPointerCapture(pid);
      const r = pad.getBoundingClientRect();
      set(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      begin();
      e.stopPropagation();
    };
    const moveH = (e: PointerEvent) => {
      if (e.pointerId !== pid) return;
      const r = pad.getBoundingClientRect();
      set(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
    };
    const upH = (e: PointerEvent) => {
      if (e.pointerId !== pid) return;
      pid = -1;
      knob.style.transform = 'translate(0px, 0px)';
      inputRef.current.joyX = 0;
      inputRef.current.joyY = 0;
    };
    pad.addEventListener('pointerdown', downH);
    pad.addEventListener('pointermove', moveH);
    pad.addEventListener('pointerup', upH);
    pad.addEventListener('pointercancel', upH);
    return () => {
      pad.removeEventListener('pointerdown', downH);
      pad.removeEventListener('pointermove', moveH);
      pad.removeEventListener('pointerup', upH);
      pad.removeEventListener('pointercancel', upH);
    };
  }, [isMobile, begin]);

  /* minimap: redrawn at 8 Hz off the scene's mutable track — no React churn */
  const mapRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ok) return;
    const id = window.setInterval(() => {
      const c = mapRef.current;
      if (c) drawMinimap(c, maze, hud.track, goal, performance.now());
    }, 125);
    return () => window.clearInterval(id);
  }, [ok, maze, hud, goal]);

  const toggleMute = useCallback(() => {
    setMutedState((m) => {
      mutedRef.current = !m;
      return !m;
    });
  }, []);

  const poster = (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#08080a] px-6 text-center">
      <h1 className="font-cormorant text-5xl font-light text-white md:text-7xl">The Gallery Room</h1>
      <p className="mt-4 max-w-md font-cormorant text-lg italic text-white/60">
        This room needs WebGL to walk &mdash; the work itself lives in the{' '}
        <Link to="/photography" className="underline decoration-amber-400/50 hover:text-amber-300">
          galleries
        </Link>
        .
      </p>
    </div>
  );

  return (
    <PageTransition>
      <div
        className="fixed inset-0 select-none overflow-hidden bg-[#08080a]"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {ok ? (
          <SceneErrorBoundary fallback={poster}>
            <Suspense fallback={null}>
              <MuseumMazeScene
                maze={maze}
                arts={arts}
                hud={hud}
                input={inputRef}
                muted={mutedRef}
                reduce={reduce}
                isMobile={isMobile}
                spawnAtHeart={spawnAtHeart}
              />
            </Suspense>
          </SceneErrorBoundary>
        ) : (
          poster
        )}

        {/* lens vignette — the same dark frame the rest of the site wears */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 95% at 50% 48%, transparent 50%, rgba(0,0,0,0.62) 100%)',
          }}
        />

        {/* entrance: black lifts once the first print is on the wall */}
        <AnimatePresence>
          {!ready && (
            <motion.div
              className="pointer-events-none absolute inset-0 z-30 bg-black"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 1.4, ease: 'easeInOut' } }}
            />
          )}
        </AnimatePresence>

        {/* corner label */}
        <div className="pointer-events-none absolute left-6 top-8 z-20 md:left-10">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-amber-500/70" />
            <span className="font-cormorant text-xs uppercase tracking-[0.4em] text-white/55">
              The Gallery Room
            </span>
          </div>
        </div>

        {/* discovery count + mute */}
        <div data-ui className="absolute right-6 top-8 z-20 flex items-center gap-3 md:right-10">
          <span className="font-cormorant text-xs tracking-[0.25em] text-white/50">
            {found > 0 ? `${found} ${found === 1 ? 'FRAME' : 'FRAMES'} SEEN` : ''}
          </span>
          <button
            onClick={toggleMute}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="rounded-full border border-white/15 bg-black/40 px-3 py-1.5 font-cormorant text-[0.65rem] uppercase tracking-[0.2em] text-white/60 backdrop-blur transition-colors hover:text-amber-300"
          >
            {muted ? 'Sound off' : 'Sound on'}
          </button>
        </div>

        {/* opening card */}
        <AnimatePresence>
          {!started && ready && (
            <motion.div
              className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 1.2, delay: 0.3 } }}
              exit={{ opacity: 0, transition: { duration: 0.8 } }}
            >
              <span className="mb-4 pl-[0.5em] font-cormorant text-[0.7rem] uppercase tracking-[0.5em] text-white/70 md:text-sm">
                A museum after hours
              </span>
              <h1 className="font-cormorant text-5xl font-light leading-[0.95] text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.7)] md:text-7xl">
                The Gallery
                <span className="block font-light italic">Room</span>
              </h1>
              <p className="mt-6 max-w-md font-cormorant text-base italic text-white/65 md:text-lg">
                {isMobile
                  ? 'Walk with the pad. Drag to look. Find the lit room.'
                  : 'Walk with the arrow keys. Drag to look. Find the lit room.'}
              </p>
              <span className="mt-10 animate-pulse font-cormorant text-[0.65rem] uppercase tracking-[0.4em] text-amber-300/90">
                {isMobile ? 'Touch to begin' : 'Press any arrow to begin'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* focused print: museum label (sits clear of the back pill) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-center px-6">
          <AnimatePresence mode="wait">
            {focus && started && (
              <motion.div
                key={focus.src}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="rounded border border-white/10 bg-black/55 px-5 py-3 text-center backdrop-blur-sm"
              >
                <div className="font-cormorant text-xl leading-tight text-white md:text-2xl">
                  {focus.title}
                </div>
                <div className="mt-1 font-cormorant text-[0.62rem] uppercase tracking-[0.3em] text-amber-300/85">
                  {focus.region ? `${focus.region} · ` : ''}
                  {isMobile ? 'tap to enter gallery' : 'enter ↵ to step inside'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* the Heart, found */}
        <AnimatePresence>
          {toast && (
            <motion.div
              className="pointer-events-none absolute inset-x-0 top-36 z-20 flex justify-center px-6"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="rounded border border-amber-400/30 bg-black/60 px-6 py-3 text-center backdrop-blur">
                <div className="font-cormorant text-[0.65rem] uppercase tracking-[0.45em] text-amber-300">
                  The heart of the collection
                </div>
                <div className="mt-1 font-cormorant text-base italic text-white/80">
                  Found, with {found} {found === 1 ? 'frame' : 'frames'} seen along the way.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* minimap */}
        <div
          data-ui
          className="absolute bottom-6 right-6 z-20 rounded-md border border-white/10 bg-black/50 p-1.5 backdrop-blur-sm md:bottom-8 md:right-8"
        >
          <canvas ref={mapRef} width={MAP_W} height={MAP_H} className="block h-[100px] w-[126px] md:h-[134px] md:w-[168px]" />
        </div>

        {/* virtual joystick */}
        {isMobile && (
          <div
            data-joystick
            ref={joyRef}
            className="absolute bottom-8 left-6 z-20 flex h-28 w-28 items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur-sm"
            style={{ touchAction: 'none' }}
          >
            <div
              ref={knobRef}
              className="h-12 w-12 rounded-full border border-white/20 bg-white/15 transition-transform duration-75"
            />
          </div>
        )}

        <BackButton variant="pill" placement="bottom-center" />
      </div>
    </PageTransition>
  );
};

export default GalleryRoom;
