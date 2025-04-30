
import { useEffect, useRef } from 'react';

interface HexBackgroundProps {
  className?: string;
}

const HexBackground = ({ className = "" }: HexBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    
    // Créer le canvas offscreen pour le cache
    offscreenCanvasRef.current = document.createElement('canvas');
    const offscreenCanvas = offscreenCanvasRef.current;
    const offscreenCtx = offscreenCanvas.getContext('2d', { alpha: true });
    if (!offscreenCtx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Redimensionner également le canvas offscreen
      offscreenCanvas.width = window.innerWidth;
      offscreenCanvas.height = window.innerHeight;
      
      // Dessiner la grille d'hexagones une seule fois dans le canvas offscreen
      drawHexagonGrid(offscreenCtx, offscreenCanvas.width, offscreenCanvas.height);
    };
    
    // Fonction pour dessiner la grille d'hexagones statique sur le canvas offscreen
    const drawHexagonGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);
      
      // Fond noir
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);
      
      // Hexagones
      const hexSize = 140;
      const hexHeight = hexSize * Math.sqrt(3);
      const hexWidth = hexSize * 2;
      
      const rows = Math.ceil(height / (hexHeight * 0.75)) + 2;
      const cols = Math.ceil(width / (hexWidth * 0.75)) + 2;
      
      // Largeur de bordure augmentée pour correspondre au style du canvas
      ctx.lineWidth = 40;
      
      for (let row = -2; row < rows; row++) {
        for (let col = -2; col < cols; col++) {
          const centerX = col * hexWidth * 0.75;
          const centerY = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);
          
          const hexId = row * 10000 + col;
          const random = Math.sin(hexId) * 0.5 + 0.5;
          
          // Style correspondant au jeu
          const baseHue = 210 + (random * 40 - 20);
          
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = centerX + hexSize * Math.cos(angle);
            const y = centerY + hexSize * Math.sin(angle);
            
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.closePath();
          
          // Style de remplissage identique à GameCanvas
          const fillColor = `hsla(${baseHue}, 30%, 20%, 0.05)`;
          ctx.fillStyle = fillColor;
          ctx.fill();
          
          ctx.strokeStyle = '#000000';
          ctx.stroke();
        }
      }
    };

    const drawAnimatedElements = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      // Effacer le canvas principal
      ctx.clearRect(0, 0, width, height);
      
      // Dessiner le fond depuis le cache
      if (offscreenCanvas) {
        ctx.drawImage(offscreenCanvas, 0, 0);
      }
      
      // Dessiner seulement les éléments animés (le glow central)
      const centerGlow = ctx.createRadialGradient(
        width/2, height/2, 0,
        width/2, height/2, height * 0.4
      );
      centerGlow.addColorStop(0, 'rgba(30, 30, 50, 0.15)');
      centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, width, height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Boucle d'animation pour les éléments animés uniquement
    let animationFrameId: number;
    const animate = () => {
      drawAnimatedElements();
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
      
      // Nettoyer le canvas offscreen
      if (offscreenCanvasRef.current) {
        offscreenCanvasRef.current = null;
      }
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className={`fixed inset-0 w-full h-full -z-10 ${className}`}
    />
  );
};

export default HexBackground;
