
import { useEffect, useRef } from 'react';

interface HexBackgroundProps {
  className?: string;
}

const HexBackground = ({ className = '' }: HexBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let requestId: number;
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      time = 0; // Reset time on resize to avoid sudden changes
      renderBackground(time);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const renderBackground = (time: number) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      const numberOfStars = 150;
      for (let i = 0; i < numberOfStars; i++) {
        const seed = i * 5237;
        const x = ((Math.sin(seed) + 1) / 2) * canvas.width;
        const y = ((Math.cos(seed * 1.5) + 1) / 2) * canvas.height;
        
        const twinkleSpeed = (0.5 + (seed % 2) * 0.5) * 0.4 * 0.4;
        const twinklePhase = time * 0.0004 * twinkleSpeed + seed;
        const twinkleAmount = 0.12 + 0.28 * 0.4 * Math.sin(twinklePhase);
        
        const size = (0.5 + Math.sin(seed * 3) * 0.5) * 1.5;
        const opacity = twinkleAmount * 0.28;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Center glow effect
      const centerGlow = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, 0,
        canvas.width/2, canvas.height/2, canvas.height * 0.4
      );
      centerGlow.addColorStop(0, 'rgba(30, 30, 50, 0.15)');
      centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw hexagons grid
      const hexSize = 60;
      const hexHeight = hexSize * Math.sqrt(3);
      const hexWidth = hexSize * 2;
      
      const cols = Math.ceil(canvas.width / (hexWidth * 0.75)) + 2;
      const rows = Math.ceil(canvas.height / (hexHeight * 0.75)) + 2;
      
      ctx.lineWidth = 1;
      
      for (let row = -2; row < rows; row++) {
        for (let col = -2; col < cols; col++) {
          const centerX = col * hexWidth * 0.75;
          const centerY = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);
          
          const hexId = row * 10000 + col;
          const random = Math.sin(hexId) * 0.5 + 0.5;
          const pulseMagnitude = 0.2 + 0.8 * Math.sin((time * 0.001 + hexId * 0.1) * 0.2);
          
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
          
          ctx.strokeStyle = `hsla(${baseHue}, 70%, 50%, ${0.1 * pulseMagnitude})`;
          ctx.stroke();
        }
      }

      time += 16; // Approximately 60 FPS
      requestId = requestAnimationFrame(() => renderBackground(time));
    };

    renderBackground(time);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(requestId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className={`fixed top-0 left-0 w-full h-full -z-10 ${className}`}
    />
  );
};

export default HexBackground;
