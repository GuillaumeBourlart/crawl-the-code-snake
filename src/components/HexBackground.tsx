
import { useEffect, useRef } from 'react';

interface HexBackgroundProps {
  className?: string;
}

const HexBackground = ({ className = "" }: HexBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastRenderTimeRef = useRef<number>(0);
  const targetFPS = 15; // Réduit à 15 FPS pour économiser les ressources
  const frameInterval = 1000 / targetFPS;
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    
    // Création du canvas off-screen
    offscreenCanvasRef.current = document.createElement('canvas');
    const offscreenCanvas = offscreenCanvasRef.current;
    const offscreenCtx = offscreenCanvas.getContext('2d', { alpha: true });
    if (!offscreenCtx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Redimensionner également le canvas off-screen
      offscreenCanvas.width = canvas.width;
      offscreenCanvas.height = canvas.height;
      
      // Pré-rendre la grille hexagonale de base (partie statique)
      drawStaticHexGrid(offscreenCtx, offscreenCanvas.width, offscreenCanvas.height);
    };

    // Dessiner la grille hexagonale statique une seule fois
    const drawStaticHexGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);
      
      // Draw hexagons
      const hexSize = 140;
      const hexHeight = hexSize * Math.sqrt(3);
      const hexWidth = hexSize * 2;
      
      const rows = Math.ceil(height / (hexHeight * 0.75)) + 2;
      const cols = Math.ceil(width / (hexWidth * 0.75)) + 2;
      
      // Increased border width to match the canvas style
      ctx.lineWidth = 40;
      
      for (let row = -2; row < rows; row++) {
        for (let col = -2; col < cols; col++) {
          const centerX = col * hexWidth * 0.75;
          const centerY = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);
          
          const hexId = row * 10000 + col;
          const random = Math.sin(hexId) * 0.5 + 0.5;
          
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
          
          const fillColor = `hsla(${baseHue}, 30%, 20%, 0.05)`;
          ctx.fillStyle = fillColor;
          ctx.fill();
          
          ctx.strokeStyle = '#000000';
          ctx.stroke();
        }
      }
    };

    const drawAnimatedOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      // Draw center glow (partie animée)
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
    
    // Animation loop avec throttling
    let animationFrameId: number;
    const animate = (timestamp: number) => {
      // Throttle le rendu pour économiser les ressources
      const elapsed = timestamp - lastRenderTimeRef.current;
      
      if (elapsed > frameInterval) {
        lastRenderTimeRef.current = timestamp - (elapsed % frameInterval);
        
        // Dessiner d'abord la grille statique prérendue
        ctx.drawImage(offscreenCanvas, 0, 0);
        
        // Ajouter ensuite les effets animés
        drawAnimatedOverlay(ctx, canvas.width, canvas.height);
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
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
