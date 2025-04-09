
import { useEffect, useRef } from 'react';
import { GameSkin } from '@/types/supabase';

interface SkinPreviewProps {
  skin: GameSkin;
  size?: 'small' | 'medium' | 'large';
  animate?: boolean;
  pattern?: 'circular' | 'snake'; // Add pattern prop for different rendering modes
}

const SkinPreview = ({ 
  skin, 
  size = 'medium', 
  animate = true, 
  pattern = 'circular' 
}: SkinPreviewProps) => {
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
    
    // Snake properties - use consistent spacing
    const segmentSize = width / 12;
    const segmentGap = 0.1; // Consistent gap between segments (10% of segment size)
    const segmentSpacing = 1 + segmentGap; // Consistent spacing factor
    const segmentCount = 20; // Showing exactly 20 segments to match server structure
    
    // Animation properties
    let animationFrame: number;
    let angle = 0;

    const renderSnake = () => {
      ctx.clearRect(0, 0, width, height);
      
      if (pattern === 'circular') {
        // Create an array to store all segments (including head)
        let segments = [];
        
        // Add the 19 snake segments in a circular pattern to the array
        for (let i = 0; i < 19; i++) {
          const segmentAngle = animate 
            ? angle + (i * 0.3) 
            : (Math.PI / 4) + (i * 0.3);
            
          const distance = (i + 1) * segmentSize * segmentSpacing;
          
          const x = centerX + Math.cos(segmentAngle) * distance;
          const y = centerY + Math.sin(segmentAngle) * distance;
          
          // Use the appropriate color from the skin's colors array
          const colorIndex = (i % skin.data.colors.length);
          
          segments.push({
            x,
            y,
            radius: segmentSize / 2,
            color: skin.data.colors[colorIndex]
          });
        }
        
        // Draw segments in reverse order (from back to front)
        // Last segments are drawn first (lowest z-index)
        for (let i = segments.length - 1; i >= 0; i--) {
          const segment = segments[i];
          ctx.fillStyle = segment.color;
          ctx.beginPath();
          ctx.arc(segment.x, segment.y, segment.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Draw head (premier segment) last - so it's on top with the highest z-index
        const headColor = skin.data.colors[0];
        ctx.fillStyle = headColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, segmentSize * 1.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (pattern === 'snake') {
        // Draw snake segments in a snake-like pattern - exactly 20 circles
        const pathLength = width * 0.7;
        const amplitude = height * 0.2;
        const frequency = 2;
        
        // Create an array to store all segments (including head)
        let segments = [];
        
        // Add body segments to the array - use consistent spacing for segments
        for (let i = 1; i < 20; i++) {
          const progress = i / 20;
          const wavePhase = animate ? angle * 3 : 0;
          const x = centerX - pathLength * 0.3 + progress * pathLength;
          const y = centerY + Math.sin(progress * frequency * Math.PI + wavePhase) * amplitude;
          
          // Use the color at the corresponding index in the skin's color array
          const colorIndex = (i - 1) % skin.data.colors.length;
          
          segments.push({
            x,
            y,
            radius: segmentSize / 2,
            color: skin.data.colors[colorIndex]
          });
        }
        
        // Draw segments in reverse order (from back to front)
        // Last segments are drawn first (lowest z-index)
        for (let i = segments.length - 1; i >= 0; i--) {
          const segment = segments[i];
          ctx.fillStyle = segment.color;
          ctx.beginPath();
          ctx.arc(segment.x, segment.y, segment.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Draw head with the first color (highest z-index)
        const headX = centerX - pathLength * 0.3;
        const headY = centerY;
        const headSize = segmentSize * 1.2;
        
        // Set head color - premier élément du tableau colors
        ctx.fillStyle = skin.data.colors[0];
        ctx.beginPath();
        ctx.arc(headX, headY, headSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        const eyeSize = headSize * 0.3;
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(headX - headSize * 0.2, headY - headSize * 0.2, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(headX - headSize * 0.2, headY + headSize * 0.2, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(headX - headSize * 0.25, headY - headSize * 0.2, eyeSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(headX - headSize * 0.25, headY + headSize * 0.2, eyeSize * 0.5, 0, Math.PI * 2);
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
  }, [skin, size, animate, pattern]);

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
