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
  
  // Initialize camera position when player joins
  useEffect(() => {
    if (!playerId || !gameState.players[playerId]) return;
    
    const player = gameState.players[playerId];
    setCamera(prev => ({
      ...prev,
      x: player.x,
      y: player.y
    }));
  }, [gameState, playerId]);
  
  // Handle mouse movement for player direction
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
  
  // Check for player collisions
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
  
  // When gameState changes, update camera position to follow player
  useEffect(() => {
    if (!playerId || !gameState.players[playerId]) return;
    
    const player = gameState.players[playerId];
    setCamera(prev => ({
      ...prev,
      x: player.x,
      y: player.y
    }));
    
    // Mark grid for update when players move significantly
    const prevPlayer = rendererStateRef.current.players[playerId];
    if (prevPlayer) {
      const dx = Math.abs(prevPlayer.x - player.x);
      const dy = Math.abs(prevPlayer.y - player.y);
      if (dx > 50 || dy > 50) {
        rendererStateRef.current.gridNeedsUpdate = true;
      }
    }
    
    // Update renderer state with new data
    rendererStateRef.current.players = { ...gameState.players };
    rendererStateRef.current.items = gameState.items || [];
  }, [gameState, playerId]);
  
  // Main rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    
    // Create grid cache canvas if it doesn't exist
    if (!gridCacheCanvasRef.current) {
      gridCacheCanvasRef.current = document.createElement('canvas');
    }
    
    // Set canvas to match screen resolution
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
    
    // Pre-render grid to offscreen canvas
    const updateGridCache = () => {
      const gridCanvas = gridCacheCanvasRef.current;
      if (!gridCanvas) return;
      
      const gridCtx = gridCanvas.getContext('2d', { alpha: false });
      if (!gridCtx) return;
      
      // Clear grid canvas
      gridCtx.fillStyle = '#121212';
      gridCtx.fillRect(0, 0, gridCanvas.width, gridCanvas.height);
      
      gridCtx.save();
      
      gridCtx.translate(gridCanvas.width / 2, gridCanvas.height / 2);
      gridCtx.scale(camera.zoom, camera.zoom);
      gridCtx.translate(-camera.x, -camera.y);
      
      // Draw grid
      const gridSize = 50;
      const startX = Math.floor((camera.x - canvas.width / camera.zoom / 2) / gridSize) * gridSize;
      const endX = Math.ceil((camera.x + canvas.width / camera.zoom / 2) / gridSize) * gridSize;
      const startY = Math.floor((camera.y - canvas.height / camera.zoom / 2) / gridSize) * gridSize;
      const endY = Math.ceil((camera.y + canvas.height / camera.zoom / 2) / gridSize) * gridSize;
      
      gridCtx.strokeStyle = 'rgba(50, 50, 50, 0.5)';
      gridCtx.lineWidth = 1;
      
      // Draw horizontal grid lines
      gridCtx.beginPath();
      for (let y = startY; y <= endY; y += gridSize) {
        gridCtx.moveTo(startX, y);
        gridCtx.lineTo(endX, y);
      }
      gridCtx.stroke();
      
      // Draw vertical grid lines
      gridCtx.beginPath();
      for (let x = startX; x <= endX; x += gridSize) {
        gridCtx.moveTo(x, startY);
        gridCtx.lineTo(x, endY);
      }
      gridCtx.stroke();
      
      // Draw world boundary
      gridCtx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      gridCtx.lineWidth = 2;
      gridCtx.strokeRect(0, 0, gameState.worldSize.width, gameState.worldSize.height);
      
      gridCtx.restore();
      
      rendererStateRef.current.gridNeedsUpdate = false;
    };
    
    // Animation frame callback
    const renderFrame = (timestamp: number) => {
      if (!canvas) return;
      
      // Clear the canvas with solid color (more efficient than clearRect)
      ctx.fillStyle = '#121212';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update grid cache if needed
      if (rendererStateRef.current.gridNeedsUpdate && gridCacheCanvasRef.current) {
        updateGridCache();
      }
      
      // Draw grid from cache
      if (gridCacheCanvasRef.current) {
        ctx.drawImage(gridCacheCanvasRef.current, 0, 0);
      }
      
      ctx.save();
      
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(camera.zoom, camera.zoom);
      ctx.translate(-camera.x, -camera.y);
      
      // Use viewport culling for efficient rendering
      const viewportLeft = camera.x - canvas.width / camera.zoom / 2 - 100;
      const viewportRight = camera.x + canvas.width / camera.zoom / 2 + 100;
      const viewportTop = camera.y - canvas.height / camera.zoom / 2 - 100;
      const viewportBottom = camera.y + canvas.height / camera.zoom / 2 + 100;
      
      // Draw items
      if (rendererStateRef.current.items.length > 0) {
        const visibleItems = rendererStateRef.current.items.filter(item => 
          item.x >= viewportLeft && 
          item.x <= viewportRight && 
          item.y >= viewportTop && 
          item.y <= viewportBottom
        );
        
        // Batch similar items for performance
        ctx.beginPath();
        visibleItems.forEach(item => {
          ctx.fillStyle = item.color || '#FFFFFF';
          ctx.beginPath();
          ctx.arc(item.x, item.y, 10, 0, Math.PI * 2);
          ctx.fill();
          
          // Simple highlight effect
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.beginPath();
          ctx.arc(item.x - 3, item.y - 3, 3, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      
      // Draw players
      Object.entries(rendererStateRef.current.players).forEach(([id, player]) => {
        // Skip players outside viewport
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
        
        // Draw queue segments
        if (player.queue && player.queue.length > 0) {
          ctx.strokeStyle = playerColor;
          ctx.lineWidth = Math.max(3, playerSize / 3);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          // Optimize queue rendering by skipping segments outside viewport
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
            // ctx.beginPath();
            // ctx.moveTo(player.x, player.y);
            
            // for (const segment of visibleQueue) {
            //   ctx.lineTo(segment.x, segment.y);
            // }
            
            // ctx.stroke();
            
            // Draw queue nodes
            for (const segment of visibleQueue) {
              ctx.fillStyle = playerColor;
              ctx.beginPath();
              ctx.arc(segment.x, segment.y, playerSize / 2, 0, Math.PI * 2);
              ctx.fill();
              
              // Simple highlight
              ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
              ctx.beginPath();
              ctx.arc(segment.x - 2, segment.y - 2, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
        
        // Draw player head - Enhanced processor design
        const drawPlayerHead = () => {
          // Base color
          ctx.fillStyle = playerColor;
          
          // Calculations for positioning
          const scale = playerSize / 20;
          const baseX = player.x - 20 * scale / 2;
          const baseY = player.y - 20 * scale / 2;
          const size = 20 * scale;
          
          // Main processor outer frame
          ctx.fillRect(baseX, baseY, size, size);
          
          // Secondary frame
          ctx.fillStyle = `${playerColor}`;
          ctx.fillRect(baseX + size * 0.15, baseY + size * 0.15, size * 0.7, size * 0.7);
          
          // CPU core - dark inner square
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(baseX + size * 0.25, baseY + size * 0.25, size * 0.5, size * 0.5);
          
          // Circuit traces
          ctx.fillStyle = `${playerColor}`;
          // Horizontal traces
          ctx.fillRect(baseX + size * 0.3, baseY + size * 0.35, size * 0.4, size * 0.05);
          ctx.fillRect(baseX + size * 0.3, baseY + size * 0.45, size * 0.4, size * 0.05);
          ctx.fillRect(baseX + size * 0.3, baseY + size * 0.55, size * 0.4, size * 0.05);
          ctx.fillRect(baseX + size * 0.3, baseY + size * 0.65, size * 0.4, size * 0.05);
          
          // Vertical traces
          ctx.fillRect(baseX + size * 0.35, baseY + size * 0.3, size * 0.05, size * 0.4);
          ctx.fillRect(baseX + size * 0.45, baseY + size * 0.3, size * 0.05, size * 0.4);
          ctx.fillRect(baseX + size * 0.55, baseY + size * 0.3, size * 0.05, size * 0.4);
          ctx.fillRect(baseX + size * 0.65, baseY + size * 0.3, size * 0.05, size * 0.4);
          
          // Connection pins (outer)
          ctx.fillStyle = 'rgba(220,220,220,0.9)';
          // Top pins
          ctx.fillRect(baseX + size * 0.25, baseY, size * 0.1, size * 0.15);
          ctx.fillRect(baseX + size * 0.45, baseY, size * 0.1, size * 0.15);
          ctx.fillRect(baseX + size * 0.65, baseY, size * 0.1, size * 0.15);
          // Bottom pins
          ctx.fillRect(baseX + size * 0.25, baseY + size * 0.85, size * 0.1, size * 0.15);
          ctx.fillRect(baseX + size * 0.45, baseY + size * 0.85, size * 0.1, size * 0.15);
          ctx.fillRect(baseX + size * 0.65, baseY + size * 0.85, size * 0.1, size * 0.15);
          // Left pins
          ctx.fillRect(baseX, baseY + size * 0.25, size * 0.15, size * 0.1);
          ctx.fillRect(baseX, baseY + size * 0.45, size * 0.15, size * 0.1);
          ctx.fillRect(baseX, baseY + size * 0.65, size * 0.15, size * 0.1);
          // Right pins
          ctx.fillRect(baseX + size * 0.85, baseY + size * 0.25, size * 0.15, size * 0.1);
          ctx.fillRect(baseX + size * 0.85, baseY + size * 0.45, size * 0.15, size * 0.1);
          ctx.fillRect(baseX + size * 0.85, baseY + size * 0.65, size * 0.15, size * 0.1);
          
          // Central core highlights
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.fillRect(baseX + size * 0.4, baseY + size * 0.4, size * 0.2, size * 0.2);
          
          // Processing light pulses (animated effect)
          const pulseIntensity = Math.sin(Date.now() / 200) * 0.5 + 0.5;
          ctx.fillStyle = `rgba(255,255,255,${0.3 + pulseIntensity * 0.4})`;
          ctx.fillRect(baseX + size * 0.45, baseY + size * 0.45, size * 0.1, size * 0.1);
        };
        
        drawPlayerHead();
        
        // Highlight current player
        if (id === playerId) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          const scale = playerSize / 20;
          ctx.strokeRect(player.x - 20 * scale / 2, player.y - 20 * scale / 2, 20 * scale, 20 * scale);
        }
        
        // Draw enhanced boost effect
        if (player.boosting) {
          const boostColor = playerColor === '#FF0000' ? '#FF6B6B' : playerColor;
          
          // Create pulsating glow effect
          const pulseScale = 1 + Math.sin(Date.now() / 150) * 0.2;
          
          // Outer glow - multiple layers with different opacities
          for (let i = 1; i <= 3; i++) {
            const opacity = 0.6 - (i * 0.15);
            const size = playerSize * (1.2 + (i * 0.3)) * pulseScale;
            
            // Radial gradient for the glow
            const gradient = ctx.createRadialGradient(
              player.x, player.y, 0,
              player.x, player.y, size
            );
            gradient.addColorStop(0, `${boostColor}CC`); // More opaque in center
            gradient.addColorStop(1, `${boostColor}00`); // Transparent at edges
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(player.x, player.y, size, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Particle effects behind the player
          const dirX = player.direction?.x || 0;
          const dirY = player.direction?.y || 0;
          
          for (let i = 0; i < 7; i++) {
            // Create random offset from the player's direction
            const offsetAngle = (Math.random() - 0.5) * Math.PI / 2; // +/- 45 degrees
            const distance = Math.random() * playerSize * 2 + playerSize;
            
            // Calculate the angle based on player direction
            const baseAngle = Math.atan2(dirY, dirX);
            const particleAngle = baseAngle + Math.PI + offsetAngle; // Particles go behind the player
            
            // Calculate particle position
            const particleX = player.x + Math.cos(particleAngle) * distance;
            const particleY = player.y + Math.sin(particleAngle) * distance;
            
            // Particle size decreases with distance
            const particleSize = (playerSize / 4) * (1 - distance / (playerSize * 3));
            
            // Random particle color variations
            const hue = Math.random() * 60 - 30; // +/- 30 hue degrees
            ctx.fillStyle = `hsla(${hue + 30}, 100%, 70%, ${0.7 * Math.random() + 0.3})`;
            
            // Draw the particle
            ctx.beginPath();
            ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Speed lines
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.lineWidth = 2;
          const angleBase = Math.atan2(dirY, dirX) + Math.PI; // Behind the player
          
          for (let i = 0; i < 4; i++) {
            const angleOffset = (Math.random() - 0.5) * Math.PI / 4;
            const lineAngle = angleBase + angleOffset;
            const lineLength = playerSize * (1.5 + Math.random());
            
            const startX = player.x + Math.cos(lineAngle) * playerSize * 0.8;
            const startY = player.y + Math.sin(lineAngle) * playerSize * 0.8;
            const endX = player.x + Math.cos(lineAngle) * (playerSize * 0.8 + lineLength);
            const endY = player.y + Math.sin(lineAngle) * (playerSize * 0.8 + lineLength);
            
            // Fade out effect
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
      
      const playerCount = Object.keys(rendererStateRef.current.players).length;
      ctx.fillText(`Players: ${playerCount}`, 20, 30);
      
      if (playerId && rendererStateRef.current.players[playerId]) {
        const player = rendererStateRef.current.players[playerId];
        const queueCount = player.queue?.length || 0;
        ctx.fillText(`Segments: ${queueCount}`, 20, 60);
      }
      
      // Store previous timestamp and request next frame
      previousTimeRef.current = timestamp;
      requestRef.current = requestAnimationFrame(renderFrame);
    };
    
    // Start the animation loop
    requestRef.current = requestAnimationFrame(renderFrame);
    
    // Cleanup
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
