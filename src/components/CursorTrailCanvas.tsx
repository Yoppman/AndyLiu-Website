import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
  saturation: number;
}

const PALETTE = [
  { h: 35, s: 70 },   // warm amber
  { h: 200, s: 50 },  // steel blue
  { h: 15, s: 65 },   // burnt sienna
  { h: 160, s: 40 },  // sage green
  { h: 280, s: 35 },  // muted lavender
  { h: 45, s: 80 },   // golden
];

const CursorTrailCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -100, y: -100, prevX: -100, prevY: -100 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e: MouseEvent) => {
      mouseRef.current.prevX = mouseRef.current.x;
      mouseRef.current.prevY = mouseRef.current.y;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;

      const dx = mouseRef.current.x - mouseRef.current.prevX;
      const dy = mouseRef.current.y - mouseRef.current.prevY;
      const speed = Math.sqrt(dx * dx + dy * dy);

      const count = Math.min(Math.floor(speed * 0.3), 6);
      const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];

      for (let i = 0; i < count; i++) {
        const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 2;
        const maxLife = 40 + Math.random() * 30;
        particlesRef.current.push({
          x: mouseRef.current.x + (Math.random() - 0.5) * 8,
          y: mouseRef.current.y + (Math.random() - 0.5) * 8,
          vx: Math.cos(angle) * (0.5 + Math.random() * 1.5),
          vy: Math.sin(angle) * (0.5 + Math.random() * 1.5),
          life: maxLife,
          maxLife,
          size: 2 + Math.random() * 4,
          hue: color.h + (Math.random() - 0.5) * 20,
          saturation: color.s,
        });
      }
    };

    window.addEventListener('mousemove', onMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life--;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.vy += 0.02;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const progress = p.life / p.maxLife;
        const alpha = progress * 0.6;
        const size = p.size * (0.5 + progress * 0.5);

        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, ${p.saturation}%, 50%, ${alpha})`;
        ctx.fill();

        if (size > 2) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 1.8, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, ${p.saturation}%, 60%, ${alpha * 0.15})`;
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-30 pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default CursorTrailCanvas;
