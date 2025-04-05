
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
  
  // Use refs for rendering state to prevent re-renders
  const gameStateRef = useRef<GameState>({
    players: {},
    items: [],
    worldSize: { width: 2000, height: 2000 }
  });
  
  // Store renderer state in a ref to avoid re-renders
  const rendererStateRef = useRef({
    players: {} as Record<string, Player>,
    items: [] as GameItem[],
    gridNeedsUpdate: true,
    needsFullRedraw: true,
    lastFrameTime: 0
  });
  
  // Cache grid rendering
  const gridCacheCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Frame rate tracking
  const fpsRef = useRef({
    frames: 0,
    lastFpsUpdate: 0,
    fps: 0
  });
  
  // Update gameStateRef when props change
  useEffect(() => {
    // Only mark for full redraw if there's a significant change
    if (JSON.stringify(gameStateRef.current.players) !== JSON.stringify(gameState.players)) {
      rendererStateRef.current.needsFullRedraw = true;
    }
    
    gameStateRef.current = {
      ...gameState,
      items: gameState.items || []
    };
  }, [gameState]);
  
  // Initialize camera position when player joins
  useEffect(() => {
    if (!playerId || !gameState.players[playerId]) return;
    
    const player = gameState.players[playerId];
    setCamera(prev => {
      // Only update if position changed significantly
      const dx = Math.abs(prev.x - player.x);
      const dy = Math.abs(prev.y - player.y);
      if (dx > 1 || dy > 1) {
        return {
          ...prev,
          x: player.x,
          y: player.y
        };
      }
      return prev;
    });
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
      
      const player = gameStateRef.current.players[playerId];
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
    
    // Throttle mouse move events 
    let lastMoveTime = 0;
    const throttledMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastMoveTime >= 16) { // ~60fps throttle
        lastMoveTime = now;
        handleMouseMove(e);
      }
    };
    
    const handleMouseClick = () => {
      onBoost();
    };
    
    window.addEventListener('mousemove', throttledMouseMove);
    window.addEventListener('mousedown', handleMouseClick);
    
    return () => {
      window.removeEventListener('mousemove', throttledMouseMove);
      window.removeEventListener('mousedown', handleMouseClick);
    };
  }, [camera, onMove, onBoost, playerId]);
  
  // Check for player collisions - optimized to run less frequently
  useEffect(() => {
    if (!playerId || !gameState.players[playerId] || !onPlayerCollision) return;
    
    const collisionCheckInterval = setInterval(() => {
      const currentPlayer = gameStateRef.current.players[playerId];
      if (!currentPlayer) return;
      
      const currentSize = calculatePlayerSize(currentPlayer);
      
      Object.entries(gameStateRef.current.players).forEach(([otherId, otherPlayer]) => {
        if (otherId === playerId) return;
        
        const otherSize = calculatePlayerSize(otherPlayer);
        const dx = currentPlayer.x - otherPlayer.x;
        const dy = currentPlayer.y - otherPlayer.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Use bounding box check before more expensive distance check
        const boundingBoxSize = currentSize + otherSize;
        if (Math.abs(dx) > boundingBoxSize || Math.abs(dy) > boundingBoxSize) {
          return; // Skip detailed collision check if objects are far apart
        }
        
        // Head-to-head collision - compare sizes
        if (distance < (currentSize + otherSize) / 2) {
          const currentQueueLength = currentPlayer.queue?.length || 0;
          const otherQueueLength = otherPlayer.queue?.length || 0;
          
          if (currentQueueLength <= otherQueueLength) {
            onPlayerCollision(otherId);
            return;
          }
        }
        
        // Only check queue collision if player heads are close enough
        if (distance < 200 && otherPlayer.queue && otherPlayer.queue.length > 0) {
          const collisionRadius = currentSize / 2;
          
          // Only check every few segments for performance
          const skipFactor = Math.max(1, Math.floor(otherPlayer.queue.length / 20));
          
          for (let i = 0; i < otherPlayer.queue.length; i += skipFactor) {
            const segment = otherPlayer.queue[i];
            const segDx = currentPlayer.x - segment.x;
            const segDy = currentPlayer.y - segment.y;
            
            // Bounding box check before distance check
            if (Math.abs(segDx) > collisionRadius || Math.abs(segDy) > collisionRadius) {
              continue;
            }
            
            const segDistance = Math.sqrt(segDx * segDx + segDy * segDy);
            
            if (segDistance < collisionRadius) {
              onPlayerCollision(otherId);
              return;
            }
          }
        }
      });
    }, 100); // Check collisions every 100ms instead of every frame
    
    return () => clearInterval(collisionCheckInterval);
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
    
    // Smoothly interpolate camera position
    setCamera(prev => {
      const targetX = player.x;
      const targetY = player.y;
      
      // Only update if position changed significantly to prevent unnecessary rerenders
      const dx = Math.abs(prev.x - targetX);
      const dy = Math.abs(prev.y - targetY);
      
      if (dx > 2 || dy > 2) {
        const lerpFactor = 0.2; // Lower = smoother but slower
        return {
          ...prev,
          x: prev.x + (targetX - prev.x) * lerpFactor,
          y: prev.y + (targetY - prev.y) * lerpFactor
        };
      }
      return prev;
    });
    
    // Mark grid for update only when player moves far enough
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
    
    // Get context with optimization flags
    const ctx = canvas.getContext('2d', { 
      alpha: false,          // No transparency needed for full canvas
      desynchronized: true,  // Allow browser to optimize rendering
      willReadFrequently: false // We don't read pixel data
    });
    if (!ctx) return;
    
    // Create grid cache canvas if it doesn't exist
    if (!gridCacheCanvasRef.current) {
      gridCacheCanvasRef.current = document.createElement('canvas');
    }
    
    // Set canvas to match screen resolution
    const resizeCanvas = () => {
      // Scale for high-DPI displays
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      
      if (gridCacheCanvasRef.current) {
        gridCacheCanvasRef.current.width = canvas.width;
        gridCacheCanvasRef.current.height = canvas.height;
      }
      
      ctx.scale(dpr, dpr);
      rendererStateRef.current.gridNeedsUpdate = true;
      rendererStateRef.current.needsFullRedraw = true;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Pre-render grid to offscreen canvas
    const updateGridCache = () => {
      const gridCanvas = gridCacheCanvasRef.current;
      if (!gridCanvas) return;
      
      const gridCtx = gridCanvas.getContext('2d', { 
        alpha: false, 
        desynchronized: true 
      });
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
      const viewWidth = canvas.width / camera.zoom;
      const viewHeight = canvas.height / camera.zoom;
      const startX = Math.floor((camera.x - viewWidth / 2) / gridSize) * gridSize;
      const endX = Math.ceil((camera.x + viewWidth / 2) / gridSize) * gridSize;
      const startY = Math.floor((camera.y - viewHeight / 2) / gridSize) * gridSize;
      const endY = Math.ceil((camera.y + viewHeight / 2) / gridSize) * gridSize;
      
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
      gridCtx.strokeRect(0, 0, gameStateRef.current.worldSize.width, gameStateRef.current.worldSize.height);
      
      gridCtx.restore();
      
      rendererStateRef.current.gridNeedsUpdate = false;
    };
    
    // Animation frame callback
    const renderFrame = (timestamp: number) => {
      if (!canvas) return;
      
      // Calculate delta time between frames
      const deltaTime = timestamp - (rendererStateRef.current.lastFrameTime || timestamp);
      rendererStateRef.current.lastFrameTime = timestamp;
      
      // FPS counter
      fpsRef.current.frames++;
      if (timestamp - fpsRef.current.lastFpsUpdate > 1000) {
        fpsRef.current.fps = fpsRef.current.frames;
        fpsRef.current.frames = 0;
        fpsRef.current.lastFpsUpdate = timestamp;
      }
      
      // Only update UI at 60 FPS max
      const timeSinceLastRender = timestamp - previousTimeRef.current;
      if (timeSinceLastRender < 16.667 && !rendererStateRef.current.needsFullRedraw) {
        requestRef.current = requestAnimationFrame(renderFrame);
        return;
      }
      
      // Clear the canvas only if needed
      if (rendererStateRef.current.needsFullRedraw) {
        ctx.fillStyle = '#121212';
        ctx.fillRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
      }
      
      // Update grid cache if needed
      if (rendererStateRef.current.gridNeedsUpdate && gridCacheCanvasRef.current) {
        updateGridCache();
      }
      
      // Draw grid from cache
      if (gridCacheCanvasRef.current) {
        ctx.drawImage(
          gridCacheCanvasRef.current, 
          0, 0, 
          canvas.width, canvas.height,
          0, 0, 
          canvas.width / window.devicePixelRatio, 
          canvas.height / window.devicePixelRatio
        );
      }
      
      ctx.save();
      
      ctx.translate(canvas.width / window.devicePixelRatio / 2, canvas.height / window.devicePixelRatio / 2);
      ctx.scale(camera.zoom, camera.zoom);
      ctx.translate(-camera.x, -camera.y);
      
      // Use viewport culling for efficient rendering
      const viewWidth = canvas.width / window.devicePixelRatio / camera.zoom;
      const viewHeight = canvas.height / window.devicePixelRatio / camera.zoom;
      
      const viewportLeft = camera.x - viewWidth / 2 - 100;
      const viewportRight = camera.x + viewWidth / 2 + 100;
      const viewportTop = camera.y - viewHeight / 2 - 100;
      const viewportBottom = camera.y + viewHeight / 2 + 100;
      
      // Draw items
      if (rendererStateRef.current.items.length > 0) {
        // Only redraw items when full redraw is needed
        if (rendererStateRef.current.needsFullRedraw) {
          const visibleItems = rendererStateRef.current.items.filter(item => 
            item.x >= viewportLeft && 
            item.x <= viewportRight && 
            item.y >= viewportTop && 
            item.y <= viewportBottom
          );
          
          // Batch items by color for fewer state changes
          const itemsByColor = visibleItems.reduce((groups, item) => {
            const color = item.color || '#FFFFFF';
            if (!groups[color]) {
              groups[color] = [];
            }
            groups[color].push(item);
            return groups;
          }, {} as Record<string, GameItem[]>);
          
          // Draw items grouped by color
          Object.entries(itemsByColor).forEach(([color, items]) => {
            ctx.fillStyle = color;
            items.forEach(item => {
              ctx.beginPath();
              ctx.arc(item.x, item.y, 10, 0, Math.PI * 2);
              ctx.fill();
            });
            
            // Draw highlights
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            items.forEach(item => {
              ctx.beginPath();
              ctx.arc(item.x - 3, item.y - 3, 3, 0, Math.PI * 2);
              ctx.fill();
            });
          });
        }
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
          // and using segmentation for long queues
          const skipFactor = player.queue.length > 50 ? Math.floor(player.queue.length / 50) : 1;
          
          // Filter visible segments
          const visibleSegments: {x: number, y: number, index: number}[] = [];
          player.queue.forEach((segment, index) => {
            if (index % skipFactor !== 0 && index !== player.queue!.length - 1) return;
            
            if (
              segment.x >= viewportLeft && 
              segment.x <= viewportRight && 
              segment.y >= viewportTop && 
              segment.y <= viewportBottom
            ) {
              visibleSegments.push({...segment, index});
            }
          });
          
          // Draw line connecting segments
          if (visibleSegments.length > 0 || (
            player.x >= viewportLeft && 
            player.x <= viewportRight && 
            player.y >= viewportTop && 
            player.y <= viewportBottom
          )) {
            ctx.beginPath();
            ctx.moveTo(player.x, player.y);
            
            for (const segment of visibleSegments) {
              ctx.lineTo(segment.x, segment.y);
            }
            
            ctx.stroke();
            
            // Only draw queue nodes for visible segments
            for (const segment of visibleSegments) {
              ctx.fillStyle = playerColor;
              ctx.beginPath();
              ctx.arc(segment.x, segment.y, playerSize / 2.5, 0, Math.PI * 2);
              ctx.fill();
              
              // Simple highlight only for nodes that are not too numerous
              if (skipFactor <= 2) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.arc(segment.x - 2, segment.y - 2, 2, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
        }
        
        // Draw player head
        const drawPlayerHead = () => {
          ctx.fillStyle = playerColor;
          
          // Main processor square
          const scale = playerSize / 20;
          const baseX = player.x - 20 * scale / 2;
          const baseY = player.y - 20 * scale / 2;
          const size = 20 * scale;
          
          ctx.fillRect(baseX, baseY, size, size);
          
          // Main processor inner square
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
      // Use optimization: only redraw UI when it changes or on full redraw
      if (rendererStateRef.current.needsFullRedraw) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, 10, 210, 90);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px Arial';
        
        const playerCount = Object.keys(rendererStateRef.current.players).length;
        ctx.fillText(`Players: ${playerCount}`, 20, 30);
        
        if (playerId && rendererStateRef.current.players[playerId]) {
          const player = rendererStateRef.current.players[playerId];
          const queueCount = player.queue?.length || 0;
          ctx.fillText(`Segments: ${queueCount}`, 20, 60);
        }
        
        // Display FPS
        ctx.fillText(`FPS: ${fpsRef.current.fps}`, 20, 90);
      }
      
      // Reset full redraw flag
      rendererStateRef.current.needsFullRedraw = false;
      
      // Store previous timestamp and request next frame
      previousTimeRef.current = timestamp;
      requestRef.current = requestAnimationFrame(renderFrame);
    };
    
    // Start the animation loop
    requestRef.current = requestAnimationFrame(renderFrame);
    
    // Enforce full redraw periodically to avoid stale UI
    const fullRedrawInterval = setInterval(() => {
      rendererStateRef.current.needsFullRedraw = true;
    }, 1000);
    
    // Cleanup
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
      clearInterval(fullRedrawInterval);
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
