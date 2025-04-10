
import { useEffect, useRef } from 'react';

interface HexBackgroundProps {
  className?: string;
}

const HexBackground = ({ className = "" }: HexBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawHexagons();
    };

    const drawHexagons = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      // Draw background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, width, height);
      
      // Draw stars
      const numberOfStars = 200;
      for (let i = 0; i < numberOfStars; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 1.5;
        const brightness = (Math.random() * 0.7 + 0.3) * 0.4;
        
        const timeOffset = Math.random() * 2 * Math.PI;
        const twinkleOpacity = 0.12 + 0.28 * 0.4 * Math.sin(Date.now() * 0.0004 * 0.4 + timeOffset);
        
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness * twinkleOpacity})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw hexagons
      const hexSize = 40;
      const hexHeight = hexSize * Math.sqrt(3);
      const hexWidth = hexSize * 2;
      
      const rows = Math.ceil(height / (hexHeight * 0.75)) + 2;
      const cols = Math.ceil(width / (hexWidth * 0.75)) + 2;
      
      // Increased border width to match the canvas style
      ctx.lineWidth = 20;
      
      for (let row = -2; row < rows; row++) {
        for (let col = -2; col < cols; col++) {
          const centerX = col * hexWidth * 0.75;
          const centerY = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);
          
          const hexId = row * 10000 + col;
          const random = Math.sin(hexId) * 0.5 + 0.5;
          const time = Date.now() * 0.001;
          const pulseMagnitude = 0.2 + 0.8 * Math.sin((time + hexId * 0.1) * 0.2);
          
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
          
          // Use the exact gray color requested: 3C3C3C with some transparency
          const fillColor = `rgba(60, 60, 60, 0.15)`;  // 3C3C3C in RGB is 60,60,60
          ctx.fillStyle = fillColor;
          ctx.fill();
          
          // Use solid black for stroke (border) color - no alpha
          ctx.strokeStyle = '#000000';
          ctx.stroke();
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      drawHexagons();
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
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
