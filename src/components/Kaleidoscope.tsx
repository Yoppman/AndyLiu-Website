// src/components/Kaleidoscope.tsx
import React, { useEffect, useRef } from 'react';

type KaleidoscopeProps = {
  segments?: number;
  mode?: 'scroll' | 'mouse';
  imageSrc?: string; // served from /public for same-origin canvas drawing
  orientation?: 'radial' | 'horizontal';
};

const Kaleidoscope: React.FC<KaleidoscopeProps> = ({
  segments = 70,
  mode = 'mouse',
  imageSrc = 'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747703385/LagunaBeach/dsc03708.jpg',
  orientation = 'horizontal',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    let width = 0;
    let height = 0;
    let frameId = 0;
    let isRunning = true;

    // Smooth drift state
    const pointer = { x: 0, y: 0 };
    const drift = { x: 0, y: 0 };

    const img = new Image();
    img.src = imageSrc; // same-origin from /public

    const resize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      width = Math.floor((rect?.width || window.innerWidth) * dpr);
      height = Math.floor((rect?.height || window.innerHeight) * dpr);
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${Math.floor(width / dpr)}px`;
      canvas.style.height = `${Math.floor(height / dpr)}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const onMouseMove = (e: MouseEvent) => {
      if (mode !== 'mouse') return;
      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = (e.clientX - cx) / (rect.width / 2); // -1..1
      const ny = (e.clientY - cy) / (rect.height / 2);
      pointer.x = Math.max(-1, Math.min(1, nx));
      pointer.y = Math.max(-1, Math.min(1, ny));
    };

    const onScroll = () => {
      if (mode !== 'scroll') return;
      const scrollY = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const scrollProgress = scrollY / Math.max(1, maxScroll);
      
      if (orientation === 'horizontal') {
        // Enhanced horizontal scroll effect
        const horizontalFactor = scrollProgress * 200 * dpr; // Increased range for more movement
        const verticalFactor = Math.min(60, Math.max(-60, scrollY * 0.05)) * dpr;
        pointer.x = horizontalFactor / 100;
        pointer.y = verticalFactor / 100;
      } else {
        // Original radial scroll effect
        const factor = Math.min(80, Math.max(-80, scrollY * 0.08)) * dpr;
        pointer.x = 0;
        pointer.y = factor / 100;
      }
    };

    const render = () => {
      if (!isRunning) return;
      frameId = requestAnimationFrame(render);
      if (!img.complete) return;

      // Follow pointer/scroll smoothly
      drift.x = lerp(drift.x, pointer.x * 40 * dpr, 0.06);
      drift.y = lerp(drift.y, pointer.y * 40 * dpr, 0.06);

      ctx.clearRect(0, 0, width, height);

      if (orientation === 'horizontal') {
        // Horizontal mirrored stripes with seamless joins
        const destStripeH = height / segments;
        const srcStripeH = img.height / segments;

        for (let i = 0; i < segments; i += 1) {
          const destY = i * destStripeH;
          const srcY = i * srcStripeH;

          // Enhanced parallax per stripe for more dramatic effect
          const speed = 0.3 + (i / Math.max(1, segments - 1)) * 1.2; // 0.3..1.5 for more dramatic movement
          const stripeOffsetX = drift.x * speed;

          ctx.save();
          ctx.translate(0, destY);
          if (i % 2 === 1) {
            // Flip vertically so edges align seamlessly
            ctx.translate(0, destStripeH);
            ctx.scale(1, -1);
          }

          // Tile horizontally to hide wrapping during drift
          const destW = width;
          const startX = -((stripeOffsetX % destW) + destW);
          for (let k = 0; k < 4; k += 1) { // Increased tiling for smoother movement
            const dx = startX + k * destW;
            ctx.drawImage(
              img,
              0,
              srcY,
              img.width,
              srcStripeH,
              dx,
              0,
              destW,
              destStripeH
            );
          }
          ctx.restore();
        }
      } else {
        // Radial fallback (original implementation)
        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.hypot(width, height) * 0.6;
        const wedge = (Math.PI * 2) / segments;

        const baseScale = Math.max(width / img.width, height / img.height) * 0.9;
        const drawW = img.width * baseScale;
        const drawH = img.height * baseScale;

        for (let i = 0; i < segments; i += 1) {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(i * wedge);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, radius, -wedge / 2, wedge / 2);
          ctx.closePath();
          ctx.clip();
          if (i % 2 === 1) ctx.scale(-1, 1);
          ctx.drawImage(
            img,
            -drawW / 2 + drift.x,
            -drawH / 2 + drift.y,
            drawW,
            drawH
          );
          ctx.restore();
        }
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        isRunning = false;
        cancelAnimationFrame(frameId);
      } else {
        isRunning = true;
        render();
      }
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    render();
    onScroll();

    return () => {
      isRunning = false;
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [imageSrc, mode, segments, orientation]);

  return (
    <div ref={containerRef} className="sticky top-0 w-full h-screen overflow-hidden -z-10">
      <canvas ref={canvasRef} className="absolute inset-0 block" />
    </div>
  );
};

export default Kaleidoscope;