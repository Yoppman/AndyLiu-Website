import React, { useEffect, useMemo, useRef } from 'react';

export interface Skill {
  label: string;
  color: string;
}

/** Evenly distributed points on a unit sphere (Fibonacci sphere). */
function fibSphere(n: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = n === 1 ? 0 : 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = phi * i;
    pts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
  }
  return pts;
}

/**
 * A rotating 3D sphere of skill labels — a "constellation." Pure DOM/CSS 3D
 * (text stays crisp and selectable), depth faked via per-tag scale/opacity.
 * Auto-rotates and spins toward the cursor; respects reduced-motion.
 */
const SkillsCloud: React.FC<{ skills: Skill[] }> = ({ skills }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tagRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const points = useMemo(() => fibSphere(skills.length), [skills.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let ax = -0.3;
    let ay = 0;
    const ptr = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let raf = 0;
    let alive = true;

    const onMove = (e: PointerEvent) => {
      const r = container.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    const onLeave = () => {
      target.x = 0;
      target.y = 0;
    };
    container.addEventListener('pointermove', onMove);
    container.addEventListener('pointerleave', onLeave);

    const tick = () => {
      if (!alive) return;
      const rect = container.getBoundingClientRect();
      const R = Math.min(rect.width, rect.height) * 0.42;

      ptr.x += (target.x - ptr.x) * 0.06;
      ptr.y += (target.y - ptr.y) * 0.06;
      ay += (reduce ? 0 : 0.0016) + ptr.x * 0.02;
      ax += -ptr.y * 0.02;

      const cosY = Math.cos(ay);
      const sinY = Math.sin(ay);
      const cosX = Math.cos(ax);
      const sinX = Math.sin(ax);

      for (let i = 0; i < points.length; i++) {
        const el = tagRefs.current[i];
        if (!el) continue;
        const [bx, by, bz] = points[i];
        const rx1 = bx * cosY + bz * sinY;
        const rz1 = -bx * sinY + bz * cosY;
        const ry2 = by * cosX - rz1 * sinX;
        const rz2 = by * sinX + rz1 * cosX;
        const x = rx1 * R;
        const y = ry2 * R;
        const t = (rz2 + 1) / 2; // 0 (back) → 1 (front)
        const scale = 0.6 + t * 0.7;
        el.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
        el.style.opacity = (0.28 + t * 0.72).toFixed(2);
        el.style.zIndex = String(Math.round(t * 100));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerleave', onLeave);
    };
  }, [points]);

  return (
    <div ref={containerRef} className="relative mx-auto h-[58vh] max-h-[560px] w-full max-w-[600px]">
      {skills.map((s, i) => (
        <span
          key={s.label}
          ref={(el) => {
            tagRefs.current[i] = el;
          }}
          className="absolute left-1/2 top-1/2 whitespace-nowrap font-cormorant text-lg font-medium will-change-transform md:text-xl"
          style={{ color: s.color, textShadow: `0 0 18px ${s.color}66` }}
        >
          {s.label}
        </span>
      ))}
    </div>
  );
};

export default SkillsCloud;
