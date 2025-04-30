import { useEffect, useRef } from 'react';

interface HexBackgroundProps {
  className?: string;
  paused?: boolean;
}

const BG_SRC = '/image/background.png';

const HexBackground = ({ className = "", paused = false }: HexBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Créer l'offscreen-canvas
    offscreenCanvasRef.current = document.createElement('canvas');
    const offscreenCanvas = offscreenCanvasRef.current;
    const offCtx = offscreenCanvas.getContext('2d');
    if (!offCtx) return;

    // Charger l'image une fois
    const img = new Image();
    img.src = BG_SRC;
    let pattern: CanvasPattern | null = null;
    img.onload = () => {
      pattern = ctx.createPattern(img, 'repeat');
      resize();
    };

    // Ajuste les deux canvas et dessine le pattern dans l'offscreen
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      offscreenCanvas.width = w;
      offscreenCanvas.height = h;

      if (pattern) {
        offCtx.clearRect(0, 0, w, h);
        offCtx.fillStyle = pattern;
        offCtx.fillRect(0, 0, w, h);
      }
    };
    window.addEventListener('resize', resize);
    resize();

    // Boucle d’animation (simple copy du cache)
    let raf: number;
    const draw = () => {
      if (!paused && offscreenCanvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(offscreenCanvas, 0, 0);
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      offscreenCanvasRef.current = null;
    };
  }, [paused]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full -z-10 ${className}`}
    />
  );
};

export default HexBackground;
