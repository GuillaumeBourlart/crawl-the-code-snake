
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
  const rafRef = useRef<number>();
  const cpuImageRef = useRef<HTMLImageElement | null>(null);
  
  useEffect(() => {
    const createProcessorImage = (color: string): HTMLImageElement => {
      const canvas = document.createElement('canvas');
      canvas.width = 40;
      canvas.height = 40;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return new Image();
      
      ctx.fillStyle = color;
      
      ctx.fillRect(8, 8, 24, 24);
      
      ctx.fillRect(3, 15, 5, 4);  // left
      ctx.fillRect(32, 15, 5, 4); // right
      ctx.fillRect(15, 3, 4, 5);  // top
      ctx.fillRect(21, 3, 4, 5);  // top
      ctx.fillRect(15, 32, 4, 5); // bottom
      ctx.fillRect(21, 32, 4, 5); // bottom
      
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(12, 12, 16, 16);
      
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(10, 10, 2, 2);
      ctx.fillRect(28, 28, 2, 2);
      
      const img = new Image();
      img.src = canvas.toDataURL();
      return img;
    };
    
    cpuImageRef.current = createProcessorImage('#FF0000');
  }, []);
  
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
    
    const handleMouseClick = () => {
      onBoost();
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseClick);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseClick);
    };
  }, [gameState, playerId, onMove, onBoost, camera]);
  
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
    if (!playerId || !gameState.players[playerId] || !onPlayerCollision) return;
    
    const currentPlayer = gameState.players[playerId];
    const currentSize = calculatePlayerSize(currentPlayer);
    
    Object.entries(gameState.players).forEach(([otherId, otherPlayer]) => {
      if (otherId === playerId) return;
      
      const otherSize = calculatePlayerSize(otherPlayer);
      const dx = currentPlayer.x - otherPlayer.x;
      const dy = currentPlayer.y - otherPlayer.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Head-to-head collision - compare sizes
      if (distance < (currentSize + otherSize) / 2) {
        const currentQueueLength = currentPlayer.queue?.length || 0;
        const otherQueueLength = otherPlayer.queue?.length || 0;
        
        if (currentQueueLength <= otherQueueLength) {
          onPlayerCollision(otherId);
          return;
        }
      }
      
      // Queue collision - current player dies regardless of size
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
  
  // Simplified rendering with better performance
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas to match screen resolution
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Precompute grid positions
    const gridSize = 50;
    
    // Animation render loop
    const render = () => {
      // Clear canvas
      ctx.fillStyle = '#121212';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(camera.zoom, camera.zoom);
      ctx.translate(-camera.x, -camera.y);
      
      // Draw grid
      const startX = Math.floor((camera.x - canvas.width / camera.zoom / 2) / gridSize) * gridSize;
      const endX = Math.ceil((camera.x + canvas.width / camera.zoom / 2) / gridSize) * gridSize;
      const startY = Math.floor((camera.y - canvas.height / camera.zoom / 2) / gridSize) * gridSize;
      const endY = Math.ceil((camera.y + canvas.height / camera.zoom / 2) / gridSize) * gridSize;
      
      ctx.strokeStyle = 'rgba(50, 50, 50, 0.5)';
      ctx.lineWidth = 1;
      
      for (let x = startX; x <= endX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      }
      
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }
      
      // Draw world boundary
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, gameState.worldSize.width, gameState.worldSize.height);
      
      // Draw items
      if (gameState.items && gameState.items.length > 0) {
        gameState.items.forEach(item => {
          // Skip rendering items outside of view
          if (
            item.x < camera.x - canvas.width / camera.zoom / 2 - 20 ||
            item.x > camera.x + canvas.width / camera.zoom / 2 + 20 ||
            item.y < camera.y - canvas.height / camera.zoom / 2 - 20 ||
            item.y > camera.y + canvas.height / camera.zoom / 2 + 20
          ) {
            return;
          }
          
          ctx.fillStyle = item.color || '#FFFFFF';
          ctx.beginPath();
          ctx.arc(item.x, item.y, 10, 0, Math.PI * 2);
          ctx.fill();
          
          // Highlight effect
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.beginPath();
          ctx.arc(item.x - 3, item.y - 3, 3, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      
      // Draw players
      Object.entries(gameState.players).forEach(([id, player]) => {
        // Skip rendering players far outside of view
        if (
          player.x < camera.x - canvas.width / camera.zoom / 2 - 100 ||
          player.x > camera.x + canvas.width / camera.zoom / 2 + 100 ||
          player.y < camera.y - canvas.height / camera.zoom / 2 - 100 ||
          player.y > camera.y + canvas.height / camera.zoom / 2 + 100
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
          
          // Draw queue segments
          ctx.beginPath();
          ctx.moveTo(player.x, player.y);
          
          for (let i = 0; i < player.queue.length; i++) {
            ctx.lineTo(player.queue[i].x, player.queue[i].y);
          }
          
          ctx.stroke();
          
          // Draw queue nodes (only for visible segments)
          for (let i = 0; i < player.queue.length; i++) {
            const segment = player.queue[i];
            
            // Skip segments far from camera
            if (
              segment.x < camera.x - canvas.width / camera.zoom / 2 - 20 ||
              segment.x > camera.x + canvas.width / camera.zoom / 2 + 20 ||
              segment.y < camera.y - canvas.height / camera.zoom / 2 - 20 ||
              segment.y > camera.y + canvas.height / camera.zoom / 2 + 20
            ) {
              continue;
            }
            
            ctx.fillStyle = playerColor;
            ctx.beginPath();
            ctx.arc(segment.x, segment.y, playerSize / 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(segment.x - 2, segment.y - 2, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        // Draw player head
        const drawPlayerHead = () => {
          ctx.fillStyle = playerColor;
          
          ctx.fillRect(player.x - 20 * (playerSize / 20) / 2, player.y - 20 * (playerSize / 20) / 2, 
                       20 * (playerSize / 20), 20 * (playerSize / 20));
          
          // Draw embellishments
          const scale = playerSize / 20;
          const baseX = player.x - 20 * scale / 2;
          const baseY = player.y - 20 * scale / 2;
          const size = 20 * scale;
          
          // Main processor square
          ctx.fillRect(baseX + size * 0.2, baseY + size * 0.2, size * 0.6, size * 0.6);
          
          // Connectors
          ctx.fillRect(baseX + size * 0.075, baseY + size * 0.375, size * 0.125, size * 0.1); // left
          ctx.fillRect(baseX + size * 0.8, baseY + size * 0.375, size * 0.125, size * 0.1);   // right
          ctx.fillRect(baseX + size * 0.375, baseY + size * 0.075, size * 0.1, size * 0.125); // top
          ctx.fillRect(baseX + size * 0.525, baseY + size * 0.075, size * 0.1, size * 0.125); // top
          ctx.fillRect(baseX + size * 0.375, baseY + size * 0.8, size * 0.1, size * 0.125);   // bottom
          ctx.fillRect(baseX + size * 0.525, baseY + size * 0.8, size * 0.1, size * 0.125);   // bottom
          
          // Inner detail
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(baseX + size * 0.3, baseY + size * 0.3, size * 0.4, size * 0.4);
          
          // Highlights
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.fillRect(baseX + size * 0.25, baseY + size * 0.25, size * 0.05, size * 0.05);
          ctx.fillRect(baseX + size * 0.7, baseY + size * 0.7, size * 0.05, size * 0.05);
        };
        
        drawPlayerHead();
        
        // Highlight current player
        if (id === playerId) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          const scale = playerSize / 20;
          ctx.strokeRect(player.x - 20 * scale / 2, player.y - 20 * scale / 2, 20 * scale, 20 * scale);
        }
        
        // Draw boost effect
        if (player.boosting) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.beginPath();
          ctx.arc(player.x, player.y, playerSize * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Draw player label
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
      
      // Draw UI overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(10, 10, 200, 60);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px Arial';
      
      const playerCount = Object.keys(gameState.players).length;
      ctx.fillText(`Players: ${playerCount}`, 20, 30);
      
      if (playerId && gameState.players[playerId]) {
        const player = gameState.players[playerId];
        const queueCount = player.queue?.length || 0;
        ctx.fillText(`Segments: ${queueCount}`, 20, 60);
      }
      
      rafRef.current = requestAnimationFrame(render);
    };
    
    rafRef.current = requestAnimationFrame(render);
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [gameState, playerId, camera]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full touch-none"
    />
  );
};

export default GameCanvas;
