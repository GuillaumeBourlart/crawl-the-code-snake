import { useEffect, useRef } from 'react';

interface HexBackgroundProps {
  className?: string;
  paused?: boolean;
  /** URL de ta tuile (par exemple 64×64 px) */
  tileSrc: string;
}

const HexBackground = ({ className = "", paused = false, tileSrc }: HexBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1) Prépare la tuile et le offscreen canvas
    const tile = new Image();
    tile.src = tileSrc;

    offscreenRef.current = document.createElement('canvas');
    const off = offscreenRef.current;
    const offCtx = off.getContext('2d')!;

    const resize = () => {
      canvas.width = off.width = window.innerWidth;
      canvas.height = off.height = window.innerHeight;

      if (!tile.complete) return;
      // 2) Crée et dessine le pattern une seule fois
      const pattern = offCtx.createPattern(tile, 'repeat')!;
      offCtx.fillStyle = pattern;
      offCtx.fillRect(0, 0, off.width, off.height);
    };

    tile.onload = resize;
    window.addEventListener('resize', resize);
    resize();

    let frame: number;
    const loop = () => {
      if (paused) return;
      // 3) À chaque frame, on recopie simplement l’offscreen
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(off, 0, 0);

      // ici tu peux toujours ajouter ton glow si besoin…
      frame = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      offscreenRef.current = null;
    };
  }, [paused, tileSrc]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full -z-10 ${className}`}
    />
  );
};

export default HexBackground;
