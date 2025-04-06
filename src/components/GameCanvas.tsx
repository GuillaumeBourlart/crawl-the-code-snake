import { useEffect, useRef, useState } from "react";

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

const GameCanvas = ({ 
  gameState, 
  playerId, 
  onMove, 
  onBoostStart,
  onBoostStop,
  onPlayerCollision 
}: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>(0);
  const rendererStateRef = useRef({
    players: {} as Record<string, Player>,
    items: [] as GameItem[],
    gridNeedsUpdate: true
  });
  const gridCacheCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
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
    window.addEventListener('resize', resizeCanvas);
    
    const updateGridCache = () => {
      const gridCanvas = gridCacheCanvasRef.current;
      if (!gridCanvas) return;
      
      const gridCtx = gridCanvas.getContext('2d', { alpha: false });
      if (!gridCtx) return;
      
      gridCtx.fillStyle = '#121212';
      gridCtx.fillRect(0, 0, gridCanvas.width, gridCanvas.height);
      
      gridCtx.save();
      
      gridCtx.translate(gridCanvas.width / 2, gridCanvas.height / 2);
      gridCtx.scale(camera.zoom, camera.zoom);
      gridCtx.translate(-camera.x, -camera.y);
      
      const gridSize = 50;
      const startX = Math.floor((camera.x - canvas.width / camera.zoom / 2) / gridSize) * gridSize;
      const endX = Math.ceil((camera.x + canvas.width / camera.zoom / 2) / gridSize) * gridSize;
      const startY = Math.floor((camera.y - canvas.height / camera.zoom / 2) / gridSize) * gridSize;
      const endY = Math.ceil((camera.y + canvas.height / camera.zoom / 2) / gridSize) * gridSize;
      
      gridCtx.strokeStyle = 'rgba(50, 50, 50, 0.5)';
      gridCtx.lineWidth = 1;
      
      gridCtx.beginPath();
      for (let y = startY; y <= endY; y += gridSize) {
        gridCtx.moveTo(startX, y);
        gridCtx.lineTo(endX, y);
      }
      gridCtx.stroke();
      
      gridCtx.beginPath();
      for (let x = startX; x <= endX; x += gridSize) {
        gridCtx.moveTo(x, startY);
        gridCtx.lineTo(x, endY);
      }
      gridCtx.stroke();
      
      gridCtx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      gridCtx.lineWidth = 2;
      gridCtx.strokeRect(0, 0, gameState.worldSize.width, gameState.worldSize.height);
      
      gridCtx.restore();
      
      rendererStateRef.current.gridNeedsUpdate = false;
    };
    
    const drawPlayerProcessor = (player: Player, isCurrentPlayer: boolean) => {
      const playerSize = calculatePlayerSize(player);
      const playerColor = player.color || (isCurrentPlayer ? '#8B5CF6' : '#FFFFFF');
      
      const scale = playerSize / 20;
      const baseX = player.x - 20 * scale / 2;
      const baseY = player.y - 20 * scale / 2;
      const size = 20 * scale;
      
      const gradient = ctx.createLinearGradient(
        baseX, baseY, 
        baseX + size, baseY + size
      );
      
      if (isCurrentPlayer) {
        gradient.addColorStop(0, '#8B5CF6');
        gradient.addColorStop(1, '#3B82F6');
      } else {
        gradient.addColorStop(0, playerColor);
        gradient.addColorStop(1, shadeColor(playerColor, -20));
      }
      
      ctx.fillStyle = gradient;
      roundedRect(ctx, baseX, baseY, size, size, size * 0.2);
      
      ctx.fillStyle = 'rgba(30, 30, 40, 0.7)';
      roundedRect(ctx, baseX + size * 0.15, baseY + size * 0.15, size * 0.7, size * 0.7, size * 0.1);
      
      ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
      for (let i = 0; i < 3; i++) {
        const padWidth = size * 0.12;
        const padHeight = size * 0.06;
        const startX = baseX + size * 0.3 + (i * size * 0.2);
        ctx.fillRect(startX, baseY, padWidth, padHeight);
      }
      
      for (let i = 0; i < 3; i++) {
        const padWidth = size * 0.12;
        const padHeight = size * 0.06;
        const startX = baseX + size * 0.3 + (i * size * 0.2);
        ctx.fillRect(startX, baseY + size - padHeight, padWidth, padHeight);
      }
      
      for (let i = 0; i < 3; i++) {
        const padWidth = size * 0.06;
        const padHeight = size * 0.12;
        const startY = baseY + size * 0.3 + (i * size * 0.2);
        ctx.fillRect(baseX, startY, padWidth, padHeight);
      }
      
      for (let i = 0; i < 3; i++) {
        const padWidth = size * 0.06;
        const padHeight = size * 0.12;
        const startY = baseY + size * 0.3 + (i * size * 0.2);
        ctx.fillRect(baseX + size - padWidth, startY, padWidth, padHeight);
      }
      
      ctx.strokeStyle = 'rgba(180, 180, 220, 0.6)';
      ctx.lineWidth = size * 0.02;
      
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(baseX + size * 0.25, baseY + size * (i * 0.2));
        ctx.lineTo(baseX + size * 0.75, baseY + size * (i * 0.2));
        ctx.stroke();
      }
      
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(baseX + size * (i * 0.2), baseY + size * 0.25);
        ctx.lineTo(baseX + size * (i * 0.2), baseY + size * 0.75);
        ctx.stroke();
      }
      
      const coreGradient = ctx.createRadialGradient(
        baseX + size * 0.5, baseY + size * 0.5, 0,
        baseX + size * 0.5, baseY + size * 0.5, size * 0.15
      );
      
      const pulseIntensity = Math.sin(Date.now() / 200) * 0.5 + 0.5;
      
      if (isCurrentPlayer) {
        coreGradient.addColorStop(0, `rgba(139, 92, 246, ${0.7 + pulseIntensity * 0.3})`);
        coreGradient.addColorStop(1, `rgba(59, 130, 246, ${0.3 + pulseIntensity * 0.2})`);
      } else {
        const baseColorRgb = hexToRgb(playerColor);
        coreGradient.addColorStop(0, `rgba(${baseColorRgb?.r}, ${baseColorRgb?.g}, ${baseColorRgb?.b}, ${0.7 + pulseIntensity * 0.3})`);
        coreGradient.addColorStop(1, `rgba(${baseColorRgb?.r}, ${baseColorRgb?.g}, ${baseColorRgb?.b}, ${0.3 + pulseIntensity * 0.2})`);
      }
      
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(baseX + size * 0.5, baseY + size * 0.5, size * 0.15, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(baseX + size * 0.4, baseY + size * 0.4, size * 0.05, 0, Math.PI * 2);
      ctx.fill();
      
      for (let i = 0; i < 4; i++) {
        const angle = (Date.now() / 200 + i * Math.PI / 2) % (Math.PI * 2);
        const dotRadius = size * 0.04;
        const distance = size * 0.25;
        const dotX = baseX + size * 0.5 + Math.cos(angle) * distance;
        const dotY = baseY + size * 0.5 + Math.sin(angle) * distance;
        
        ctx.fillStyle = isCurrentPlayer ? 
          `rgba(139, 92, 246, ${0.7 + pulseIntensity * 0.3})` : 
          `rgba(255, 255, 255, ${0.7 + pulseIntensity * 0.3})`;
          
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      if (isCurrentPlayer) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = size * 0.05;
        roundedRect(ctx, baseX - size * 0.05, baseY - size * 0.05, size * 1.1, size * 1.1, size * 0.25, true);
      }
    };
    
    function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, stroke = false) {
      context.beginPath();
      context.moveTo(x + radius, y);
      context.lineTo(x + width - radius, y);
      context.quadraticCurveTo(x + width, y, x + width, y + radius);
      context.lineTo(x + width, y + height - radius);
      context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      context.lineTo(x + radius, y + height);
      context.quadraticCurveTo(x, y + height, x, y + height - radius);
      context.lineTo(x, y + radius);
      context.quadraticCurveTo(x, y, x + radius, y);
      context.closePath();
      
      if (stroke) {
        context.stroke();
      } else {
        context.fill();
      }
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
    
    function hexToRgb(hex: string) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    }
    
    const renderFrame = (timestamp: number) => {
      if (!canvas) return;
      
      ctx.fillStyle = '#121212';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
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
      
      if (rendererStateRef.current.items.length > 0) {
        const visibleItems = rendererStateRef.current.items.filter(item => 
          item.x >= viewportLeft && 
          item.x <= viewportRight && 
          item.y >= viewportTop && 
          item.y <= viewportBottom
        );
        
        ctx.beginPath();
        visibleItems.forEach(item => {
          ctx.fillStyle = item.color || '#FFFFFF';
          ctx.beginPath();
          ctx.arc(item.x, item.y, 10, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.beginPath();
          ctx.arc(item.x - 3, item.y - 3, 3, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      
      Object.entries(rendererStateRef.current.players).forEach(([id, player]) => {
        if (
          player.x < viewportLeft ||
          player.x > viewportRight ||
          player.y < viewportTop ||
          player.y > viewportBottom
        ) {
          return;
        }
        
        const isCurrentPlayer = id === playerId;
        
        if (player.queue && player.queue.length > 0) {
          ctx.strokeStyle = player.color || (isCurrentPlayer ? '#FF0000' : '#FFFFFF');
          ctx.lineWidth = Math.max(3, playerSize / 3);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          const visibleQueue = player.queue.filter(segment => 
            segment.x >= viewportLeft && 
            segment.x <= viewportRight && 
            segment.y >= viewportTop && 
            segment.y <= viewportBottom
          );
          
          if (visibleQueue.length > 0 || (
            player.x >= viewportLeft && 
            player.x <= viewportRight && 
            player.y >= viewportTop && 
            player.y <= viewportBottom
          )) {
            ctx.beginPath();
            visibleQueue.forEach(segment => {
              ctx.fillStyle = player.color || (isCurrentPlayer ? '#FF0000' : '#FFFFFF');
              ctx.beginPath();
              ctx.arc(segment.x, segment.y, playerSize / 2, 0, Math.PI * 2);
              ctx.fill();
              
              ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
              ctx.beginPath();
              ctx.arc(segment.x - 2, segment.y - 2, 2, 0, Math.PI * 2);
              ctx.fill();
            });
          }
        }
        
        drawPlayerProcessor(player, isCurrentPlayer);
        
        if (player.boosting) {
          const boostColor = player.color === '#FF0000' ? '#FF6B6B' : player.color;
          
          const pulseScale = 1 + Math.sin(Date.now() / 150) * 0.2;
          
          for (let i = 1; i <= 3; i++) {
            const opacity = 0.6 - (i * 0.15);
            const size = playerSize * (1.2 + (i * 0.3)) * pulseScale;
            
            const gradient = ctx.createRadialGradient(
              player.x, player.y, 0,
              player.x, player.y, size
            );
            gradient.addColorStop(0, `${boostColor}CC`);
            gradient.addColorStop(1, `${boostColor}00`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(player.x, player.y, size, 0, Math.PI * 2);
            ctx.fill();
          }
          
          for (let i = 0; i < 7; i++) {
            const offsetAngle = (Math.random() - 0.5) * Math.PI / 2;
            const distance = Math.random() * playerSize * 2 + playerSize;
            
            const baseAngle = Math.atan2(dirY, dirX);
            const particleAngle = baseAngle + Math.PI + offsetAngle;
            
            const particleX = player.x + Math.cos(particleAngle) * distance;
            const particleY = player.y + Math.sin(particleAngle) * distance;
            
            const particleSize = (playerSize / 4) * (1 - distance / (playerSize * 3));
            
            const hue = Math.random() * 60 - 30;
            ctx.fillStyle = `hsla(${hue + 30}, 100%, 70%, ${0.7 * Math.random() + 0.3})`;
            
            ctx.beginPath();
            ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
            ctx.fill();
          }
          
          const angleBase = Math.atan2(dirY, dirX) + Math.PI;
          for (let i = 0; i < 4; i++) {
            const angleOffset = (Math.random() - 0.5) * Math.PI / 4;
            const lineAngle = angleBase + angleOffset;
            const lineLength = playerSize * (1.5 + Math.random());
            
            const startX = player.x + Math.cos(lineAngle) * playerSize * 0.8;
            const startY = player.y + Math.sin(lineAngle) * playerSize * 0.8;
            const endX = player.x + Math.cos(lineAngle) * (playerSize * 0.8 + lineLength);
            const endY = player.y + Math.sin(lineAngle) * (playerSize * 0.8 + lineLength);
            
            const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.strokeStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
          }
        }
        
        if (isCurrentPlayer) {
          ctx.fillStyle = '#FFFF00';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`You (${player.queue?.length || 0})`, player.x, player.y - calculatePlayerSize(player) - 15);
        } else {
          const queueCount = player.queue?.length || 0;
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`${queueCount}`, player.x, player.y - calculatePlayerSize(player) - 5);
        }
      });
      
      ctx.restore();
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(10, 10, 200, 60);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px Arial';
      
      const playerCount = Object.keys(rendererStateRef.current.players).length;
      ctx.fillText(`Players: ${playerCount}`, 20, 30);
      
      if (playerId && rendererStateRef.current.players[playerId]) {
        const player = rendererStateRef.current.players[playerId];
        const queueCount = player.queue?.length || 0;
        ctx.fillText(`Segments: ${queueCount}`, 20, 60);
      }
      
      previousTimeRef.current = timestamp;
      requestRef.current = requestAnimationFrame(renderFrame);
    };
    
    requestRef.current = requestAnimationFrame(renderFrame);
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [gameState.worldSize, playerId, camera]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full touch-none"
    />
  );
};

export default GameCanvas;
