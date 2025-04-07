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
}

interface GameItem {
  id: string;
  x: number;
  y: number;
  value: number;
  color: string;
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

function adjustPinColor(color: string) {
  const rgb = hexToRgb(color);
  if (!rgb) return 'rgba(255, 215, 0, 0.7)';
  
  const max = Math.max(rgb.r, rgb.g, rgb.b) / 255;
  const min = Math.min(rgb.r, rgb.g, rgb.b) / 255;
  const luminance = (max + min) / 2;
  
  return `rgba(${Math.min(255, rgb.r + 100)}, ${Math.min(255, Math.max(150, rgb.g + 50))}, 50, 0.7)`;
}

let _joystickDirection = { x: 0, y: 0 };

export const handleJoystickDirection = (direction: { x: number; y: number }) => {
  _joystickDirection = direction;
};

function roundedRect(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  radius: number,
  stroke = false
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  
  if (stroke) {
    ctx.stroke();
  } else {
    ctx.fill();
  }
}

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
    zoom: isMobile ? 0.7 : 1
  });
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>(0);
  const rendererStateRef = useRef({
    players: {} as Record<string, Player>,
    items: [] as GameItem[],
    gridNeedsUpdate: true,
    mousePosition: { x: 0, y: 0 },
    joystickDirection: { x: 0, y: 0 },
    boostParticles: [] as {x: number, y: number, size: number, alpha: number, vx: number, vy: number, color: string}[]
  });
  const gridCacheCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const resizeListenerRef = useRef<(() => void) | null>(null);
  
  useEffect(() => {
    if (window) {
      (window as any).handleJoystickDirection = handleJoystickDirection;
    }
    
    const updateJoystickDirection = () => {
      rendererStateRef.current.joystickDirection = _joystickDirection;
      requestAnimationFrame(updateJoystickDirection);
    };
    
    const animationId = requestAnimationFrame(updateJoystickDirection);
    
    return () => {
      cancelAnimationFrame(animationId);
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
    const currentSize = calculatePlayerSize(currentPlayer);
    
    Object.entries(gameState.players).forEach(([otherId, otherPlayer]) => {
      if (otherId === playerId) return;
      
      const otherSize = calculatePlayerSize(otherPlayer);
      const dx = currentPlayer.x - otherPlayer.x;
      const dy = currentPlayer.y - otherPlayer.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < (currentSize + otherSize) / 2) {
        const currentQueueLength = currentPlayer.queue?.length || 0;
        const otherQueueLength = otherPlayer.queue?.length || 0;
        
        if (currentQueueLength <= otherQueueLength) {
          onPlayerCollision(otherId);
          return;
        }
      }
      
      if (otherPlayer.queue && otherPlayer.queue.length > 0) {
        const collisionRadius = currentSize / 2;
        
        for (const segment of otherPlayer.queue) {
          const segDx = currentPlayer.x - segment.x;
          const segDy = currentPlayer.y - segment.y;
          const segDistance = Math.sqrt(segDx * segDx + segDy * segDy);
          
          if (segDistance < collisionRadius) {
            onPlayerCollision(otherId);
            return;
          }
        }
      }
    });
  }, [gameState, playerId, onPlayerCollision]);

  const calculatePlayerSize = (player: Player): number => {
    const baseSize = 20;
    const queueCount = player.queue?.length || 0;
    
    return baseSize * (1 + (queueCount * 0.1));
  };
  
  useEffect(() => {
    if (!playerId || !gameState.players[playerId]) return;
    
    const player = gameState.players[playerId];
    setCamera(prev => ({
      ...prev,
      x: player.x,
      y: player.y
    }));
    
    const prevPlayer = rendererStateRef.current.players[playerId];
    if (prevPlayer) {
      const dx = Math.abs(prevPlayer.x - player.x);
      const dy = Math.abs(prevPlayer.y - player.y);
      if (dx > 50 || dy > 50) {
        rendererStateRef.current.gridNeedsUpdate = true;
      }
    }
    
    rendererStateRef.current.players = { ...gameState.players };
    rendererStateRef.current.items = gameState.items || [];
  }, [gameState, playerId]);
  
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
    
    if (resizeListenerRef.current) {
      window.removeEventListener('resize', resizeListenerRef.current);
    }
    
    resizeListenerRef.current = resizeCanvas;
    window.addEventListener('resize', resizeListenerRef.current);
    
    const updateGridCache = () => {
      const gridCanvas = gridCacheCanvasRef.current;
      if (!gridCanvas) return;
      
      const gridCtx = gridCanvas.getContext('2d', { alpha: false });
      if (!gridCtx) return;
      
      const bgGradient = gridCtx.createLinearGradient(0, 0, gridCanvas.width, gridCanvas.height);
      bgGradient.addColorStop(0, '#13162c');
      bgGradient.addColorStop(1, '#101425');
      gridCtx.fillStyle = bgGradient;
      gridCtx.fillRect(0, 0, gridCanvas.width, gridCanvas.height);
      
      gridCtx.save();
      
      gridCtx.translate(gridCanvas.width / 2, gridCanvas.height / 2);
      gridCtx.scale(camera.zoom, camera.zoom);
      gridCtx.translate(-camera.x, -camera.y);
      
      const hexSize = 40;
      const hexHeight = hexSize * Math.sqrt(3);
      const hexWidth = hexSize * 2;
      
      const visibleWidth = gridCanvas.width / camera.zoom;
      const visibleHeight = gridCanvas.height / camera.zoom;
      
      const marginFactor = 2;
      const rowsNeeded = Math.ceil(visibleHeight * marginFactor / hexHeight);
      const colsNeeded = Math.ceil(visibleWidth * marginFactor / (hexWidth * 0.75));
      
      const startX = camera.x - visibleWidth * marginFactor / 2;
      const startY = camera.y - visibleHeight * marginFactor / 2;
      const endX = camera.x + visibleWidth * marginFactor / 2;
      const endY = camera.y + visibleHeight * marginFactor / 2;
      
      for (let y = startY; y < endY; y += hexHeight) {
        let rowOffset = 0;
        for (let x = startX; x < endX; x += hexWidth * 0.75) {
          const offsetY = rowOffset % 2 === 0 ? 0 : hexHeight / 2;
          
          gridCtx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 3 * i;
            const hx = x + hexSize * Math.cos(angle);
            const hy = y + offsetY + hexSize * Math.sin(angle);
            if (i === 0) {
              gridCtx.moveTo(hx, hy);
            } else {
              gridCtx.lineTo(hx, hy);
            }
          }
          gridCtx.closePath();
          
          if (Math.random() < 0.02) {
            gridCtx.fillStyle = 'rgba(100, 150, 255, 0.05)';
            gridCtx.fill();
          }
          
          gridCtx.stroke();
          rowOffset++;
        }
      }
      
      const particles = 100;
      gridCtx.globalAlpha = 0.3;
      
      for (let i = 0; i < particles; i++) {
        const seed = i * 1000;
        const x = (Math.sin(seed) * 0.5 + 0.5) * gameState.worldSize.width;
        const y = (Math.cos(seed) * 0.5 + 0.5) * gameState.worldSize.height;
        const size = 1 + (i % 4);
        
        gridCtx.fillStyle = 'rgba(180, 210, 255, 0.4)';
        gridCtx.beginPath();
        gridCtx.arc(x, y, size, 0, Math.PI * 2);
        gridCtx.fill();
      }
      
      const glowParticles = 5;
      for (let i = 0; i < glowParticles; i++) {
        const seed = i * 2000;
        const x = (Math.sin(seed) * 0.5 + 0.5) * gameState.worldSize.width;
        const y = (Math.cos(seed) * 0.5 + 0.5) * gameState.worldSize.height;
        const radius = 120 + (i * 20);
        
        const glowGradient = gridCtx.createRadialGradient(x, y, 0, x, y, radius);
        glowGradient.addColorStop(0, 'rgba(100, 150, 255, 0.05)');
        glowGradient.addColorStop(0.7, 'rgba(70, 100, 200, 0.02)');
        glowGradient.addColorStop(1, 'rgba(50, 50, 150, 0)');
        
        gridCtx.fillStyle = glowGradient;
        gridCtx.beginPath();
        gridCtx.arc(x, y, radius, 0, Math.PI * 2);
        gridCtx.fill();
      }
      
      gridCtx.strokeStyle = 'rgba(80, 140, 240, 0.4)';
      gridCtx.lineWidth = 2;
      gridCtx.setLineDash([15, 5]);
      gridCtx.strokeRect(0, 0, gameState.worldSize.width, gameState.worldSize.height);
      
      const cornerSize = 50;
      gridCtx.strokeStyle = 'rgba(100, 180, 255, 0.4)';
      gridCtx.lineWidth = 1.5;
      gridCtx.setLineDash([]);
      
      gridCtx.beginPath();
      gridCtx.moveTo(0, cornerSize);
      gridCtx.lineTo(0, 0);
      gridCtx.lineTo(cornerSize, 0);
      gridCtx.stroke();
      
      gridCtx.beginPath();
      gridCtx.moveTo(gameState.worldSize.width - cornerSize, 0);
      gridCtx.lineTo(gameState.worldSize.width, 0);
      gridCtx.lineTo(gameState.worldSize.width, cornerSize);
      gridCtx.stroke();
      
      gridCtx.beginPath();
      gridCtx.moveTo(0, gameState.worldSize.height - cornerSize);
      gridCtx.lineTo(0, gameState.worldSize.height);
      gridCtx.lineTo(cornerSize, gameState.worldSize.height);
      gridCtx.stroke();
      
      gridCtx.beginPath();
      gridCtx.moveTo(gameState.worldSize.width - cornerSize, gameState.worldSize.height);
      gridCtx.lineTo(gameState.worldSize.width, gameState.worldSize.height);
      gridCtx.lineTo(gameState.worldSize.width, gameState.worldSize.height - cornerSize);
      gridCtx.stroke();
      
      const borderGlow = gridCtx.createLinearGradient(0, 0, gameState.worldSize.width, gameState.worldSize.height);
      borderGlow.addColorStop(0, 'rgba(70, 130, 240, 0.2)');
      borderGlow.addColorStop(0.5, 'rgba(100, 150, 255, 0.25)');
      borderGlow.addColorStop(1, 'rgba(70, 130, 240, 0.2)');
      
      gridCtx.strokeStyle = borderGlow;
      gridCtx.lineWidth = 4;
      gridCtx.globalAlpha = 0.2;
      gridCtx.setLineDash([20, 10]);
      gridCtx.strokeRect(0, 0, gameState.worldSize.width, gameState.worldSize.height);
      
      gridCtx.restore();
      
      rendererStateRef.current.gridNeedsUpdate = false;
    };
    
    const drawPlayerProcessor = (player: Player, isCurrentPlayer: boolean) => {
      const playerSize = calculatePlayerSize(player);
      const playerColor = player.color || (isCurrentPlayer ? '#8B5CF6' : '#FFFFFF');
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      
      ctx.save();
      
      const chipSize = playerSize * 0.9;
      const cornerRadius = chipSize * 0.15;
      
      const gradient = ctx.createLinearGradient(
        player.x - chipSize/2, 
        player.y - chipSize/2, 
        player.x + chipSize/2, 
        player.y + chipSize/2
      );
      gradient.addColorStop(0, playerColor);
      gradient.addColorStop(1, shadeColor(playerColor, -15));
      
      ctx.fillStyle = gradient;
      roundedRect(ctx, player.x - chipSize/2, player.y - chipSize/2, chipSize, chipSize, cornerRadius);
      
      const notchWidth = chipSize * 0.3;
      const notchHeight = chipSize * 0.08;
      ctx.fillStyle = darkenColor(playerColor, 40);
      ctx.beginPath();
      ctx.moveTo(player.x - notchWidth/2, player.y - chipSize/2);
      ctx.lineTo(player.x + notchWidth/2, player.y - chipSize/2);
      ctx.lineTo(player.x + notchWidth/2, player.y - chipSize/2 + notchHeight);
      ctx.lineTo(player.x, player.y - chipSize/2 + notchHeight*1.5);
      ctx.lineTo(player.x - notchWidth/2, player.y - chipSize/2 + notchHeight);
      ctx.closePath();
      ctx.fill();
      
      ctx.strokeStyle = darkenColor(playerColor, 30);
      ctx.lineWidth = 2;
      roundedRect(ctx, player.x - chipSize/2, player.y - chipSize/2, chipSize, chipSize, cornerRadius, true);
      
      ctx.strokeStyle = shadeColor(playerColor, 10);
      ctx.lineWidth = 1;
      roundedRect(ctx, player.x - chipSize/2 + 3, player.y - chipSize/2 + 3, chipSize - 6, chipSize - 6, cornerRadius / 1.5, true);
      
      const innerSize = chipSize * 0.65;
      const coreGradient = ctx.createRadialGradient(
        player.x, player.y, innerSize * 0.1,
        player.x, player.y, innerSize * 0.7
      );
      coreGradient.addColorStop(0, shadeColor(playerColor, 20));
      coreGradient.addColorStop(1, shadeColor(playerColor, -10));
      
      ctx.fillStyle = coreGradient;
      roundedRect(ctx, player.x - innerSize/2, player.y - innerSize/2, innerSize, innerSize, cornerRadius/2);
      
      const linesCount = 3;
      const lineSpacing = innerSize / (linesCount + 1);
      
      for (let i = 1; i <= linesCount; i++) {
        ctx.beginPath();
        ctx.moveTo(player.x - innerSize/2 + 5, player.y - innerSize/2 + i * lineSpacing);
        ctx.lineTo(player.x + innerSize/2 - 5, player.y - innerSize/2 + i * lineSpacing);
        ctx.stroke();
      }
      
      for (let i = 1; i <= linesCount; i++) {
        ctx.beginPath();
        ctx.moveTo(player.x - innerSize/2 + i * lineSpacing, player.y - innerSize/2 + 5);
        ctx.lineTo(player.x - innerSize/2 + i * lineSpacing, player.y + innerSize/2 - 5);
        ctx.stroke();
      }
      
      const pinLength = playerSize * 0.25;
      const pinWidth = playerSize * 0.07;
      
      const pinGradient = ctx.createLinearGradient(
        player.x - chipSize/2, player.y - chipSize/2,
        player.x + chipSize/2, player.y + chipSize/2
      );
      pinGradient.addColorStop(0, shadeColor(playerColor, -20));
      pinGradient.addColorStop(1, darkenColor(playerColor, 30));
      ctx.fillStyle = pinGradient;
      
      const numberOfPins = 5;
      const pinSpacing = chipSize / (numberOfPins + 1);
      
      for (let i = 1; i <= numberOfPins; i++) {
        if (i === 2 || i === 4) continue;
        
        ctx.fillStyle = pinGradient;
        ctx.fillRect(
          player.x - chipSize/2 + i * pinSpacing - pinWidth/2,
          player.y - chipSize/2 - pinLength,
          pinWidth,
          pinLength
        );
        
        ctx.fillStyle = "#AAA";
        ctx.fillRect(
          player.x - chipSize/2 + i * pinSpacing - pinWidth/2 - 1,
          player.y - chipSize/2 - pinLength,
          pinWidth + 2,
          3
        );
        
        ctx.fillStyle = pinGradient;
        ctx.fillRect(
          player.x - chipSize/2 + i * pinSpacing - pinWidth/2,
          player.y + chipSize/2,
          pinWidth,
          pinLength
        );
        
        ctx.fillStyle = "#AAA";
        ctx.fillRect(
          player.x - chipSize/2 + i * pinSpacing - pinWidth/2 - 1,
          player.y + chipSize/2 + pinLength - 3,
          pinWidth + 2,
          3
        );
      }
      
      const sidePinCount = 3;
      const sidePinSpacing = chipSize / (sidePinCount + 1);
      
      for (let i = 1; i <= sidePinCount; i++) {
        ctx.fillStyle = pinGradient;
        ctx.fillRect(
          player.x - chipSize/2 - pinLength,
          player.y - chipSize/2 + i * sidePinSpacing - pinWidth/2,
          pinLength,
          pinWidth
        );
        
        ctx.fillStyle = "#AAA";
        ctx.fillRect(
          player.x - chipSize/2 - pinLength,
          player.y - chipSize/2 + i * sidePinSpacing - pinWidth/2 - 1,
          3,
          pinWidth + 2
        );
        
        ctx.fillStyle = pinGradient;
        ctx.fillRect(
          player.x + chipSize/2,
          player.y - chipSize/2 + i * sidePinSpacing - pinWidth/2,
          pinLength,
          pinWidth
        );
        
        ctx.fillStyle = "#AAA";
        ctx.fillRect(
          player.x + chipSize/2 + pinLength - 3,
          player.y - chipSize/2 + i * sidePinSpacing - pinWidth/2 - 1,
          3,
          pinWidth + 2
        );
      }
      
      const eyeSize = playerSize * 0.15;
      const eyeDistance = playerSize * 0.20;
      const eyeOffsetY = -playerSize * 0.05;
      
      const eyeGradient = ctx.createRadialGradient(
        player.x - eyeDistance, player.y + eyeOffsetY, eyeSize * 0.2,
        player.x - eyeDistance, player.y + eyeOffsetY, eyeSize
      );
      eyeGradient.addColorStop(0, "#FFFFFF");
      eyeGradient.addColorStop(1, "#E0E0E0");
      
      ctx.fillStyle = eyeGradient;
      ctx.beginPath();
      ctx.arc(player.x - eyeDistance, player.y + eyeOffsetY, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = "#AAAAAA";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(player.x - eyeDistance, player.y + eyeOffsetY, eyeSize, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = eyeGradient;
      ctx.beginPath();
      ctx.arc(player.x + eyeDistance, player.y + eyeOffsetY, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = "#AAAAAA";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(player.x + eyeDistance, player.y + eyeOffsetY, eyeSize, 0, Math.PI * 2);
      ctx.stroke();
      
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
      
      const pupilGradient = ctx.createRadialGradient(
        player.x - eyeDistance + pupilOffsetX, player.y + eyeOffsetY + pupilOffsetY, 0,
        player.x - eyeDistance + pupilOffsetX, player.y + eyeOffsetY + pupilOffsetY, eyeSize * 0.6
      );
      pupilGradient.addColorStop(0, "#444444");
      pupilGradient.addColorStop(1, "#000000");
      
      ctx.fillStyle = pupilGradient;
      ctx.beginPath();
      ctx.arc(player.x - eyeDistance + pupilOffsetX, player.y + eyeOffsetY + pupilOffsetY, eyeSize * 0.6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(player.x + eyeDistance + pupilOffsetX, player.y + eyeOffsetY + pupilOffsetY, eyeSize * 0.6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(player.x - eyeDistance + pupilOffsetX - eyeSize * 0.2, player.y + eyeOffsetY + pupilOffsetY - eyeSize * 0.2, eyeSize * 0.2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(player.x + eyeDistance + pupilOffsetX - eyeSize * 0.2, player.y + eyeOffsetY + pupilOffsetY - eyeSize * 0.2, eyeSize * 0.2, 0, Math.PI * 2);
      ctx.fill();
      
      if (player.boosting) {
        const thrusterLength = playerSize * 0.6;
        const thrusterWidth = playerSize * 0.4;
        
        const direction = player.direction || { x: 0, y: 0 };
        const thrusterX = player.x - direction.x * (chipSize / 2 + thrusterLength / 2);
        const thrusterY = player.y - direction.y * (chipSize / 2 + thrusterLength / 2);
        
        const flameGradient = ctx.createRadialGradient(
          thrusterX, thrusterY, 0,
          thrusterX, thrusterY, thrusterLength
        );
        flameGradient.addColorStop(0, 'rgba(255, 200, 50, 0.9)');
        flameGradient.addColorStop(0.4, 'rgba(255, 100, 50, 0.7)');
        flameGradient.addColorStop(1, 'rgba(255, 50, 50, 0)');
        
        ctx.fillStyle = flameGradient;
        ctx.beginPath();
        ctx.ellipse(
          thrusterX, 
          thrusterY, 
          thrusterWidth / 2, 
          thrusterLength / 2, 
          Math.atan2(direction.y, direction.x) + Math.PI / 2, 
          0, 
          Math.PI * 2
        );
        ctx.fill();
        
        for (let i = 0; i < 2; i++) {
          const particleSize = 2 + Math.random() * 3;
          const particleSpeed = 2 + Math.random() * 3;
          const particleAngle = Math.atan2(direction.y, direction.x) + (Math.random() - 0.5) * 0.8;
          
          rendererStateRef.current.boostParticles.push({
            x: thrusterX + Math.cos(particleAngle) * thrusterLength * 0.3,
            y: thrusterY + Math.sin(particleAngle) * thrusterLength * 0.3,
            vx: -Math.cos(particleAngle) * particleSpeed,
            vy: -Math.sin(particleAngle) * particleSpeed,
            size: particleSize,
            alpha: 0.7 + Math.random() * 0.3,
            color: Math.random() > 0.3 ? '#FF5500' : '#FFAA00'
          });
        }
      }
      
      ctx.restore();
    };
    
    const drawQueueSegment = (segment: { x: number; y: number }, index: number, player: Player, isCurrentPlayer: boolean) => {
      if (!ctx) return;
      
      const playerSize = calculatePlayerSize(player);
      const segmentSize = playerSize * 0.75;
      const playerColor = player.color || (isCurrentPlayer ? '#8B5CF6' : '#FFFFFF');
      
      ctx.save();
      ctx.globalAlpha = Math.max(0.4, 1 - (index * 0.05));
      
      const glowGradient = ctx.createRadialGradient(
        segment.x, segment.y, 0,
        segment.x, segment.y, segmentSize
      );
      glowGradient.addColorStop(0, `rgba(${hexToRgb(playerColor)?.r || 100}, ${hexToRgb(playerColor)?.g || 100}, ${hexToRgb(playerColor)?.b || 255}, 0.2)`);
      glowGradient.addColorStop(1, 'rgba(50, 50, 200, 0)');
      
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(segment.x, segment.y, segmentSize, 0, Math.PI * 2);
      ctx.fill();
      
      const segmentGradient = ctx.createRadialGradient(
        segment.x, segment.y, 0,
        segment.x, segment.y, segmentSize * 0.7
      );
      segmentGradient.addColorStop(0, shadeColor(playerColor, 10));
      segmentGradient.addColorStop(1, darkenColor(playerColor, 20));
      
      ctx.fillStyle = segmentGradient;
      ctx.beginPath();
      ctx.arc(segment.x, segment.y, segmentSize * 0.7, 0, Math.PI * 2);
      ctx.fill();
      
      const patternCount = 3;
      for (let i = 0; i < patternCount; i++) {
        const angle = (Math.PI * 2 / patternCount) * i;
        const startX = segment.x + Math.cos(angle) * (segmentSize * 0.3);
        const startY = segment.y + Math.sin(angle) * (segmentSize * 0.3);
        const endX = segment.x + Math.cos(angle) * (segmentSize * 0.6);
        const endY = segment.y + Math.sin(angle) * (segmentSize * 0.6);
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
      
      ctx.restore();
    };
    
    const drawItem = (item: GameItem) => {
      if (!ctx) return;
      
      ctx.save();
      
      const time = Date.now() / 1000;
      const pulseScale = 1 + 0.1 * Math.sin(time * 4);
      const itemSize = 12 * pulseScale;
      
      const glowGradient = ctx.createRadialGradient(
        item.x, item.y, 0,
        item.x, item.y, itemSize * 2
      );
      glowGradient.addColorStop(0, item.color.replace(')', ', 0.6)').replace('rgb', 'rgba'));
      glowGradient.addColorStop(1, item.color.replace(')', ', 0)').replace('rgb', 'rgba'));
      
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(item.x, item.y, itemSize * 2, 0, Math.PI * 2);
      ctx.fill();
      
      const shineGradient = ctx.createRadialGradient(
        item.x, item.y, 0,
        item.x, item.y, itemSize
      );
      shineGradient.addColorStop(0, '#FFFFFF');
      shineGradient.addColorStop(0.3, item.color);
      shineGradient.addColorStop(1, darkenColor(item.color, 30));
      
      ctx.fillStyle = shineGradient;
      ctx.beginPath();
      ctx.arc(item.x, item.y, itemSize, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(item.x, item.y, itemSize * 1.2, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.value.toString(), item.x, item.y);
      
      ctx.restore();
    };
    
    const updateBoostParticles = (deltaTime: number) => {
      const particles = rendererStateRef.current.boostParticles;
      
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        p.alpha -= 0.02 * deltaTime;
        
        if (p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }
    };
    
    const drawBoostParticles = () => {
      if (!ctx) return;
      const particles = rendererStateRef.current.boostParticles;
      
      ctx.save();
      
      for (const p of particles) {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    };
    
    const render = (timestamp: number) => {
      if (!ctx || !canvas) return;
      
      if (!previousTimeRef.current) {
        previousTimeRef.current = timestamp;
      }
      
      const deltaTime = (timestamp - previousTimeRef.current) / 16;
      previousTimeRef.current = timestamp;
      
      updateBoostParticles(deltaTime);
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(camera.zoom, camera.zoom);
      ctx.translate(-camera.x, -camera.y);
      
      if (rendererStateRef.current.gridNeedsUpdate) {
        updateGridCache();
      }
      
      if (gridCacheCanvasRef.current) {
        const gridWidth = gridCacheCanvasRef.current.width / camera.zoom;
        const gridHeight = gridCacheCanvasRef.current.height / camera.zoom;
        
        ctx.drawImage(
          gridCacheCanvasRef.current,
          0, 0, gridCacheCanvasRef.current.width, gridCacheCanvasRef.current.height,
          camera.x - gridWidth / 2, camera.y - gridHeight / 2, gridWidth, gridHeight
        );
      }
      
      for (const item of rendererStateRef.current.items) {
        drawItem(item);
      }
      
      for (const [id, player] of Object.entries(rendererStateRef.current.players)) {
        if (player.queue && player.queue.length > 0) {
          player.queue.forEach((segment, index) => {
            drawQueueSegment(segment, index, player, id === playerId);
          });
        }
        
        drawPlayerProcessor(player, id === playerId);
      }
      
      drawBoostParticles();
      
      ctx.restore();
      
      requestRef.current = requestAnimationFrame(render);
    };
    
    requestRef.current = requestAnimationFrame(render);
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      
      if (resizeListenerRef.current) {
        window.removeEventListener('resize', resizeListenerRef.current);
      }
    };
  }, [camera, gameState.worldSize, isMobile, playerId, calculatePlayerSize]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full"
    />
  );
};

export default GameCanvas;
