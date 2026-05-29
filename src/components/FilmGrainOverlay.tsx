import { useEffect, useRef } from 'react';

const FilmGrainOverlay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const grainSize = 150;
    canvas.width = grainSize;
    canvas.height = grainSize;

    let frame = 0;
    const animate = () => {
      frame++;
      if (frame % 3 !== 0) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const imageData = ctx.createImageData(grainSize, grainSize);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 18;
      }

      ctx.putImageData(imageData, 0, 0);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-20 pointer-events-none opacity-60"
        style={{
          width: '100vw',
          height: '100vh',
          imageRendering: 'auto',
        }}
      />
      <div
        className="fixed inset-0 z-20 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.25) 100%)',
        }}
      />
    </>
  );
};

export default FilmGrainOverlay;
