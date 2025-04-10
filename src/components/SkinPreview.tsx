
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
    small: { width: 140, height: 140 },   // Increased from 120x120
    medium: { width: 240, height: 240 },  // Increased from 220x220
    large: { width: 340, height: 340 },   // Increased from 320x320
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
    const segmentSize = width / 4.5; // Increased for larger segments
    
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
        
        // Add the 19 snake segments (body) in a circular pattern
        for (let i = 0; i < 19; i++) {
          const segmentAngle = animate 
            ? angle + (i * 0.2)
            : (Math.PI / 4) + (i * 0.2);
            
          // Calculate appropriate distance to ensure snake stays within canvas
          const maxDistance = width * 0.4;
          const distance = Math.min((i + 1) * segmentSpacing, maxDistance);
          
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
        const headAngle = animate ? angle : Math.PI / 4;
        const headX = centerX + Math.cos(headAngle) * segmentSpacing * 0.5;
        const headY = centerY + Math.sin(headAngle) * segmentSpacing * 0.5;
        const headRadius = segmentSize * 0.6;
        
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
        
        // Calculate direction vector for eye placement
        const nextAngle = animate ? angle + 0.2 : Math.PI / 4 + 0.2;
        const nextX = centerX + Math.cos(nextAngle) * segmentSpacing * 1.5;
        const nextY = centerY + Math.sin(nextAngle) * segmentSpacing * 1.5;
        
        const dirX = nextX - headX;
        const dirY = nextY - headY;
        
        const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);
        const normalizedDirX = dirX / dirLength;
        const normalizedDirY = dirY / dirLength;
        
        // Get perpendicular direction for eye placement
        const perpDirX = -normalizedDirY;
        const perpDirY = normalizedDirX;
        
        // Eye parameters - match game style
        const eyeDistance = headRadius * 0.32;
        const eyeForwardOffset = headRadius * 0.3;
        const eyeSize = headRadius * 0.4;
        const pupilSize = eyeSize * 0.55;
        
        // Eye positions
        const leftEyeX = headX + normalizedDirX * eyeForwardOffset - perpDirX * eyeDistance;
        const leftEyeY = headY + normalizedDirY * eyeForwardOffset - perpDirY * eyeDistance;
        const rightEyeX = headX + normalizedDirX * eyeForwardOffset + perpDirX * eyeDistance;
        const rightEyeY = headY + normalizedDirY * eyeForwardOffset + perpDirY * eyeDistance;
        
        // Draw eyes with gradients like in the game
        const leftEyeGradient = ctx.createRadialGradient(
          leftEyeX, leftEyeY, eyeSize * 0.2,
          leftEyeX, leftEyeY, eyeSize
        );
        leftEyeGradient.addColorStop(0, "#FFFFFF");
        leftEyeGradient.addColorStop(1, "#F0F0F0");
        
        ctx.fillStyle = leftEyeGradient;
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = "#666666";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
        ctx.stroke();
        
        const rightEyeGradient = ctx.createRadialGradient(
          rightEyeX, rightEyeY, eyeSize * 0.2,
          rightEyeX, rightEyeY, eyeSize
        );
        rightEyeGradient.addColorStop(0, "#FFFFFF");
        rightEyeGradient.addColorStop(1, "#F0F0F0");
        
        ctx.fillStyle = rightEyeGradient;
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = "#666666";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
        ctx.stroke();
        
        // Pupils that look in the direction of movement
        const pupilGradient = ctx.createRadialGradient(
          leftEyeX, leftEyeY, 0,
          leftEyeX, leftEyeY, pupilSize
        );
        pupilGradient.addColorStop(0, "#000000");
        pupilGradient.addColorStop(1, "#111111");
        
        ctx.fillStyle = pupilGradient;
        ctx.beginPath();
        ctx.arc(leftEyeX + normalizedDirX * eyeSize * 0.3, leftEyeY + normalizedDirY * eyeSize * 0.3, pupilSize, 0, Math.PI * 2);
        ctx.fill();
        
        const rightPupilGradient = ctx.createRadialGradient(
          rightEyeX, rightEyeY, 0,
          rightEyeX, rightEyeY, pupilSize
        );
        rightPupilGradient.addColorStop(0, "#000000");
        rightPupilGradient.addColorStop(1, "#111111");
        
        ctx.fillStyle = rightPupilGradient;
        ctx.beginPath();
        ctx.arc(rightEyeX + normalizedDirX * eyeSize * 0.3, rightEyeY + normalizedDirY * eyeSize * 0.3, pupilSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Add highlights to eyes
        const highlightSize = eyeSize * 0.4;
        ctx.fillStyle = "#FFFFFF";
        
        ctx.beginPath();
        ctx.arc(
          leftEyeX + normalizedDirX * eyeSize * 0.3 - eyeSize * 0.25, 
          leftEyeY + normalizedDirY * eyeSize * 0.3 - eyeSize * 0.25, 
          highlightSize, 
          0, Math.PI * 2
        );
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(
          rightEyeX + normalizedDirX * eyeSize * 0.3 - eyeSize * 0.25, 
          rightEyeY + normalizedDirY * eyeSize * 0.3 - eyeSize * 0.25, 
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
        const segmentSpacing = (segmentSize * 1.8) + tailSpacing;
        
        // Create an array to store body segments
        let segments = [];
        
        // Calculate body segments - using colors 1-19
        for (let i = 1; i < 20; i++) {
          const progress = i / 20;
          // Position snake within canvas bounds
          const x = width * 0.25 + progress * pathLength * 0.8;
          const wavePhase = animate ? angle * 2 : 0;
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
        const headSize = segmentSize * 1.2;
        const headX = width * 0.25;
        const wavePhase = animate ? angle * 2 : 0;
        const headY = centerY + Math.sin(wavePhase) * amplitude;
        
        // Create gradient for head
        const headGradient = ctx.createRadialGradient(
          headX, headY, 0,
          headX, headY, headSize / 2
        );
        headGradient.addColorStop(0, skinColors[0]);
        headGradient.addColorStop(1, shadeColor(skinColors[0], -15));
        
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.arc(headX, headY, headSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Add outline to head
        ctx.strokeStyle = shadeColor(skinColors[0], -30);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(headX, headY, headSize / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Head is always facing right in snake pattern
        const dirX = 1;
        const dirY = 0;
        
        // Eye parameters - match game style
        const eyeDistance = headSize * 0.25;
        const eyeForwardOffset = headSize * 0.3;
        const eyeSize = headSize * 0.35;
        const pupilSize = eyeSize * 0.55;
        
        // Eye positions
        const leftEyeX = headX + dirX * eyeForwardOffset - dirY * eyeDistance;
        const leftEyeY = headY + dirY * eyeForwardOffset + dirX * eyeDistance;
        const rightEyeX = headX + dirX * eyeForwardOffset + dirY * eyeDistance;
        const rightEyeY = headY + dirY * eyeForwardOffset - dirX * eyeDistance;
        
        // Draw eyes with gradients like in the game
        const leftEyeGradient = ctx.createRadialGradient(
          leftEyeX, leftEyeY, eyeSize * 0.2,
          leftEyeX, leftEyeY, eyeSize
        );
        leftEyeGradient.addColorStop(0, "#FFFFFF");
        leftEyeGradient.addColorStop(1, "#F0F0F0");
        
        ctx.fillStyle = leftEyeGradient;
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = "#666666";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
        ctx.stroke();
        
        const rightEyeGradient = ctx.createRadialGradient(
          rightEyeX, rightEyeY, eyeSize * 0.2,
          rightEyeX, rightEyeY, eyeSize
        );
        rightEyeGradient.addColorStop(0, "#FFFFFF");
        rightEyeGradient.addColorStop(1, "#F0F0F0");
        
        ctx.fillStyle = rightEyeGradient;
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = "#666666";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw pupils that look in the direction of movement
        const pupilGradient = ctx.createRadialGradient(
          leftEyeX, leftEyeY, 0,
          leftEyeX, leftEyeY, pupilSize
        );
        pupilGradient.addColorStop(0, "#000000");
        pupilGradient.addColorStop(1, "#111111");
        
        ctx.fillStyle = pupilGradient;
        ctx.beginPath();
        ctx.arc(leftEyeX + dirX * eyeSize * 0.3, leftEyeY + dirY * eyeSize * 0.3, pupilSize, 0, Math.PI * 2);
        ctx.fill();
        
        const rightPupilGradient = ctx.createRadialGradient(
          rightEyeX, rightEyeY, 0,
          rightEyeX, rightEyeY, pupilSize
        );
        rightPupilGradient.addColorStop(0, "#000000");
        rightPupilGradient.addColorStop(1, "#111111");
        
        ctx.fillStyle = rightPupilGradient;
        ctx.beginPath();
        ctx.arc(rightEyeX + dirX * eyeSize * 0.3, rightEyeY + dirY * eyeSize * 0.3, pupilSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Add highlights to eyes
        const highlightSize = eyeSize * 0.4;
        ctx.fillStyle = "#FFFFFF";
        
        ctx.beginPath();
        ctx.arc(
          leftEyeX + dirX * eyeSize * 0.3 - eyeSize * 0.25, 
          leftEyeY + dirY * eyeSize * 0.3 - eyeSize * 0.25, 
          highlightSize, 
          0, Math.PI * 2
        );
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(
          rightEyeX + dirX * eyeSize * 0.3 - eyeSize * 0.25, 
          rightEyeY + dirY * eyeSize * 0.3 - eyeSize * 0.25, 
          highlightSize, 
          0, Math.PI * 2
        );
        ctx.fill();
      }

      if (animate) {
        angle += 0.01;
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
      className="rounded-lg bg-gray-900/30"
    />
  );
};

export default SkinPreview;
