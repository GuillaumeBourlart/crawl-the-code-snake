import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface Player {
  id?: string;
  x: number;
  y: number;
  size?: number;
  length?: number;
  color?: string;
  direction?: { x: number; y: number };
  queue?: Array<{ x: number; y: number }>; 
  boosting?: boolean;
  itemEatenCount?: number; // Added to match server data
}

interface GameItem {
  id: string;
  x: number;
  y: number;
  value: number;
  color: string;
  radius?: number;
}

interface GameState {
  players: Record<string, Player>;
  items?: GameItem[];
  worldSize: { width: number; height: number };
}

interface GameCanvasProps {
  gameState: GameState;
  playerId: string | null;
  onMove: (direction: { x: number; y: number }) => void;
  onBoostStart: () => void;
  onBoostStop: () => void;
  onPlayerCollision?: (otherPlayerId: string) => void;
  isSpectator?: boolean; // Added isSpectator prop to the interface
}

const BASE_SIZE = 20;
const DEFAULT_ITEM_EATEN_COUNT = 18; // This is set to match the server constant

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

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

function darkenColor(color: string, percent: number) {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = Math.floor(R * (100 - percent) / 100);
  G = Math.floor(G * (100 - percent) / 100);
  B = Math.floor(B * (100 - percent) / 100);

  R = (R < 0) ? 0 : R;
  G = (G < 0) ? 0 : G;
  B = (B < 0) ? 0 : B;

  const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
  const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
  const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

  return "#" + RR + GG + BB;
}

let _joystickDirection = { x: 0, y: 0 };

export const handleJoystickDirection = (direction: { x: number; y: number }) => {
  _joystickDirection = direction;
};

const getHeadRadius = (player: Player): number => {
  return BASE_SIZE / 2 + Math.max(0, (player.itemEatenCount || 0) - DEFAULT_ITEM_EATEN_COUNT) * 0.05;
};

const getSegmentRadius = (player: Player): number => {
  return BASE_SIZE / 2 + Math.max(0, (player.itemEatenCount || 0) - DEFAULT_ITEM_EATEN_COUNT) * 0.05;
};

const GameCanvas = ({ 
  gameState, 
  playerId, 
  onMove, 
  onBoostStart,
  onBoostStop,
  onPlayerCollision,
  isSpectator = false // Default to false if not provided
}: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = useIsMobile();
  const [camera, setCamera] = useState({ 
    x: 0, 
    y: 0, 
    zoom: isMobile ? 0.5 : 1.5
  });
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>(0);
  const rendererStateRef = useRef({
    players: {} as Record<string, Player>,
    items: [] as GameItem[],
    gridNeedsUpdate: true,
    mousePosition: { x: 0, y: 0 },
    joystickDirection: { x: 0, y: 0 },
    boostParticles: [] as {x: number, y: number, size: number, alpha: number, vx: number, vy: number, color: string}[],
    itemAnimations: {} as Record<string, { 
      offsetX: number, 
      offsetY: number, 
      phaseX: number, 
      phaseY: number, 
      speedX: number, 
      speedY: number,
      radius: number,
      rotationSpeed: number,
      rotationAngle: number
    }>
  });
  const gridCacheCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  useEffect(() => {
    if (window) {
      (window as any).handleJoystickDirection = handleJoystickDirection;
    }
    
    const updateJoystickDirection = () => {
      rendererStateRef.current.joystickDirection = _joystickDirection;
      requestAnimationFrame(updateJoystickDirection);
    };
    
    const requestId = requestAnimationFrame(updateJoystickDirection);
    
    return () => {
      cancelAnimationFrame(requestId);
    };
  }, []);
  
  useEffect(() => {
    if (!playerId || !gameState.players[playerId]) return;
    
    const player = gameState.players[playerId];
    setCamera(prev => ({
      ...prev,
      x: player.x,
      y: player.y
    }));
  }, [gameState, playerId]);
  
  useEffect(() => {
    if (!playerId) return;
    
    if (isSpectator) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      
      rendererStateRef.current.mousePosition = { x: canvasX, y: canvasY };
      
      const player = gameState.players[playerId];
      if (!player) return;
      
      const worldX = (canvasX / canvas.width) * canvas.width / camera.zoom + camera.x - canvas.width / camera.zoom / 2;
      const worldY = (canvasY / canvas.height) * canvas.height / camera.zoom + camera.y - canvas.height / camera.zoom / 2;
      
      const dx = worldX - player.x;
      const dy = worldY - player.y;
      
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > 0) {
        const normalizedDx = dx / length;
        const normalizedDy = dy / length;
        onMove({ x: normalizedDx, y: normalizedDy });
      }
    };
    
    const handleMouseDown = () => {
      onBoostStart();
    };
    
    const handleMouseUp = () => {
      onBoostStop();
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [gameState, playerId, onMove, onBoostStart, onBoostStop, camera, isSpectator]);
  
  useEffect(() => {
    if (!playerId || !gameState.players[playerId] || !onPlayerCollision || isSpectator) return;
    
    const currentPlayer = gameState.players[playerId];
    const currentHeadRadius = getHeadRadius(currentPlayer);
    
    Object.entries(gameState.players).forEach(([otherId, otherPlayer]) => {
      if (otherId === playerId) return;
      
      const otherHeadRadius = getHeadRadius(otherPlayer);
      const dx = currentPlayer.x - otherPlayer.x;
      const dy = currentPlayer.y - otherPlayer.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < (currentHeadRadius + otherHeadRadius)) {
        const currentQueueLength = currentPlayer.queue?.length || 0;
        const otherQueueLength = otherPlayer.queue?.length || 0;
        
        if (currentQueueLength <= otherQueueLength) {
          onPlayerCollision(otherId);
          return;
        }
      }
      
      if (otherPlayer.queue && otherPlayer.queue.length > 0) {
        const segmentRadius = getSegmentRadius(otherPlayer);
        
        for (const segment of otherPlayer.queue) {
          const segDx = currentPlayer.x - segment.x;
          const segDy = currentPlayer.y - segment.y;
          const segDistance = Math.sqrt(segDx * segDx + segDy * segDy);
          
          if (segDistance < (currentHeadRadius + segmentRadius)) {
            onPlayerCollision(otherId);
            return;
          }
        }
      }
    });
  }, [gameState, playerId, onPlayerCollision, isSpectator]);
  
  useEffect(() => {
    if (!gameState.items) return;
    
    const currentItemsById = rendererStateRef.current.items.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {} as Record<string, GameItem>);
    
    gameState.items.forEach(item => {
      if (!rendererStateRef.current.itemAnimations[item.id]) {
        rendererStateRef.current.itemAnimations[item.id] = {
          offsetX: 0, 
          offsetY: 0,
          phaseX: Math.random() * Math.PI * 2, 
          phaseY: Math.random() * Math.PI * 2,
          speedX: 0.5 + Math.random() * 0.5,
          speedY: 0.5 + Math.random() * 0.5,
          radius: 2 + Math.random() * 3,
          rotationSpeed: 0.5 + Math.random() * 1.5,
          rotationAngle: Math.random() * Math.PI * 2
        };
      }
    });
    
    Object.keys(rendererStateRef.current.itemAnimations).forEach(id => {
      if (!gameState.items?.find(item => item.id === id)) {
        delete rendererStateRef.current.itemAnimations[id];
      }
    });
    
    rendererStateRef.current.players = { ...gameState.players };
    rendererStateRef.current.items = gameState.items || [];
  }, [gameState]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    
    if (!gridCacheCanvasRef.current) {
      gridCacheCanvasRef.current = document.createElement('canvas');
    }
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      if (gridCacheCanvasRef.current) {
        gridCacheCanvasRef.current.width = canvas.width;
        gridCacheCanvasRef.current.height = canvas.height;
      }
      
      rendererStateRef.current.gridNeedsUpdate = true;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const updateGridCache = () => {
      const gridCanvas = gridCacheCanvasRef.current;
      if (!gridCanvas) return;
      
      const gridCtx = gridCanvas.getContext('2d', { alpha: false });
      if (!gridCtx) return;
      
      const width = gridCanvas.width;
      const height = gridCanvas.height;
      
      gridCtx.fillStyle = '#000000';
      gridCtx.fillRect(0, 0, width, height);
      
      const numberOfStars = 300;
      for (let i = 0; i < numberOfStars; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 1.5;
        const brightness = (Math.random() * 0.7 + 0.3) * 0.4;
        
        const timeOffset = Math.random() * 2 * Math.PI;
        const twinkleOpacity = 0.12 + 0.28 * 0.4 * Math.sin(Date.now() * 0.0004 * 0.4 + timeOffset);
        
        gridCtx.fillStyle = `rgba(255, 255, 255, ${brightness * twinkleOpacity})`;
        gridCtx.beginPath();
        gridCtx.arc(x, y, size, 0, Math.PI * 2);
        gridCtx.fill();
      }
      
      const centerGlow = gridCtx.createRadialGradient(
        width/2, height/2, 0,
        width/2, height/2, height * 0.4
      );
      centerGlow.addColorStop(0, 'rgba(30, 30, 50, 0.2)');
      centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      gridCtx.fillStyle = centerGlow;
      gridCtx.fillRect(0, 0, width, height);
      
      gridCtx.save();
      
      gridCtx.translate(gridCanvas.width / 2, gridCanvas.height / 2);
      gridCtx.scale(camera.zoom, camera.zoom);
      gridCtx.translate(-camera.x, -camera.y);
      
      const hexSize = 40;
      const hexHeight = hexSize * Math.sqrt(3);
      const hexWidth = hexSize * 2;
      
      const worldRows = Math.ceil(gameState.worldSize.height / (hexHeight * 0.75)) + 2;
      const worldCols = Math.ceil(gameState.worldSize.width / (hexWidth * 0.75)) + 2;
      
      gridCtx.lineWidth = 20;
      
      for (let row = -2; row < worldRows; row++) {
        for (let col = -2; col < worldCols; col++) {
          const centerX = col * hexWidth * 0.75;
          const centerY = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);
          
          const hexId = row * 10000 + col;
          const random = Math.sin(hexId) * 0.5 + 0.5;
          const time = Date.now() * 0.001;
          const pulseMagnitude = 0.2 + 0.8 * Math.sin((time + hexId * 0.1) * 0.2);
          
          const baseHue = 210 + (random * 40 - 20);
          
          gridCtx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = centerX + hexSize * Math.cos(angle);
            const y = centerY + hexSize * Math.sin(angle);
            
            if (i === 0) {
              gridCtx.moveTo(x, y);
            } else {
              gridCtx.lineTo(x, y);
            }
          }
          gridCtx.closePath();
          
          const fillColor = `hsla(${baseHue}, 30%, 20%, 0.05)`;
          gridCtx.fillStyle = fillColor;
          gridCtx.fill();
          
          gridCtx.strokeStyle = '#000000';
          gridCtx.stroke();
        }
      }
      
      const borderWidth = 4;
      const borderGlow = 15;
      
      gridCtx.shadowColor = 'rgba(0, 255, 255, 0.8)';
      gridCtx.shadowBlur = borderGlow;
      gridCtx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
      gridCtx.lineWidth = borderWidth + borderGlow;
      gridCtx.strokeRect(0, 0, gameState.worldSize.width, gameState.worldSize.height);
      
      gridCtx.shadowBlur = 0;
      gridCtx.strokeStyle = '#00ffff';
      gridCtx.lineWidth = borderWidth;
      gridCtx.strokeRect(0, 0, gameState.worldSize.width, gameState.worldSize.height);
      
      const time = Date.now() * 0.001;
      const pulseIntensity = 0.5 + 0.5 * Math.sin(time);
      
      gridCtx.strokeStyle = `rgba(0, 255, 255, ${0.3 * pulseIntensity})`;
      gridCtx.lineWidth = borderWidth + 10;
      gridCtx.strokeRect(0, 0, gameState.worldSize.width, gameState.worldSize.height);
      
      gridCtx.restore();
      
      rendererStateRef.current.gridNeedsUpdate = false;
    };
    
    const drawPlayerHead = (player: Player, isCurrentPlayer: boolean) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      
      const headRadius = getHeadRadius(player);
      const playerColor = player.color || (isCurrentPlayer ? '#8B5CF6' : '#FFFFFF');
      
      let pupilOffsetX = 0;
      let pupilOffsetY = 0;
      
      ctx.save();
      
      // Draw circular head
      const gradient = ctx.createRadialGradient(
        player.x, player.y, 0,
        player.x, player.y, headRadius
      );
      gradient.addColorStop(0, playerColor);
      gradient.addColorStop(1, shadeColor(playerColor, -15));
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(player.x, player.y, headRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw normal border with better visibility
      ctx.strokeStyle = shadeColor(playerColor, -30); // Darker than before for better visibility
      ctx.lineWidth = 1.5; // Slightly thicker border
      ctx.beginPath();
      ctx.arc(player.x, player.y, headRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw circuit board pattern
      ctx.save();
      ctx.beginPath();
      ctx.arc(player.x, player.y, headRadius * 0.9, 0, Math.PI * 2);
      ctx.clip();
      
      // Circuit lines
      ctx.strokeStyle = `${darkenColor(playerColor, 30)}80`;
      ctx.lineWidth = 1;
      
      // Horizontal lines
      const lineSpacing = headRadius * 0.25;
      for (let y = -headRadius; y <= headRadius; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(player.x - headRadius, player.y + y);
        ctx.lineTo(player.x + headRadius, player.y + y);
        ctx.stroke();
      }
      
      // Vertical lines
      for (let x = -headRadius; x <= headRadius; x += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(player.x + x, player.y - headRadius);
        ctx.lineTo(player.x + x, player.y + headRadius);
        ctx.stroke();
      }
      
      // Circuit nodes
      const nodeColor = shadeColor(playerColor, 20);
      const nodePositions = [
        { x: -0.5, y: -0.3 },
        { x: 0.5, y: -0.3 },
        { x: 0, y: 0.2 },
        { x: -0.4, y: 0.5 },
        { x: 0.4, y: 0.5 },
      ];
      
      nodePositions.forEach(pos => {
        const nodeX = player.x + pos.x * headRadius * 0.7;
        const nodeY = player.y + pos.y * headRadius * 0.7;
        const nodeSize = headRadius * 0.1;
        
        ctx.fillStyle = nodeColor;
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, nodeSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = darkenColor(playerColor, 40);
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, nodeSize, 0, Math.PI * 2);
        ctx.stroke();
      });
      
      ctx.restore();
      
      // Add inner circular detail
      const innerRadius = headRadius * 0.65;
      const coreGradient = ctx.createRadialGradient(
        player.x, player.y, innerRadius * 0.1,
        player.x, player.y, innerRadius * 0.7
      );
      coreGradient.addColorStop(0, shadeColor(playerColor, 20));
      coreGradient.addColorStop(1, shadeColor(playerColor, -10));
      
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(player.x, player.y, innerRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Add eyes - REPOSITIONED BASED ON HEAD SIZE
      const eyeSize = headRadius * 0.35; // Keep the larger eye size
      const eyeDistance = headRadius * 0.4; // Increased from 0.25 to 0.4 to spread eyes further apart
      const eyeOffsetY = -headRadius * 0.15; // Moved up slightly for better positioning
      
      // Calculate pupil offsets based on input or direction
      if (isCurrentPlayer) {
        if (isMobile) {
          const joystickDir = rendererStateRef.current.joystickDirection;
          if (joystickDir && (joystickDir.x !== 0 || joystickDir.y !== 0)) {
            const maxPupilOffset = eyeSize * 0.3;
            pupilOffsetX = joystickDir.x * maxPupilOffset;
            pupilOffsetY = joystickDir.y * maxPupilOffset;
          }
        } else {
          const mousePos = rendererStateRef.current.mousePosition;
          if (mousePos) {
            const canvasWidth = canvasRef.current?.width || 0;
            const canvasHeight = canvasRef.current?.height || 0;
            
            const worldMouseX = (mousePos.x / canvasWidth) * canvasWidth / camera.zoom + camera.x - canvasWidth / camera.zoom / 2;
            const worldMouseY = (mousePos.y / canvasHeight) * canvasHeight / camera.zoom + camera.y - canvasHeight / camera.zoom / 2;
            
            const dx = worldMouseX - player.x;
            const dy = worldMouseY - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
              const maxPupilOffset = eyeSize * 0.3;
              pupilOffsetX = (dx / distance) * maxPupilOffset;
              pupilOffsetY = (dy / distance) * maxPupilOffset;
            }
          }
        }
      }
      
      // Draw eye whites with improved contrast
      const eyeGradient = ctx.createRadialGradient(
        player.x - eyeDistance, player.y + eyeOffsetY, eyeSize * 0.2,
        player.x - eyeDistance, player.y + eyeOffsetY, eyeSize
      );
      eyeGradient.addColorStop(0, "#FFFFFF"); // Pure white
      eyeGradient.addColorStop(1, "#F0F0F0"); // Still very bright
      
      // Left eye
      ctx.fillStyle = eyeGradient;
      ctx.beginPath();
      ctx.arc(player.x - eyeDistance, player.y + eyeOffsetY, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Eye border - normal border
      ctx.strokeStyle = "#666666";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(player.x - eyeDistance, player.y + eyeOffsetY, eyeSize, 0, Math.PI * 2);
      ctx.stroke();
      
      // Right eye
      ctx.fillStyle = eyeGradient;
      ctx.beginPath();
      ctx.arc(player.x + eyeDistance, player.y + eyeOffsetY, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Eye border - normal border
      ctx.strokeStyle = "#666666";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(player.x + eyeDistance, player.y + eyeOffsetY, eyeSize, 0, Math.PI * 2);
      ctx.stroke();
      
      // Improved pupils - keeping large size
      const pupilSize = eyeSize * 0.75;
      
      const pupilGradient = ctx.createRadialGradient(
        player.x - eyeDistance + pupilOffsetX, player.y + eyeOffsetY + pupilOffsetY, 0,
        player.x - eyeDistance + pupilOffsetX, player.y + eyeOffsetY + pupilOffsetY, pupilSize
      );
      pupilGradient.addColorStop(0, "#000000"); // Pure black center
      pupilGradient.addColorStop(1, "#111111"); // Very dark outside
      
      // Left pupil
      ctx.fillStyle = pupilGradient;
      ctx.beginPath();
      ctx.arc(player.x - eyeDistance + pupilOffsetX, player.y + eyeOffsetY + pupilOffsetY, pupilSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Right pupil
      ctx.beginPath();
      ctx.arc(player.x + eyeDistance + pupilOffsetX, player.y + eyeOffsetY + pupilOffsetY, pupilSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Improved eye highlights - repositioned based on new eye positions
      const highlightSize = eyeSize * 0.4;
      ctx.fillStyle = "#FFFFFF"; // Pure white
      
      // Left eye highlight
      ctx.beginPath();
      ctx.arc(
        player.x - eyeDistance + pupilOffsetX - eyeSize * 0.25, 
        player.y + eyeOffsetY + pupilOffsetY - eyeSize * 0.25, 
        highlightSize, 
        0, Math.PI * 2
      );
      ctx.fill();
      
      // Right eye highlight
      ctx.beginPath();
      ctx.arc(
        player.x + eyeDistance + pupilOffsetX - eyeSize * 0.25, 
        player.y + eyeOffsetY + pupilOffsetY - eyeSize * 0.25, 
        highlightSize, 
        0, Math.PI * 2
      );
      ctx.fill();
      
      // Add mouth - POSITION LOWERED FURTHER
      const mouthY = player.y + headRadius * 0.45; // Moved from 0.35 to 0.45 to place mouth even lower
      const mouthWidth = headRadius * 0.4;
      
      // Expression based on boosting
      if (player.boosting) {
        // Open mouth when boosting
        ctx.fillStyle = "#333333";
        ctx.beginPath();
        ctx.arc(player.x, mouthY, mouthWidth * 0.6, 0, Math.PI);
        ctx.fill();
        
        // Add teeth
        ctx.fillStyle = "#FFFFFF";
        const teethWidth = mouthWidth * 0.15;
        const teethHeight = mouthWidth * 0.2;
        const teethGap = mouthWidth * 0.2;
        
        ctx.fillRect(player.x - teethGap - teethWidth, mouthY - teethHeight, teethWidth, teethHeight);
        ctx.fillRect(player.x + teethGap, mouthY - teethHeight, teethWidth, teethHeight);
      } else {
        // Regular smile when not boosting
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x, mouthY - mouthWidth * 0.6, mouthWidth, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
      }
      
      // Add boost glow if boosting
      if (player.boosting) {
        const glowColor = playerColor;
        
        const glowRadius = headRadius * 1.5;
        const boostGradient = ctx.createRadialGradient(
          player.x, player.y, headRadius,
          player.x, player.y, glowRadius
        );
        
        boostGradient.addColorStop(0, `${glowColor}40`);
        boostGradient.addColorStop(0.5, `${glowColor}20`);
        boostGradient.addColorStop(1, `${glowColor}00`);
        
        ctx.fillStyle = boostGradient;
        ctx.beginPath();
        ctx.arc(player.x, player.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    };
    
    const renderFrame = (timestamp: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      
      const numberOfStars = 200;
      const time = Date.now() * 0.0004 * 0.4;
      
      for (let i = 0; i < numberOfStars; i++) {
        const seed = i * 5237;
        const x = ((Math.sin(seed) + 1) / 2) * width;
        const y = ((Math.cos(seed * 1.5) + 1) / 2) * height;
        
        const twinkleSpeed = (0.5 + (seed % 2) * 0.5) * 0.4 * 0.4;
        const twinklePhase = time * twinkleSpeed + seed;
        const twinkleAmount = 0.12 + 0.28 * 0.4 * Math.sin(twinklePhase);
        
        const size = (0.5 + Math.sin(seed * 3) * 0.5) * 1.5;
        const opacity = twinkleAmount * 0.28;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      const centerGlow = ctx.createRadialGradient(
        width/2, height/2, 0,
        width/2, height/2, height * 0.4
      );
      centerGlow.addColorStop(0, 'rgba(30, 30, 50, 0.15)');
      centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, width, height);
      
      if (rendererStateRef.current.gridNeedsUpdate && gridCacheCanvasRef.current) {
        updateGridCache();
      }
      
      if (gridCacheCanvasRef.current) {
        ctx.drawImage(gridCacheCanvasRef.current, 0, 0);
      }
      
      ctx.save();
      
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(camera.zoom, camera.zoom);
      ctx.translate(-camera.x, -camera.y);
      
      const viewportLeft = camera.x - canvas.width / camera.zoom / 2 - 100;
      const viewportRight = camera.x + canvas.width / camera.zoom / 2 + 100;
      const viewportTop = camera.y - canvas.height / camera.zoom / 2 - 100;
      const viewportBottom = camera.y + canvas.height / camera.zoom / 2 + 100;
      
      const boostParticles = rendererStateRef.current.boostParticles;
      for (let i = boostParticles.length - 1; i >= 0; i--) {
        const particle = boostParticles[i];
        
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        particle.size *= 0.92;
        particle.alpha *= 0.92;
        
        if (particle.size < 0.5 || particle.alpha < 0.05) {
          boostParticles.splice(i, 1);
          continue;
        }
        
        if (particle.x >= viewportLeft && 
            particle.x <= viewportRight && 
            particle.y >= viewportTop && 
            particle.y <= viewportBottom) {
          const particleGradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size
          );
          
          particleGradient.addColorStop(0, `${particle.color}${Math.floor(particle.alpha * 255).toString(16).padStart(2, '0')}`);
          particleGradient.addColorStop(1, `${particle.color}00`);
          
          ctx.fillStyle = particleGradient;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      if (rendererStateRef.current.items.length > 0) {
        const currentTime = Date.now() * 0.001;
        
        const visibleItems = rendererStateRef.current.items.filter(item => 
          item.x >= viewportLeft && 
          item.x <= viewportRight && 
          item.y >= viewportTop && 
          item.y <= viewportBottom
        );
        
        visibleItems.forEach(item => {
          const itemRadius = item.radius || 10;
          const animation = rendererStateRef.current.itemAnimations[item.id];
          
          if (animation) {
            animation.rotationAngle += animation.rotationSpeed * 0.01;
            
            animation.offsetX = Math.cos(animation.rotationAngle) * animation.radius;
            animation.offsetY = Math.sin(animation.rotationAngle) * animation.radius;
            
            const bobOffset = Math.sin(currentTime * 2) * 0.7;
            animation.offsetY += bobOffset;
          }
          
          const displayX = item.x + (animation?.offsetX || 0);
          const displayY = item.y + (animation?.offsetY || 0);
          
          // Enhanced glow effect - approximately 2x the item radius
          const haloSize = itemRadius * 2.0; // Increased from 1.8 to 2.0
          const glowGradient = ctx.createRadialGradient(
            displayX, displayY, itemRadius * 0.8,
            displayX, displayY, haloSize
          );
          
          const rgbColor = hexToRgb(item.color || '#FFFFFF');
          const haloColor = rgbColor ? 
            `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.3)` : // Increased opacity from 0.15 to 0.3
            'rgba(255, 255, 255, 0.3)';
          
          glowGradient.addColorStop(0, haloColor);
          glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(displayX, displayY, haloSize, 0, Math.PI * 2);
          ctx.fill();
          
          // Add a second outer glow layer for more pronounced effect
          const outerGlowSize = itemRadius * 2.5;
          const outerGlowGradient = ctx.createRadialGradient(
            displayX, displayY, haloSize,
            displayX, displayY, outerGlowSize
          );
          
          outerGlowGradient.addColorStop(0, rgbColor ? 
            `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.1)` : 
            'rgba(255, 255, 255, 0.1)');
          outerGlowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          
          ctx.fillStyle = outerGlowGradient;
          ctx.beginPath();
          ctx.arc(displayX, displayY, outerGlowSize, 0, Math.PI * 2);
          ctx.fill();
          
          const itemGlowSize = itemRadius * 1.1;
          const itemGlow = ctx.createRadialGradient(
            displayX, displayY, 0,
            displayX, displayY, itemGlowSize
          );
          
          const pulseFactor = 0.2 * Math.sin(currentTime * 2 + (item.id.charCodeAt(0) || 0)) + 0.8;
          const glowColor = rgbColor ? 
            `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.4)` : 
            'rgba(255, 255, 255, 0.4)';
          
          itemGlow.addColorStop(0, item.color || '#FFFFFF');
          itemGlow.addColorStop(0.7, item.color || '#FFFFFF');
          itemGlow.addColorStop(1, glowColor);
          
          ctx.fillStyle = itemGlow;
          ctx.beginPath();
          ctx.arc(displayX, displayY, itemRadius * pulseFactor, 0, Math.PI * 2);
          ctx.fill();
          
          const highlightSize = Math.max(3, itemRadius * 0.3);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.beginPath();
          ctx.arc(displayX - itemRadius * 0.3, displayY - itemRadius * 0.3, highlightSize, 0, Math.PI * 2);
          ctx.fill();
          
          const trailLength = 4;
          for (let i = 1; i <= trailLength; i++) {
            const trailAngle = animation ? animation.rotationAngle - (i * 0.2) : 0;
            const trailX = item.x + (animation ? Math.cos(trailAngle) * animation.radius : 0);
            const trailY = item.y + (animation ? Math.sin(trailAngle) * animation.radius : 0);
            
            const trailOpacity = 0.2 - (i * 0.05);
            const trailSize = itemRadius * 0.6 * (1 - i * 0.15);
            
            const trailColor = rgbColor ? 
              `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${trailOpacity})` : 
              `rgba(255, 255, 255, ${trailOpacity})`;
            
            ctx.fillStyle = trailColor;
            ctx.beginPath();
            ctx.arc(trailX, trailY, trailSize, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }
      
      Object.entries(rendererStateRef.current.players).forEach(([id, player]) => {
        const isCurrentPlayer = id === playerId;
        const segmentRadius = getSegmentRadius(player);
        const baseColor = player.color || (isCurrentPlayer ? '#8B5CF6' : '#FFFFFF');
        
        if (player.queue && player.queue.length > 0) {
          const visibleQueue = player.queue.filter(segment => 
            segment.x >= viewportLeft && 
            segment.x <= viewportRight && 
            segment.y >= viewportTop && 
            segment.y <= viewportBottom
          );
          
          if (visibleQueue.length > 0) {
            [...visibleQueue].reverse().forEach(segment => {
              const segmentGradient = ctx.createRadialGradient(
                segment.x, segment.y, 0,
                segment.x, segment.y, segmentRadius
              );
              segmentGradient.addColorStop(0, shadeColor(baseColor, 10));
              segmentGradient.addColorStop(1, baseColor);
              
              ctx.fillStyle = segmentGradient;
              
              ctx.beginPath();
              ctx.arc(segment.x, segment.y, segmentRadius, 0, Math.PI * 2);
              ctx.fill();
              
              // Segment border - improve visibility
              ctx.strokeStyle = shadeColor(baseColor, -30); // Darker for more contrast 
              ctx.lineWidth = 1.5; // Slightly thicker border for better visibility
              ctx.beginPath();
              ctx.arc(segment.x, segment.y, segmentRadius, 0, Math.PI * 2);
              ctx.stroke();
              
              if (player.boosting) {
                const time = Date.now() / 300;
                const pulseFactor = 0.2 * Math.sin(time + segment.x * 0.01) + 0.8;
                
                const glowGradient = ctx.createRadialGradient(
                  segment.x, segment.y, segmentRadius * 0.6,
                  segment.x, segment.y, segmentRadius * 1.6 * pulseFactor
                );
                
                glowGradient.addColorStop(0, `${baseColor}40`);
                glowGradient.addColorStop(0.5, `${baseColor}20`);
                glowGradient.addColorStop(1, `${baseColor}00`);
                
                ctx.fillStyle = glowGradient;
                ctx.beginPath();
                ctx.arc(segment.x, segment.y, segmentRadius * 1.6 * pulseFactor, 0, Math.PI * 2);
                ctx.fill();
              }
            });
          }
        }
        
        drawPlayerHead(player, isCurrentPlayer);
        
        if (
          player.x < viewportLeft ||
          player.x > viewportRight ||
          player.y < viewportTop ||
          player.y > viewportBottom
        ) {
          const dx = player.x - camera.x;
          const dy = player.y - camera.y;
          const angle = Math.atan2(dy, dx);
          
          const edgeRadius = Math.min(canvas.width, canvas.height) / 2 / camera.zoom * 0.9;
          const edgeX = camera.x + Math.cos(angle) * edgeRadius;
          const edgeY = camera.y + Math.sin(angle) * edgeRadius;
          
          ctx.save();
          ctx.translate(edgeX, edgeY);
          ctx.rotate(angle);
          
          const arrowSize = 15 / camera.zoom;
          
          ctx.fillStyle = player.color || '#FFFFFF';
          ctx.beginPath();
          ctx.moveTo(arrowSize, 0);
          ctx.lineTo(-arrowSize / 2, arrowSize / 2);
          ctx.lineTo(-arrowSize / 2, -arrowSize / 2);
          ctx.closePath();
          ctx.fill();
          
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1 / camera.zoom;
          ctx.stroke();
          
          const distance = Math.round(Math.sqrt(dx * dx + dy * dy));
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `${12 / camera.zoom}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillText(`${distance}`, 0, arrowSize + 15 / camera.zoom);
          
          ctx.restore();
        }
        
        if (isCurrentPlayer) {
          ctx.fillStyle = '#FFFF00';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`You (${player.queue?.length || 0})`, player.x, player.y - getHeadRadius(player) - 15);
        } else {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`Player (${player.queue?.length || 0})`, player.x, player.y - getHeadRadius(player) - 15);
        }
      });
      
      ctx.restore();
      
      requestRef.current = requestAnimationFrame(renderFrame);
    };
    
    requestRef.current = requestAnimationFrame(renderFrame);
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [camera, gameState, playerId, isMobile]);
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{ touchAction: 'none' }}
    />
  );
};

export default GameCanvas;
