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
}

const BASE_SIZE = 20;
const DEFAULT_ITEM_EATEN_COUNT = 18; // Constant used in the server

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

// Updated to match exactly with server code
const getHeadRadius = (player: Player): number => {
  return BASE_SIZE / 2 + Math.max(0, (player.itemEatenCount || 0) - DEFAULT_ITEM_EATEN_COUNT) * 0.001;
};

// Updated to match exactly with server code
const getSegmentRadius = (player: Player): number => {
  return BASE_SIZE / 2 + Math.max(0, (player.itemEatenCount || 0) - DEFAULT_ITEM_EATEN_COUNT) * 0.001;
};

const GameCanvas = ({ 
  gameState, 
  playerId, 
  onMove, 
  onBoostStart,
  onBoostStop,
  onPlayerCollision 
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
      speedY: number 
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
  }, [gameState, playerId, onMove, onBoostStart, onBoostStop, camera]);
  
  useEffect(() => {
    if (!playerId || !gameState.players[playerId] || !onPlayerCollision) return;
    
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
  }, [gameState, playerId, onPlayerCollision]);
  
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
          speedY: 0.5 + Math.random() * 0.5
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
      
      ctx.save();
      
      // Enhanced 3D head with better shading
      const gradient = ctx.createRadialGradient(
        player.x, player.y, 0,
        player.x, player.y, headRadius
      );
      gradient.addColorStop(0, shadeColor(playerColor, 15)); // Lighter in the center
      gradient.addColorStop(0.7, playerColor); // Main color
      gradient.addColorStop(1, shadeColor(playerColor, -20)); // Darker at the edge for 3D effect
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(player.x, player.y, headRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Border nearly matching the base color for a subtle edge
      ctx.strokeStyle = shadeColor(playerColor, -10); // Border more similar to base color
      ctx.lineWidth = 0.8; // Thinner border
      ctx.beginPath();
      ctx.arc(player.x, player.y, headRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Enhanced circuit board pattern with deeper shading
      ctx.save();
      ctx.beginPath();
      ctx.arc(player.x, player.y, headRadius * 0.9, 0, Math.PI * 2);
      ctx.clip();
      
      // Circuit lines with better contrast
      ctx.strokeStyle = `${shadeColor(playerColor, -15)}60`; // More transparent
      ctx.lineWidth = 0.7;
      
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
      
      // Enhanced circuit nodes with 3D effect
      const nodeColor = shadeColor(playerColor, 25);
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
        const nodeSize = headRadius * 0.12;
        
        // 3D node gradient
        const nodeGradient = ctx.createRadialGradient(
          nodeX - nodeSize * 0.3, nodeY - nodeSize * 0.3, 0,
          nodeX, nodeY, nodeSize
        );
        nodeGradient.addColorStop(0, shadeColor(nodeColor, 20)); // Highlight
        nodeGradient.addColorStop(1, shadeColor(nodeColor, -10)); // Shadow
        
        ctx.fillStyle = nodeGradient;
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, nodeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Subtle node border
        ctx.strokeStyle = shadeColor(nodeColor, -15);
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, nodeSize, 0, Math.PI * 2);
        ctx.stroke();
      });
      
      ctx.restore();
      
      // Enhanced inner core with better 3D effect
      const innerRadius = headRadius * 0.65;
      const coreGradient = ctx.createRadialGradient(
        player.x - innerRadius * 0.2, player.y - innerRadius * 0.2, 0,
        player.x, player.y, innerRadius
      );
      coreGradient.addColorStop(0, shadeColor(playerColor, 30)); // Highlight spot
      coreGradient.addColorStop(0.6, shadeColor(playerColor, 10)); // Main color
      coreGradient.addColorStop(1, shadeColor(playerColor, -15)); // Shadow edge
      
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(player.x, player.y, innerRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Larger eyes with better 3D effect
      const eyeSize = headRadius * 0.3; // Increased eye size
      const eyeDistance = headRadius * 0.25;
      const eyeOffsetY = -headRadius * 0.05;
      
      // Draw eye whites with 3D effect
      const eyeGradient = ctx.createRadialGradient(
        player.x - eyeDistance - eyeSize * 0.2, player.y + eyeOffsetY - eyeSize * 0.2, 0,
        player.x - eyeDistance, player.y + eyeOffsetY, eyeSize
      );
      eyeGradient.addColorStop(0, "#FFFFFF"); // Pure white highlight
      eyeGradient.addColorStop(0.7, "#F8F8F8"); // Main white
      eyeGradient.addColorStop(1, "#E0E0E0"); // Slight gray edge for depth
      
      // Left eye
      ctx.fillStyle = eyeGradient;
      ctx.beginPath();
      ctx.arc(player.x - eyeDistance, player.y + eyeOffsetY, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Subtle eye border
      ctx.strokeStyle = "#BBBBBB"; // Lighter gray border
      ctx.lineWidth = 0.8; // Thinner border
      ctx.beginPath();
      ctx.arc(player.x - eyeDistance, player.y + eyeOffsetY, eyeSize, 0, Math.PI * 2);
      ctx.stroke();
      
      // Right eye
      ctx.fillStyle = eyeGradient;
      ctx.beginPath();
      ctx.arc(player.x + eyeDistance, player.y + eyeOffsetY, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Subtle eye border
      ctx.strokeStyle = "#BBBBBB"; // Lighter gray border
      ctx.lineWidth = 0.8; // Thinner border
      ctx.beginPath();
      ctx.arc(player.x + eyeDistance, player.y + eyeOffsetY, eyeSize, 0, Math.PI * 2);
      ctx.stroke();
      
      // Add pupils with movement
      let pupilOffsetX = 0;
      let pupilOffsetY = 0;
      
      if (isCurrentPlayer) {
        if (isMobile) {
          const joystickDir = rendererStateRef.current.joystickDirection;
          if (joystickDir && (joystickDir.x !== 0 || joystickDir.y !== 0)) {
            const maxPupilOffset = eyeSize * 0.5;
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
              const maxPupilOffset = eyeSize * 0.5;
              pupilOffsetX = (dx / distance) * maxPupilOffset;
              pupilOffsetY = (dy / distance) * maxPupilOffset;
            }
          }
        }
      }
      
      // Enhanced 3D pupils
      const pupilSize = eyeSize * 0.7; // Large pupils
      
      // 3D effect for pupils with shiny highlight
      const pupilGradient = ctx.createRadialGradient(
        player.x - eyeDistance + pupilOffsetX - pupilSize * 0.3, 
        player.y + eyeOffsetY + pupilOffsetY - pupilSize * 0.3, 
        0,
        player.x - eyeDistance + pupilOffsetX, 
        player.y + eyeOffsetY + pupilOffsetY, 
        pupilSize
      );
      pupilGradient.addColorStop(0, "#333333"); // Slightly lighter center
      pupilGradient.addColorStop(0.5, "#111111"); // Main color
      pupilGradient.addColorStop(1, "#000000"); // Pure black edge
      
      // Left pupil
      ctx.fillStyle = pupilGradient;
      ctx.beginPath();
      ctx.arc(player.x - eyeDistance + pupilOffsetX, player.y + eyeOffsetY + pupilOffsetY, pupilSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Right pupil
      ctx.beginPath();
      ctx.arc(player.x + eyeDistance + pupilOffsetX, player.y + eyeOffsetY + pupilOffsetY, pupilSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Enhanced eye highlights - larger and positioned for 3D effect
      const highlightSize = eyeSize * 0.35; // Larger highlight
      ctx.fillStyle = "#FFFFFF"; // Pure white
      
      // Left eye highlight with 3D positioning
      ctx.beginPath();
      ctx.arc(
        player.x - eyeDistance + pupilOffsetX - eyeSize * 0.3, 
        player.y + eyeOffsetY + pupilOffsetY - eyeSize * 0.3, 
        highlightSize, 
        0, Math.PI * 2
      );
      ctx.fill();
      
      // Right eye highlight with 3D positioning
      ctx.beginPath();
      ctx.arc(
        player.x + eyeDistance + pupilOffsetX - eyeSize * 0.3, 
        player.y + eyeOffsetY + pupilOffsetY - eyeSize * 0.3, 
        highlightSize, 
        0, Math.PI * 2
      );
      ctx.fill();
      
      // Small secondary highlights for more depth
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.beginPath();
      ctx.arc(
        player.x - eyeDistance + pupilOffsetX + eyeSize * 0.2, 
        player.y + eyeOffsetY + pupilOffsetY + eyeSize * 0.2, 
        highlightSize * 0.5, 
        0, Math.PI * 2
      );
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(
        player.x + eyeDistance + pupilOffsetX + eyeSize * 0.2, 
        player.y + eyeOffsetY + pupilOffsetY + eyeSize * 0.2, 
        highlightSize * 0.5, 
        0, Math.PI * 2
      );
      ctx.fill();
      
      // Enhanced mouth with 3D effect
      const mouthY = player.y + headRadius * 0.25;
      const mouthWidth = headRadius * 0.4;
      
      // Expression based on boosting
      if (player.boosting) {
        // Open mouth when boosting with 3D effect
        const mouthGradient = ctx.createLinearGradient(
          player.x, mouthY - mouthWidth * 0.3,
          player.x, mouthY + mouthWidth * 0.2
        );
        mouthGradient.addColorStop(0, "#555555");
        mouthGradient.addColorStop(1, "#222222");
        
        ctx.fillStyle = mouthGradient;
        ctx.beginPath();
        ctx.arc(player.x, mouthY, mouthWidth * 0.6, 0, Math.PI);
        ctx.fill();
        
        // Add 3D teeth
        const teethWidth = mouthWidth * 0.15;
        const teethHeight = mouthWidth * 0.2;
        const teethGap = mouthWidth * 0.2;
        
        // Left tooth
        const leftToothGradient = ctx.createLinearGradient(
          player.x - teethGap - teethWidth, mouthY - teethHeight,
          player.x - teethGap, mouthY - teethHeight / 2
        );
        leftToothGradient.addColorStop(0, "#FFFFFF");
        leftToothGradient.addColorStop(1, "#E0E0E0");
        
        ctx.fillStyle = leftToothGradient;
        ctx.fillRect(player.x - teethGap - teethWidth, mouthY - teethHeight, teethWidth, teethHeight);
        
        // Right tooth
        const rightToothGradient = ctx.createLinearGradient(
          player.x + teethGap + teethWidth, mouthY - teethHeight,
          player.x + teethGap, mouthY - teethHeight / 2
        );
        rightToothGradient.addColorStop(0, "#FFFFFF");
        rightToothGradient.addColorStop(1, "#E0E0E0");
        
        ctx.fillStyle = rightToothGradient;
        ctx.fillRect(player.x + teethGap, mouthY - teethHeight, teethWidth, teethHeight);
        
        // Subtle tooth borders
        ctx.strokeStyle = "#CCCCCC";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(player.x - teethGap - teethWidth, mouthY - teethHeight, teethWidth, teethHeight);
        ctx.strokeRect(player.x + teethGap, mouthY - teethHeight, teethWidth, teethHeight);
      } else {
        // Regular smile when not boosting with 3D effect
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x, mouthY - mouthWidth * 0.6, mouthWidth, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
        
        // Add subtle lip highlight
        ctx.strokeStyle = "#555555";
