import { useEffect, useRef, useState } from "react";

interface Player {
  id?: string;
  x: number;
  y: number;
  size?: number;
  length?: number;
  color?: string;
  direction?: { x: number; y: number };
  segments?: Array<{ x: number; y: number }>;
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
  items?: Record<string, GameItem>;
  worldSize: { width: number; height: number };
}

interface GameCanvasProps {
  gameState: GameState;
  playerId: string | null;
  onMove: (direction: { x: number; y: number }) => void;
  onBoost: () => void;
  onCollectItem?: (itemId: string) => void;
  onPlayerCollision?: (otherPlayerId: string) => void;
}

const GameCanvas = ({ 
  gameState, 
  playerId, 
  onMove, 
  onBoost, 
  onCollectItem,
  onPlayerCollision 
}: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const rafRef = useRef<number>();
  const cpuImageRef = useRef<HTMLImageElement | null>(null);
  
  // Preload images
  useEffect(() => {
    // Create CPU image (processor)
    const createProcessorImage = (color: string): HTMLImageElement => {
      const canvas = document.createElement('canvas');
      canvas.width = 40;
      canvas.height = 40;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return new Image();
      
      // Draw a processor-like shape
      ctx.fillStyle = color;
      
      // Main square
      ctx.fillRect(8, 8, 24, 24);
      
      // Connection pins
      ctx.fillRect(3, 15, 5, 4);  // left
      ctx.fillRect(32, 15, 5, 4); // right
      ctx.fillRect(15, 3, 4, 5);  // top
      ctx.fillRect(21, 3, 4, 5);  // top
      ctx.fillRect(15, 32, 4, 5); // bottom
      ctx.fillRect(21, 32, 4, 5); // bottom
      
      // Inner details
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(12, 12, 16, 16);
      
      // Highlights
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(10, 10, 2, 2);
      ctx.fillRect(28, 28, 2, 2);
      
      // Convert to image
      const img = new Image();
      img.src = canvas.toDataURL();
      return img;
    };
    
    // Create default processor with red color
    cpuImageRef.current = createProcessorImage('#FF0000');
    
  }, []);
  
  // Track mouse position
  useEffect(() => {
    if (!playerId) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      
      // Calculate the direction based on current player position and mouse position
      const player = gameState.players[playerId];
      if (!player) return;
      
      // Convert canvas coordinates to world coordinates
      const worldX = (canvasX / canvas.width) * canvas.width / camera.zoom + camera.x - canvas.width / camera.zoom / 2;
      const worldY = (canvasY / canvas.height) * canvas.height / camera.zoom + camera.y - canvas.height / camera.zoom / 2;
      
      // Calculate direction vector from player to mouse
      const dx = worldX - player.x;
      const dy = worldY - player.y;
      
      // Normalize the direction vector
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
  
  // Update camera position to follow player
  useEffect(() => {
    if (!playerId || !gameState.players[playerId]) return;
    
    const player = gameState.players[playerId];
    setCamera(prev => ({
      ...prev,
      x: player.x,
      y: player.y
    }));
  }, [gameState, playerId]);
  
  // Check for item collection
  useEffect(() => {
    if (!playerId || !gameState.players[playerId] || !gameState.items || !onCollectItem) return;
    
    const player = gameState.players[playerId];
    const playerSize = player.size || player.length || 20;
    
    // Check if the player is overlapping with any items
    Object.entries(gameState.items).forEach(([itemId, item]) => {
      const dx = player.x - item.x;
      const dy = player.y - item.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If the player is touching the item, collect it
      if (distance < playerSize + 10) {
        onCollectItem(itemId);
      }
    });
  }, [gameState, playerId, onCollectItem]);
  
  // Check for player collisions
  useEffect(() => {
    if (!playerId || !gameState.players[playerId] || !onPlayerCollision) return;
    
    const currentPlayer = gameState.players[playerId];
    const currentSize = currentPlayer.size || currentPlayer.length || 20;
    
    // Check collisions with other players
    Object.entries(gameState.players).forEach(([otherId, otherPlayer]) => {
      if (otherId === playerId) return; // Don't check collision with self
      
      const otherSize = otherPlayer.size || otherPlayer.length || 20;
      const dx = currentPlayer.x - otherPlayer.x;
      const dy = currentPlayer.y - otherPlayer.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If players are touching and the current player is smaller
      if (distance < (currentSize + otherSize) / 2) {
        onPlayerCollision(otherId);
      }
    });
  }, [gameState, playerId, onPlayerCollision]);
  
  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const render = () => {
      // Clear canvas
      ctx.fillStyle = '#121212';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Save context to restore later
      ctx.save();
      
      // Move the context to center of canvas and apply camera transform
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(camera.zoom, camera.zoom);
      ctx.translate(-camera.x, -camera.y);
      
      // Draw grid
      const gridSize = 50;
      const gridExtent = 1000; // How far to draw the grid in each direction
      
      ctx.strokeStyle = 'rgba(50, 50, 50, 0.5)';
      ctx.lineWidth = 1;
      
      // Start grid from camera position snapped to grid
      const startX = Math.floor((camera.x - gridExtent) / gridSize) * gridSize;
      const startY = Math.floor((camera.y - gridExtent) / gridSize) * gridSize;
      
      for (let x = startX; x < camera.x + gridExtent; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, camera.y - gridExtent);
        ctx.lineTo(x, camera.y + gridExtent);
        ctx.stroke();
      }
      
      for (let y = startY; y < camera.y + gridExtent; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(camera.x - gridExtent, y);
        ctx.lineTo(camera.x + gridExtent, y);
        ctx.stroke();
      }
      
      // Draw world boundary
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, gameState.worldSize.width, gameState.worldSize.height);
      
      // Draw items - checking if items exist before iterating
      if (gameState.items) {
        Object.values(gameState.items).forEach(item => {
          // Draw circle with item's color
          ctx.fillStyle = item.color || '#FFFFFF';
          ctx.beginPath();
          ctx.arc(item.x, item.y, 10, 0, Math.PI * 2);
          ctx.fill();
          
          // Add shine effect
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.beginPath();
          ctx.arc(item.x - 3, item.y - 3, 3, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw item value
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`${item.value}`, item.x, item.y + 20);
        });
      }
      
      // Draw players and their segments
      Object.entries(gameState.players).forEach(([id, player]) => {
        // Use default size or length if not provided
        const playerSize = player.size || player.length || 20;
        const playerColor = player.color || (id === playerId ? '#FF0000' : '#FFFFFF');
        
        // Draw segments (trail)
        if (player.segments && player.segments.length > 0) {
          ctx.strokeStyle = playerColor;
          ctx.lineWidth = Math.max(3, playerSize / 3);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          ctx.beginPath();
          
          // Start from the head
          ctx.moveTo(player.x, player.y);
          
          // Draw line through all segments
          for (let i = 0; i < player.segments.length; i++) {
            ctx.lineTo(player.segments[i].x, player.segments[i].y);
          }
          
          ctx.stroke();
        }
        
        // Create a processor image for this player if needed
        if (id === playerId || !cpuImageRef.current) {
          // Use the preloaded CPU image or create one for this player
          const cpuImage = document.createElement('canvas');
          cpuImage.width = 40;
          cpuImage.height = 40;
          const cpuCtx = cpuImage.getContext('2d');
          
          if (cpuCtx) {
            // Draw a processor-like shape with player's color
            cpuCtx.fillStyle = playerColor;
            
            // Main square
            cpuCtx.fillRect(8, 8, 24, 24);
            
            // Connection pins
            cpuCtx.fillRect(3, 15, 5, 4);  // left
            cpuCtx.fillRect(32, 15, 5, 4); // right
            cpuCtx.fillRect(15, 3, 4, 5);  // top
            cpuCtx.fillRect(21, 3, 4, 5);  // top
            cpuCtx.fillRect(15, 32, 4, 5); // bottom
            cpuCtx.fillRect(21, 32, 4, 5); // bottom
            
            // Inner details
            cpuCtx.fillStyle = 'rgba(0,0,0,0.3)';
            cpuCtx.fillRect(12, 12, 16, 16);
            
            // Highlights
            cpuCtx.fillStyle = 'rgba(255,255,255,0.5)';
            cpuCtx.fillRect(10, 10, 2, 2);
            cpuCtx.fillRect(28, 28, 2, 2);
            
            // Draw processor at player position
            const scale = playerSize / 20; // Scale based on player size
            ctx.drawImage(
              cpuImage, 
              player.x - 20 * scale, 
              player.y - 20 * scale, 
              40 * scale, 
              40 * scale
            );
          }
        } else {
          // Use the default CPU image for other players
          const scale = playerSize / 20; // Scale based on player size
          ctx.drawImage(
            cpuImageRef.current, 
            player.x - 20 * scale, 
            player.y - 20 * scale, 
            40 * scale, 
            40 * scale
          );
        }
        
        // Add a border if this is the current player
        if (id === playerId) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.strokeRect(
            player.x - 20 * (playerSize / 20),
            player.y - 20 * (playerSize / 20),
            40 * (playerSize / 20),
            40 * (playerSize / 20)
          );
        }
        
        // Draw boost effect if the player is boosting
        if (player.boosting) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.beginPath();
          ctx.arc(player.x, player.y, playerSize * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Draw player ID or position for debugging
        if (id === playerId) {
          ctx.fillStyle = '#FFFF00';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`You (${Math.round(player.x)},${Math.round(player.y)})`, player.x, player.y - playerSize - 15);
        } else {
          const size = Math.round(playerSize);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`${size}`, player.x, player.y - playerSize - 5);
        }
      });
      
      ctx.restore();
      
      // Draw score and player count
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(10, 10, 200, 60);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px Arial';
      
      const playerCount = Object.keys(gameState.players).length;
      ctx.fillText(`Players: ${playerCount}`, 20, 30);
      
      if (playerId && gameState.players[playerId]) {
        const player = gameState.players[playerId];
        const playerSize = player.size || player.length || 0;
        ctx.fillText(`Size: ${Math.floor(playerSize)}`, 20, 60);
      }
      
      rafRef.current = requestAnimationFrame(render);
    };
    
    rafRef.current = requestAnimationFrame(render);
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      window.removeEventListener('resize', handleResize);
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
