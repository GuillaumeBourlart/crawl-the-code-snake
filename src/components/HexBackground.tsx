
import { useEffect, useRef } from 'react';

interface HexBackgroundProps {
  className?: string;
  paused?: boolean;
}

const HexBackground = ({ className = "", paused = false }: HexBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    
    // Create offscreen canvas for caching
    offscreenCanvasRef.current = document.createElement('canvas');
    const offscreenCanvas = offscreenCanvasRef.current;
    const offscreenCtx = offscreenCanvas.getContext('2d', { alpha: true });
    if (!offscreenCtx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Resize offscreen canvas
      offscreenCanvas.width = window.innerWidth;
      offscreenCanvas.height = window.innerHeight;
      
      // Draw hexagon grid once in offscreen canvas
      drawHexagonGrid(offscreenCtx, offscreenCanvas.width, offscreenCanvas.height);
    };
    
    // Function to draw static hexagon grid on offscreen canvas
    const drawHexagonGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);
      
      // Plain black background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);
      
      // Hexagons
      const hexSize = 140;
      const hexHeight = hexSize * Math.sqrt(3);
      const hexWidth = hexSize * 2;
      
      const rows = Math.ceil(height / (hexHeight * 0.75)) + 2;
      const cols = Math.ceil(width / (hexWidth * 0.75)) + 2;
      
      // Border width
      ctx.lineWidth = 40;
      
      for (let row = -2; row < rows; row++) {
        for (let col = -2; col < cols; col++) {
          const centerX = col * hexWidth * 0.75;
          const centerY = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);
          
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
          
          // Simplified fill style - dark gray, no gradient
          ctx.fillStyle = '#222222';
          ctx.fill();
          
          ctx.strokeStyle = '#000000';
          ctx.stroke();
        }
      }
    };

    const drawAnimatedElements = () => {
      if (paused) return; // Skip animation if paused
      
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear main canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw background from cache
      if (offscreenCanvas) {
        ctx.drawImage(offscreenCanvas, 0, 0);
      }
      
      // Simplified center glow - very subtle
      const centerGlow = ctx.createRadialGradient(
        width/2, height/2, 0,
        width/2, height/2, height * 0.4
      );
      centerGlow.addColorStop(0, 'rgba(20, 20, 30, 0.1)');
      centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, width, height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Animation loop only for animated elements
    let animationFrameId: number;
    const animate = () => {
      drawAnimatedElements();
      if (!paused) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
      
      // Clean up offscreen canvas
      if (offscreenCanvasRef.current) {
        offscreenCanvasRef.current = null;
      }
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
