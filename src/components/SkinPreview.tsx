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

  // Increase the dimensions for better visibility
  const dimensions = {
    small: { width: 120, height: 120 }, // Increased from 100x100
    medium: { width: 220, height: 220 }, // Increased from 200x200
    large: { width: 320, height: 320 }, // Increased from 300x300
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions[size];
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Increase segment size for better visibility but ensure snake stays within canvas
    const segmentSize = width / 5; // Increased from width/6 for larger segments
    const segmentGap = 0.2; // Spacing factor between segments (20% of size)
    const segmentCount = 20; // Show exactly 20 segments to match server structure
    
    // Animation properties
    let animationFrame: number;
    let angle = 0;

    const renderSnake = () => {
      ctx.clearRect(0, 0, width, height);
      
      if (pattern === 'circular') {
        // Create an array to store all segments (including head)
        let segments = [];
        
        // Calculate spacing identical to server
        const tailSpacing = segmentSize * 0.2;
        // Reduce spacing to keep snake within bounds
        const segmentSpacing = (segmentSize * 1.5) + tailSpacing; // Reduced from 2.0 to 1.5
        
        // Add the 19 snake segments (body) in a circular pattern to the array
        for (let i = 0; i < 19; i++) {
          const segmentAngle = animate 
            ? angle + (i * 0.2) // Reduced undulation from 0.3 to 0.2
            : (Math.PI / 4) + (i * 0.2);
            
          // Scale the distance to ensure snake stays within canvas
          const distance = Math.min((i + 1) * segmentSpacing, width * 0.4);
          
          const x = centerX + Math.cos(segmentAngle) * distance;
          const y = centerY + Math.sin(segmentAngle) * distance;
          
          // Use the appropriate color from the skin's colors array - match server logic
          // For segments, use colors[1] through colors[19], repeating if needed
          const colorIndex = (i % 19) + 1; // Use 1-19 indices for segments
          
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
        
        // Calculate head position to follow the first segment
        // rather than staying fixed at center
        const headAngle = animate ? angle : Math.PI / 4;
        const headX = centerX + Math.cos(headAngle) * segmentSpacing * 0.5;
        const headY = centerY + Math.sin(headAngle) * segmentSpacing * 0.5;
        
        // Draw head (first segment) last with colors[0] - so it's on top with the highest z-index
        const headColor = skin.data.colors[0]; // Always use first color for head
        ctx.fillStyle = headColor;
        ctx.beginPath();
        ctx.arc(headX, headY, segmentSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // Calculate eye positions based on the direction of movement
        // Determine the direction vector (from head to first segment)
        const nextAngle = animate ? angle + 0.2 : Math.PI / 4 + 0.2;
        const nextX = centerX + Math.cos(nextAngle) * segmentSpacing * 1.5;
        const nextY = centerY + Math.sin(nextAngle) * segmentSpacing * 1.5;
        
        // Direction vector
        const dirX = nextX - headX;
        const dirY = nextY - headY;
        
        // Normalize direction vector
        const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);
        const normalizedDirX = dirX / dirLength;
        const normalizedDirY = dirY / dirLength;
        
        // Get perpendicular direction for eye placement
        const perpDirX = -normalizedDirY;
        const perpDirY = normalizedDirX;
        
        // Move eyes more toward front of head but keep them within the circle
        const eyeDistance = segmentSize * 0.32; // Decreased from 0.35 to 0.32
        const eyeForwardOffset = segmentSize * 0.3; // Decreased from 0.4 to 0.3
        
        // Eye positions - more forward facing but not overlapping
        const leftEyeX = headX + normalizedDirX * eyeForwardOffset - perpDirX * eyeDistance;
        const leftEyeY = headY + normalizedDirY * eyeForwardOffset - perpDirY * eyeDistance;
        const rightEyeX = headX + normalizedDirX * eyeForwardOffset + perpDirX * eyeDistance;
        const rightEyeY = headY + normalizedDirY * eyeForwardOffset + perpDirY * eyeDistance;
        
        // Increase eye size but keep it proportional to head
        const eyeSize = segmentSize * 0.32; // Increased from 0.25 to 0.32
        const pupilSize = eyeSize * 0.6;
        
        // Eyes
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(leftEyeX + normalizedDirX * eyeSize * 0.3, leftEyeY + normalizedDirY * eyeSize * 0.3, pupilSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(rightEyeX + normalizedDirX * eyeSize * 0.3, rightEyeY + normalizedDirY * eyeSize * 0.3, pupilSize, 0, Math.PI * 2);
        ctx.fill();
      } else if (pattern === 'snake') {
        // Draw snake segments in a snake-like pattern - exactly 20 circles
        const pathLength = width * 0.65; // Reduced from 0.7 to 0.65 to ensure it's fully visible
        const amplitude = height * 0.12; // Reduced from 0.15 to 0.12 for less undulation
        const frequency = 1.5; // Reduced frequency for less undulation
        
        // Calculate spacing identical to server
        const tailSpacing = segmentSize * 0.2;
        const segmentSpacing = (segmentSize * 1.8) + tailSpacing; // Reduced from 2.0 to 1.8
        const distanceBetweenSegments = pathLength / 20;
        
        // Create an array to store all segments (including head)
        let segments = [];
        
        // Calculate body segments to draw first - using colors 1-19
        for (let i = 1; i < 20; i++) {
          const progress = i / 20;
          // Adjust positioning to ensure the snake stays fully within the canvas
          const x = centerX - pathLength * 0.25 + progress * pathLength * 0.8;
          const wavePhase = animate ? angle * 2 : 0;
          const y = centerY + Math.sin(progress * frequency * Math.PI + wavePhase) * amplitude;
          
          // Use the color at the corresponding index in the skin's color array
          // For segments, use colors[1] through colors[19], repeating if needed
          const colorIndex = ((i - 1) % 19) + 1; // Use 1-19 indices for segments
          
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
        const headProgress = 0;
        const wavePhase = animate ? angle * 2 : 0;
        // Position head at the beginning of the path, adjusted to stay within canvas
        const headX = centerX - pathLength * 0.25;
        const headY = centerY + Math.sin(headProgress * frequency * Math.PI + wavePhase) * amplitude;
        
        // Set head color - use colors[0] to match server-side logic
        ctx.fillStyle = skin.data.colors[0]; // Always use first color for head
        ctx.beginPath();
        ctx.arc(headX, headY, headSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Calculate direction vector for eye placement
        // For snake pattern, we'll use the direction to the next segment
        let dirX = 1; // Default direction (to the right)
        let dirY = 0;
        
        if (segments.length > 0) {
          // Get the first segment position
          const firstSegment = segments[0];
          // Calculate direction from head to first segment
          dirX = firstSegment.x - headX;
          dirY = firstSegment.y - headY;
          
          // Normalize the direction vector
          const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);
          if (dirLength > 0) {
            dirX = dirX / dirLength;
            dirY = dirY / dirLength;
          }
        }
        
        // Get perpendicular direction for eye placement
        const perpDirX = -dirY;
        const perpDirY = dirX;
        
        // Eye parameters - fixed positioning to prevent overlap
        const eyeDistance = headSize * 0.25; // Decreased from 0.32 to 0.25
        const eyeForwardOffset = headSize * 0.3; // Decreased from 0.4 to 0.3
        const eyeSize = headSize * 0.35; // Increased from 0.28 to 0.35
        const pupilSize = eyeSize * 0.5;
        
        // Eye positions - Switched sides to match the image
        const leftEyeX = headX + dirX * eyeForwardOffset - perpDirX * eyeDistance;
        const leftEyeY = headY + dirY * eyeForwardOffset - perpDirY * eyeDistance;
        const rightEyeX = headX + dirX * eyeForwardOffset + perpDirX * eyeDistance;
        const rightEyeY = headY + dirY * eyeForwardOffset + perpDirY * eyeDistance;
        
        // Eyes
        ctx.fillStyle = "#FFF";
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(leftEyeX + dirX * eyeSize * 0.3, leftEyeY + dirY * eyeSize * 0.3, pupilSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rightEyeX + dirX * eyeSize * 0.3, rightEyeY + dirY * eyeSize * 0.3, pupilSize, 0, Math.PI * 2);
        ctx.fill();
      }

      if (animate) {
        angle += 0.01; // Reduced animation speed from 0.02 to 0.01
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
