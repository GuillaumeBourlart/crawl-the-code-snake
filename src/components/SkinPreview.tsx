
import { useEffect, useRef } from 'react';
import { GameSkin } from '@/types/supabase';

interface SkinPreviewProps {
  skin: GameSkin;
  size?: 'small' | 'medium' | 'large';
  animate?: boolean;
}

const SkinPreview = ({ skin, size = 'medium', animate = true }: SkinPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const dimensions = {
    small: { width: 100, height: 100 },
    medium: { width: 200, height: 200 },
    large: { width: 300, height: 300 },
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions[size];
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Snake properties
    const segmentSize = width / 12;
    const segmentSpacing = skin.data.segmentSpacing || 0.9;
    const segmentCount = 8;
    
    // Animation properties
    let animationFrame: number;
    let angle = 0;

    const renderSnake = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw snake segments in a curved pattern
      for (let i = 0; i < segmentCount; i++) {
        const segmentAngle = animate 
          ? angle + (i * 0.4) 
          : (Math.PI / 4) + (i * 0.4);
          
        const distance = i * segmentSize * segmentSpacing;
        
        const x = centerX + Math.cos(segmentAngle) * distance;
        const y = centerY + Math.sin(segmentAngle) * distance;
        
        // Use colors from the skin, cycling through them
        const colorIndex = i % skin.data.colors.length;
        ctx.fillStyle = skin.data.colors[colorIndex];
        
        ctx.beginPath();
        ctx.arc(x, y, segmentSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      if (animate) {
        angle += 0.02;
        animationFrame = requestAnimationFrame(renderSnake);
      }
    };

    renderSnake();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [skin, size, animate]);

  const { width, height } = dimensions[size];

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      className="bg-gray-900/50 rounded-lg shadow-inner"
    />
  );
};

export default SkinPreview;
