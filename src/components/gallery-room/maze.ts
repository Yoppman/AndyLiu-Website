/**
 * The museum maze — pure data, no three.js. A seeded recursive backtracker
 * carves corridors through a grid; a few interior walls are then knocked out
 * to open plazas (museums breathe — endless corridor is fatigue), and the
 * BFS-farthest chamber from the entrance becomes the Heart, the room the
 * whole walk is secretly about. Same seed → same building, so a shared URL
 * shows the same hang.
 */

export interface Cell {
  x: number;
  y: number;
}

export interface WallFace {
  /** world-space center of the face */
  wx: number;
  wz: number;
  /** outward normal (unit, axis-aligned) — art hangs facing this way */
  nx: number;
  nz: number;
  /** the cell this face looks into (for visibility / minimap) */
  cell: Cell;
  /** faces inside the heart room get the ceremonial hang */
  inHeart: boolean;
}

export interface WallBox {
  /** axis-aligned footprint, for collision and instanced rendering */
  cx: number;
  cz: number;
  /** half-extents in x/z */
  hx: number;
  hz: number;
}

export interface Maze {
  cols: number;
  rows: number;
  cell: number;
  /** wallV[x][y]: wall between (x,y) and (x+1,y) — size (cols-1)*rows */
  wallV: boolean[][];
  /** wallH[x][y]: wall between (x,y) and (x,y+1) — size cols*(rows-1) */
  wallH: boolean[][];
  start: Cell;
  /** the Heart — a 2×2 chamber at the BFS-farthest point of the maze */
  heart: Cell[];
  heartCenter: { wx: number; wz: number };
  /** BFS depth of every cell from the start (for tuning / debugging) */
  depth: number[][];
  walls: WallBox[];
  faces: WallFace[];
}

/* ----------------------------- seeded RNG ----------------------------- */

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffled<T>(arr: T[], rand: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ----------------------------- generation ----------------------------- */

const WALL_T = 0.18; // wall thickness (m)

/** Cell center in world space (maze centered on the origin). */
export function cellToWorld(maze: Pick<Maze, 'cols' | 'rows' | 'cell'>, x: number, y: number) {
  return {
    wx: (x + 0.5 - maze.cols / 2) * maze.cell,
    wz: (y + 0.5 - maze.rows / 2) * maze.cell,
  };
}

export function worldToCell(maze: Pick<Maze, 'cols' | 'rows' | 'cell'>, wx: number, wz: number): Cell {
  return {
    x: Math.max(0, Math.min(maze.cols - 1, Math.floor(wx / maze.cell + maze.cols / 2))),
    y: Math.max(0, Math.min(maze.rows - 1, Math.floor(wz / maze.cell + maze.rows / 2))),
  };
}

export function generateMaze(seed: number, cols = 9, rows = 7, cell = 3.6): Maze {
  const rand = mulberry32(seed);

  // all walls up
  const wallV: boolean[][] = Array.from({ length: cols - 1 }, () => Array(rows).fill(true));
  const wallH: boolean[][] = Array.from({ length: cols }, () => Array(rows - 1).fill(true));

  // recursive backtracker (iterative)
  const visited: boolean[][] = Array.from({ length: cols }, () => Array(rows).fill(false));
  const start: Cell = { x: 0, y: rows - 1 };
  const stack: Cell[] = [start];
  visited[start.x][start.y] = true;
  while (stack.length) {
    const c = stack[stack.length - 1];
    const options: { n: Cell; knock: () => void }[] = [];
    if (c.x > 0 && !visited[c.x - 1][c.y])
      options.push({ n: { x: c.x - 1, y: c.y }, knock: () => (wallV[c.x - 1][c.y] = false) });
    if (c.x < cols - 1 && !visited[c.x + 1][c.y])
      options.push({ n: { x: c.x + 1, y: c.y }, knock: () => (wallV[c.x][c.y] = false) });
    if (c.y > 0 && !visited[c.x][c.y - 1])
      options.push({ n: { x: c.x, y: c.y - 1 }, knock: () => (wallH[c.x][c.y - 1] = false) });
    if (c.y < rows - 1 && !visited[c.x][c.y + 1])
      options.push({ n: { x: c.x, y: c.y + 1 }, knock: () => (wallH[c.x][c.y] = false) });
    if (!options.length) {
      stack.pop();
      continue;
    }
    const pick = options[Math.floor(rand() * options.length)];
    pick.knock();
    visited[pick.n.x][pick.n.y] = true;
    stack.push(pick.n);
  }

  // BFS depths from the entrance
  const depth: number[][] = Array.from({ length: cols }, () => Array(rows).fill(-1));
  const queue: Cell[] = [start];
  depth[start.x][start.y] = 0;
  let qi = 0;
  while (qi < queue.length) {
    const c = queue[qi++];
    const d = depth[c.x][c.y];
    const step = (nx: number, ny: number, open: boolean) => {
      if (open && depth[nx][ny] === -1) {
        depth[nx][ny] = d + 1;
        queue.push({ x: nx, y: ny });
      }
    };
    if (c.x > 0) step(c.x - 1, c.y, !wallV[c.x - 1][c.y]);
    if (c.x < cols - 1) step(c.x + 1, c.y, !wallV[c.x][c.y]);
    if (c.y > 0) step(c.x, c.y - 1, !wallH[c.x][c.y - 1]);
    if (c.y < rows - 1) step(c.x, c.y + 1, !wallH[c.x][c.y]);
  }

  // the Heart: a 2×2 chamber anchored at the farthest reachable cell
  let far: Cell = start;
  for (let x = 0; x < cols; x++)
    for (let y = 0; y < rows; y++) if (depth[x][y] > depth[far.x][far.y]) far = { x, y };
  const hx = Math.min(Math.max(far.x - (far.x > cols / 2 ? 1 : 0), 0), cols - 2);
  const hy = Math.min(Math.max(far.y - (far.y > rows / 2 ? 1 : 0), 0), rows - 2);
  const heart: Cell[] = [
    { x: hx, y: hy },
    { x: hx + 1, y: hy },
    { x: hx, y: hy + 1 },
    { x: hx + 1, y: hy + 1 },
  ];
  // knock out the chamber's internal walls
  wallV[hx][hy] = false;
  wallV[hx][hy + 1] = false;
  wallH[hx][hy] = false;
  wallH[hx + 1][hy] = false;

  // two plazas: knock a random interior wall region open so the building has
  // halls, not just corridors (never inside the heart — its reveal is earned)
  const inHeart = (x: number, y: number) => heart.some((c) => c.x === x && c.y === y);
  let opened = 0;
  let guard = 0;
  while (opened < 2 && guard++ < 60) {
    const px = 1 + Math.floor(rand() * (cols - 3));
    const py = 1 + Math.floor(rand() * (rows - 3));
    if (
      inHeart(px, py) ||
      inHeart(px + 1, py) ||
      inHeart(px, py + 1) ||
      inHeart(px + 1, py + 1) ||
      (px === start.x && py === start.y)
    )
      continue;
    wallV[px][py] = false;
    wallV[px][py + 1] = false;
    wallH[px][py] = false;
    wallH[px + 1][py] = false;
    opened++;
  }

  /* ---- world-space walls (collision + instancing) and hangable faces ---- */

  const walls: WallBox[] = [];
  const faces: WallFace[] = [];
  const ox = -cols * cell * 0.5;
  const oz = -rows * cell * 0.5;
  const half = cell / 2;

  const addFace = (wx: number, wz: number, nx: number, nz: number, c: Cell) => {
    if (c.x < 0 || c.x >= cols || c.y < 0 || c.y >= rows) return;
    faces.push({ wx, wz, nx, nz, cell: c, inHeart: inHeart(c.x, c.y) });
  };

  // interior vertical walls (plane x = const)
  for (let x = 0; x < cols - 1; x++)
    for (let y = 0; y < rows; y++)
      if (wallV[x][y]) {
        const wx = ox + (x + 1) * cell;
        const wz = oz + y * cell + half;
        walls.push({ cx: wx, cz: wz, hx: WALL_T / 2, hz: half + WALL_T / 2 });
        addFace(wx - WALL_T / 2, wz, -1, 0, { x, y });
        addFace(wx + WALL_T / 2, wz, 1, 0, { x: x + 1, y });
      }
  // interior horizontal walls (plane z = const)
  for (let x = 0; x < cols; x++)
    for (let y = 0; y < rows - 1; y++)
      if (wallH[x][y]) {
        const wx = ox + x * cell + half;
        const wz = oz + (y + 1) * cell;
        walls.push({ cx: wx, cz: wz, hx: half + WALL_T / 2, hz: WALL_T / 2 });
        addFace(wx, wz - WALL_T / 2, 0, -1, { x, y });
        addFace(wx, wz + WALL_T / 2, 0, 1, { x, y: y + 1 });
      }
  // boundary walls — inward faces only
  for (let x = 0; x < cols; x++) {
    const wx = ox + x * cell + half;
    walls.push({ cx: wx, cz: oz, hx: half + WALL_T / 2, hz: WALL_T / 2 });
    addFace(wx, oz + WALL_T / 2, 0, 1, { x, y: 0 });
    walls.push({ cx: wx, cz: -oz, hx: half + WALL_T / 2, hz: WALL_T / 2 });
    addFace(wx, -oz - WALL_T / 2, 0, -1, { x, y: rows - 1 });
  }
  for (let y = 0; y < rows; y++) {
    const wz = oz + y * cell + half;
    walls.push({ cx: ox, cz: wz, hx: WALL_T / 2, hz: half + WALL_T / 2 });
    addFace(ox + WALL_T / 2, wz, 1, 0, { x: 0, y });
    walls.push({ cx: -ox, cz: wz, hx: WALL_T / 2, hz: half + WALL_T / 2 });
    addFace(-ox - WALL_T / 2, wz, -1, 0, { x: cols - 1, y });
  }

  const hc = {
    wx: ox + (hx + 1) * cell,
    wz: oz + (hy + 1) * cell,
  };

  return { cols, rows, cell, wallV, wallH, start, heart, heartCenter: hc, depth, walls, faces };
}

/* ----------------------------- collision ----------------------------- */

/**
 * Push a circle (the visitor) out of every wall it overlaps. Axis-aligned
 * boxes make this exact and cheap; two passes settle the corner cases where
 * the first push slides you into a neighbour.
 */
export function collide(maze: Maze, x: number, z: number, r: number): { x: number; z: number } {
  let px = x;
  let pz = z;
  for (let pass = 0; pass < 2; pass++) {
    for (const w of maze.walls) {
      const dx = px - w.cx;
      const dz = pz - w.cz;
      if (Math.abs(dx) > w.hx + r || Math.abs(dz) > w.hz + r) continue;
      const ox = w.hx + r - Math.abs(dx);
      const oz = w.hz + r - Math.abs(dz);
      if (ox < oz) px += (dx >= 0 ? 1 : -1) * ox;
      else pz += (dz >= 0 ? 1 : -1) * oz;
    }
  }
  return { x: px, z: pz };
}
