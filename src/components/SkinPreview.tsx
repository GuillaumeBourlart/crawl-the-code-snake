
import { useEffect, useRef } from 'react';
import { GameSkin } from '@/types/supabase';

interface SkinPreviewProps {
  skin: GameSkin;
  size?: 'small' | 'medium' | 'large';
  animate?: boolean;
  pattern?: 'circular' | 'snake'; // Pattern prop for different rendering modes
}

const SkinPreview = ({ 
  skin, 
  size = 'medium', 
  animate = true, 
  pattern = 'circular' 
}: SkinPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Larger dimensions for better visibility
  const dimensions = {
    small: { width: 140, height: 140 },
    medium: { width: 240, height: 240 },
    large: { width: 340, height: 340 },
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions[size];
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Increase segment size for better visibility
    const segmentSize = width / 4.25; // Adjusted for better fit
    
    // Animation properties
    let animationFrame: number;
    let angle = 0;

    const renderSnake = () => {
      ctx.clearRect(0, 0, width, height);
      
      if (pattern === 'circular') {
        // Use the server-side logic: head uses colors[0], body segments use colors[1-19] repeating
        const skinColors = skin.data.colors;
        
        // Create an array to store all segments (including head)
        let segments = [];
        
        // Calculate spacing identical to server
        const tailSpacing = segmentSize * 0.2;
        const segmentSpacing = (segmentSize * 1.5) + tailSpacing;
        
        // Reduce the max distance to ensure snake is fully visible within canvas
        const maxDistance = width * 0.3; // Reduced to keep snake centered
        
        // Add the 19 snake segments (body) in a circular pattern
        for (let i = 0; i < 19; i++) {
          // Always animate regardless of hover state
          // Reverse angle direction by adding a negative sign to make it move counterclockwise
          const segmentAngle = angle + (i * 0.2);
            
          // Calculate appropriate distance to ensure snake stays within canvas
          // Use a percentage of maxDistance to scale snake body properly
          const distance = Math.min((i + 1) * (maxDistance / 20), maxDistance);
          
          // Use negative cosine to reverse the direction (moving left instead of right)
          const x = centerX + Math.cos(segmentAngle) * distance;
          const y = centerY + Math.sin(segmentAngle) * distance;
          
          // Use the server logic: segments use colors[1] through colors[19], repeating if needed
          const colorIndex = (i % 19) + 1; // Use 1-19 indices for segments
          
          segments.push({
            x,
            y,
            radius: segmentSize / 2,
            color: skinColors[colorIndex]
          });
        }
        
        // Draw segments in reverse order (from back to front)
        for (let i = segments.length - 1; i >= 0; i--) {
          const segment = segments[i];
          ctx.fillStyle = segment.color;
          ctx.beginPath();
          ctx.arc(segment.x, segment.y, segment.radius, 0, Math.PI * 2);
          ctx.fill();
          
          // Add outline
          ctx.strokeStyle = shadeColor(segment.color, -30);
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        
        // Calculate head position to lead the snake
        // Always animate regardless of hover state
        const headAngle = angle;
        // Use positive cosine to reverse the direction (moving left instead of right)
        const headX = centerX + Math.cos(headAngle) * segmentSpacing * 0.5;
        const headY = centerY + Math.sin(headAngle) * segmentSpacing * 0.5;
        const headRadius = segmentSize / 2; // Same size as body segments
        
        // Draw head with colors[0] to match server-side logic
        const headColor = skinColors[0];
        
        // Create gradient for head
        const gradient = ctx.createRadialGradient(
          headX, headY, 0,
          headX, headY, headRadius
        );
        gradient.addColorStop(0, headColor);
        gradient.addColorStop(1, shadeColor(headColor, -15));
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add outline to head
        ctx.strokeStyle = shadeColor(headColor, -30);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Direction vector for eye placement (now pointing LEFT in preview)
        const dirX = -1; // Left direction
        const dirY = 0;
        
        // Get perpendicular direction for eye placement
        const perpDirX = -dirY;
        const perpDirY = dirX;
        
        // Eye parameters per requirements
        const eyeRadius = headRadius * 0.35; // Slightly smaller relative to head
        const eyeDistance = eyeRadius * 1.2; // Placed side by side without overlap
        const eyeOffsetX = headRadius * 0.3; // Offset to the LEFT side of head
        
        // Eye positions
        const leftEyeX = headX - eyeOffsetX - perpDirX * eyeDistance;
        const leftEyeY = headY + perpDirY * eyeDistance;
        const rightEyeX = headX - eyeOffsetX + perpDirX * eyeDistance;
        const rightEyeY = headY - perpDirY * eyeDistance;
        
        // Draw eyes with white background
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = "#666666";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = "#666666";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, eyeRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw pupils (looking LEFT)
        const pupilSize = eyeRadius * 0.6;
        const pupilOffsetX = eyeRadius * 0.35; // Pupils looking LEFT
        
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(leftEyeX - pupilOffsetX, leftEyeY, pupilSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(rightEyeX - pupilOffsetX, rightEyeY, pupilSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Add highlights to eyes
        const highlightSize = eyeRadius * 0.3;
        const highlightOffsetX = pupilSize * 0.5;
        const highlightOffsetY = -pupilSize * 0.5;
        
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(
          leftEyeX - pupilOffsetX - highlightOffsetX, 
          leftEyeY + highlightOffsetY, 
          highlightSize, 
          0, Math.PI * 2
        );
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(
          rightEyeX - pupilOffsetX - highlightOffsetX, 
          rightEyeY + highlightOffsetY, 
          highlightSize, 
          0, Math.PI * 2
        );
        ctx.fill();
        
      } else if (pattern === 'snake') {
        // Draw snake segments in a snake-like pattern - 20 circles
        const skinColors = skin.data.colors;
        const pathLength = width * 0.65;
        const amplitude = height * 0.12;
        const frequency = 1.5;
        
        // Calculate spacing
        const tailSpacing = segmentSize * 0.2;
        const segmentSpacing = (segmentSize * 1.4) + tailSpacing; // Adjusted for better fit
        
        // Create an array to store body segments
        let segments = [];
        
        // Calculate body segments - using colors 1-19
        for (let i = 1; i < 20; i++) {
          const progress = i / 20;
          // Position snake within canvas bounds - ensuring it's centered
          // Adjust scale to ensure snake is fully visible
          const x = width * (0.25 + progress * 0.5); // Centered horizontal positioning
          // Always animate regardless of hover state
          const wavePhase = angle * 2;
          const y = centerY + Math.sin(progress * frequency * Math.PI + wavePhase) * amplitude;
          
          // Use the server-side color assignment logic:
          // For segments, use colors[1] through colors[19]
          const colorIndex = ((i - 1) % 19) + 1;
          
          segments.push({
            x,
            y,
            radius: segmentSize / 2,
            color: skinColors[colorIndex]
          });
        }
        
        // Draw segments in reverse order (from back to front)
        for (let i = segments.length - 1; i >= 0; i--) {
          const segment = segments[i];
          
          // Create gradient for segment
          const gradient = ctx.createRadialGradient(
            segment.x, segment.y, 0,
            segment.x, segment.y, segment.radius
          );
          gradient.addColorStop(0, segment.color);
          gradient.addColorStop(1, shadeColor(segment.color, -15));
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(segment.x, segment.y, segment.radius, 0, Math.PI * 2);
          ctx.fill();
          
          // Add outline
          ctx.strokeStyle = shadeColor(segment.color, -30);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(segment.x, segment.y, segment.radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // Draw head with the first color
        const headX = width * 0.25; // Positioned at the left side
        // Always animate regardless of hover state
        const wavePhase = angle * 2;
        const headY = centerY + Math.sin(wavePhase) * amplitude;
        const headRadius = segmentSize / 2; // Same size as body segments
        
        // Create gradient for head
        const headGradient = ctx.createRadialGradient(
          headX, headY, 0,
          headX, headY, headRadius
        );
        headGradient.addColorStop(0, skinColors[0]);
        headGradient.addColorStop(1, shadeColor(skinColors[0], -15));
        
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add outline to head
        ctx.strokeStyle = shadeColor(skinColors[0], -30);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Direction is LEFT in the snake preview
        const dirX = -1; // Left direction
        const dirY = 0;
        
        // Eye parameters per requirements
        const eyeRadius = headRadius * 0.35; // Smaller relative to head
        const eyeDistance = eyeRadius * 1.2; // Side by side without overlap
        const eyeOffsetX = headRadius * 0.3; // Offset to the LEFT side of head
        
        // Eye positions (perpendicular to the LEFT direction)
        const leftEyeX = headX - eyeOffsetX;
        const leftEyeY = headY + eyeDistance;
        const rightEyeX = headX - eyeOffsetX;
        const rightEyeY = headY - eyeDistance;
        
        // Draw eyes with white background
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = "#666666";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = "#666666";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, eyeRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw pupils (looking LEFT)
        const pupilSize = eyeRadius * 0.6;
        const pupilOffsetX = eyeRadius * 0.35; // Pupils looking LEFT
        
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(leftEyeX - pupilOffsetX, leftEyeY, pupilSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(rightEyeX - pupilOffsetX, rightEyeY, pupilSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Add highlights to eyes
        const highlightSize = eyeRadius * 0.3;
        const highlightOffsetX = pupilSize * 0.5;
        const highlightOffsetY = -pupilSize * 0.5;
        
        ctx.fillStyle = "#FFFFFF";
        
        ctx.beginPath();
        ctx.arc(
          leftEyeX - pupilOffsetX - highlightOffsetX, 
          leftEyeY + highlightOffsetY, 
          highlightSize, 
          0, Math.PI * 2
        );
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(
          rightEyeX - pupilOffsetX - highlightOffsetX, 
          rightEyeY + highlightOffsetY, 
          highlightSize, 
          0, Math.PI * 2
        );
        ctx.fill();
      }

      // Always animate regardless of whether the mouse is hovering
      // Changed angle increment to be negative to reverse the direction
      angle -= 0.01;
      animationFrame = requestAnimationFrame(renderSnake);
    };

    renderSnake();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [skin, size, pattern]); // Removed animate from dependencies since we always animate now

  const { width, height } = dimensions[size];

  // Helper function to darken a color (used for outlines)
  function shadeColor(color: string, percent: number) {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = Math.floor(R * (100 + percent) / 100);
    G = Math.floor(G * (100 + percent) / 100);
    B = Math.floor(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

    return "#" + RR + GG + BB;
  }

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      className="rounded-lg max-w-full"
    />
  );
};

export default SkinPreview;
