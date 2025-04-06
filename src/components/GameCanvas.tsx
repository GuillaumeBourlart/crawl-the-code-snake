
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
  onBoost: () => void;
  onPlayerCollision?: (otherPlayerId: string) => void;
}

const GameCanvas = ({ 
  gameState, 
  playerId, 
  onMove, 
  onBoost, 
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
  
  // Référence pour stocker la dernière position connue de la souris
  const lastMousePositionRef = useRef<{ x: number, y: number } | null>(null);
  const isMouseOverCanvasRef = useRef<boolean>(false);
  
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
      
      if (
        e.clientX >= rect.left && 
        e.clientX <= rect.right && 
        e.clientY >= rect.top && 
        e.clientY <= rect.bottom
      ) {
        isMouseOverCanvasRef.current = true;
        
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
          
          // Stocker la dernière position connue de la souris
          lastMousePositionRef.current = { x: normalizedDx, y: normalizedDy };
          
          onMove({ x: normalizedDx, y: normalizedDy });
        }
      } else {
        isMouseOverCanvasRef.current = false;
      }
    };
    
    const handleMouseEnter = () => {
      isMouseOverCanvasRef.current = true;
    };
    
    const handleMouseLeave = () => {
      isMouseOverCanvasRef.current = false;
    };
    
    const handleMouseClick = () => {
      onBoost();
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseClick);
    
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mouseenter', handleMouseEnter);
      canvas.addEventListener('mouseleave', handleMouseLeave);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseClick);
      
      if (canvas) {
        canvas.removeEventListener('mouseenter', handleMouseEnter);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [gameState, playerId, onMove, onBoost, camera]);
  
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
        
        const playerSize = calculatePlayerSize(player);
        const playerColor = player.color || (id === playerId ? '#FF0000' : '#FFFFFF');
        
        if (player.queue && player.queue.length > 0) {
          ctx.strokeStyle = playerColor;
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
            ctx.moveTo(player.x, player.y);
            
            for (const segment of visibleQueue) {
              ctx.lineTo(segment.x, segment.y);
            }
            
            ctx.stroke();
            
            if (visibleQueue.length > 0) {
              const lastSegment = visibleQueue[visibleQueue.length - 1];
              
              ctx.fillStyle = playerColor;
              ctx.beginPath();
              ctx.arc(lastSegment.x, lastSegment.y, playerSize / 2, 0, Math.PI * 2);
              ctx.fill();
              
              ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
              ctx.beginPath();
              ctx.arc(lastSegment.x - 2, lastSegment.y - 2, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
        
        const drawPlayerHead = () => {
          ctx.fillStyle = playerColor;
          
          const scale = playerSize / 20;
          const baseX = player.x - 20 * scale / 2;
          const baseY = player.y - 20 * scale / 2;
          const size = 20 * scale;
          
          ctx.fillRect(baseX, baseY, size, size);
          
          ctx.fillRect(baseX + size * 0.2, baseY + size * 0.2, size * 0.6, size * 0.6);
          
          ctx.fillRect(baseX + size * 0.075, baseY + size * 0.375, size * 0.125, size * 0.1);
          ctx.fillRect(baseX + size * 0.8, baseY + size * 0.375, size * 0.125, size * 0.1);
          ctx.fillRect(baseX + size * 0.375, baseY + size * 0.075, size * 0.1, size * 0.125);
          ctx.fillRect(baseX + size * 0.525, baseY + size * 0.075, size * 0.1, size * 0.125);
          ctx.fillRect(baseX + size * 0.375, baseY + size * 0.8, size * 0.1, size * 0.125);
          ctx.fillRect(baseX + size * 0.525, baseY + size * 0.8, size * 0.1, size * 0.125);
          
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(baseX + size * 0.3, baseY + size * 0.3, size * 0.4, size * 0.4);
          
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.fillRect(baseX + size * 0.25, baseY + size * 0.25, size * 0.05, size * 0.05);
          ctx.fillRect(baseX + size * 0.7, baseY + size * 0.7, size * 0.05, size * 0.05);
        };
        
        drawPlayerHead();
        
        if (id === playerId) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          const scale = playerSize / 20;
          ctx.strokeRect(player.x - 20 * scale / 2, player.y - 20 * scale / 2, 20 * scale, 20 * scale);
        }
        
        if (player.boosting) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.beginPath();
          ctx.arc(player.x, player.y, playerSize * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        
        if (id === playerId) {
          ctx.fillStyle = '#FFFF00';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`You (${player.queue?.length || 0})`, player.x, player.y - playerSize - 15);
        } else {
          const queueCount = player.queue?.length || 0;
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`${queueCount}`, player.x, player.y - playerSize - 5);
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
