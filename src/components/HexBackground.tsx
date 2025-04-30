
import { useEffect, useRef } from 'react';

interface HexBackgroundProps {
  className?: string;
  paused?: boolean;
}

// Utiliser l'image téléchargée comme motif d'arrière-plan
const BG_SRC = '/lovable-uploads/5f6bfbbf-3d4c-4583-b25e-7da5106d819b.png';

const HexBackground = ({ className = "", paused = false }: HexBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Créer un pattern à partir de l'image
    const img = new Image();
    img.src = BG_SRC;
    
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      
      // Redessiner le pattern quand l'image est chargée
      if (img.complete) {
        drawPattern();
      }
    };

    const drawPattern = () => {
      if (!ctx || paused) return;
      
      // Créer un pattern répété
      const pattern = ctx.createPattern(img, 'repeat');
      if (pattern) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };
    
    // Dessiner l'image quand elle est chargée
    img.onload = () => {
      drawPattern();
    };

    // Ajuster le canvas quand la fenêtre change de taille
    window.addEventListener('resize', resize);
    resize();

    // Animation loop
    let raf: number;
    const animate = () => {
      if (!paused) {
        drawPattern();
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
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
