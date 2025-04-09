
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
    
    // Snake properties - with doubled radius
    const segmentSize = width / 6; // Double the size (changed from width/12)
    const segmentGap = 0.2; // Facteur d'espacement entre segments (20% de la taille)
    const segmentCount = 20; // Montrer exactement 20 segments pour correspondre à la structure du serveur
    
    // Animation properties
    let animationFrame: number;
    let angle = 0;

    const renderSnake = () => {
      ctx.clearRect(0, 0, width, height);
      
      if (pattern === 'circular') {
        // Create an array to store all segments (including head)
        let segments = [];
        
        // Calcul de l'espacement identique au serveur
        const tailSpacing = segmentSize * 0.2;
        const segmentSpacing = (segmentSize * 2) + tailSpacing;
        
        // Add the 19 snake segments (body) in a circular pattern to the array
        for (let i = 0; i < 19; i++) {
          const segmentAngle = animate 
            ? angle + (i * 0.2) // Réduire l'ondulation de 0.3 à 0.2
            : (Math.PI / 4) + (i * 0.2);
            
          const distance = (i + 1) * segmentSpacing;
          
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
        
        // Calculer la position de la tête pour qu'elle suive le premier segment
        // plutôt que de rester fixe au centre
        const headAngle = animate ? angle : Math.PI / 4;
        const headX = centerX + Math.cos(headAngle) * segmentSpacing * 0.5;
        const headY = centerY + Math.sin(headAngle) * segmentSpacing * 0.5;
        
        // Draw head (premier segment) last - so it's on top with the highest z-index
        const headColor = skin.data.colors[0];
        ctx.fillStyle = headColor;
        ctx.beginPath();
        ctx.arc(headX, headY, segmentSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
      } else if (pattern === 'snake') {
        // Draw snake segments in a snake-like pattern - exactly 20 circles
        const pathLength = width * 0.7;
        const amplitude = height * 0.15; // Réduire l'amplitude de 0.2 à 0.15 pour moins d'ondulation
        const frequency = 1.5; // Réduire la fréquence pour moins d'ondulation
        
        // Calcul de l'espacement identique au serveur
        const tailSpacing = segmentSize * 0.2;
        const segmentSpacing = (segmentSize * 2) + tailSpacing;
        const distanceBetweenSegments = pathLength / 20;
        
        // Create an array to store all segments (including head)
        let segments = [];
        
        // Calculate head position - first element of the snake
        const headProgress = 0;
        const wavePhase = animate ? angle * 2 : 0;
        const headX = centerX - pathLength * 0.3;
        const headY = centerY + Math.sin(headProgress * frequency * Math.PI + wavePhase) * amplitude;
        
        // Add body segments to the array with consistent spacing
        for (let i = 1; i < 20; i++) {
          const progress = i / 20;
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
        angle += 0.01; // Réduire la vitesse d'animation de 0.02 à 0.01
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
      className="rounded-lg"
    />
  );
};

export default SkinPreview;
