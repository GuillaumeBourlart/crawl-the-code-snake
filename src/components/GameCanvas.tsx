
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
}

const GameCanvas = ({ gameState, playerId, onMove, onBoost }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const rafRef = useRef<number>();
  
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
          ctx.fillStyle = '#00FF00';
          ctx.beginPath();
          ctx.arc(item.x, item.y, 5, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      
      // Draw players and their segments
      Object.entries(gameState.players).forEach(([id, player]) => {
        // Use default size or length if not provided
        const playerSize = player.size || player.length || 10;
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
        
        // Draw player head
        ctx.fillStyle = playerColor;
        ctx.beginPath();
        ctx.arc(player.x, player.y, playerSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Add a border if this is the current player
        if (id === playerId) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();
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
          ctx.fillText(`You (${Math.round(player.x)},${Math.round(player.y)})`, player.x - 20, player.y - playerSize - 5);
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
