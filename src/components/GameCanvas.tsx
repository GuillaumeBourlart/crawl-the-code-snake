
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useSnapshot } from 'valtio';
import { state } from '@/state';
import { useIsMobile } from "@/hooks/use-mobile";

interface GameCanvasProps {
  gameState: any;
  playerId: string | null;
  onMove: (direction: { x: number; y: number }) => void;
  onBoostStart: () => void;
  onBoostStop: () => void;
  onPlayerCollision: (otherPlayerId: string) => void;
  isSpectator: boolean;
}

// Export this function to be used in MobileControls
export const handleJoystickDirection = (direction: { x: number; y: number }) => {
  // This function can be used to control player eye movement
  // Will be called from MobileControls
};

const GameCanvas = ({ 
  gameState, 
  playerId, 
  onMove, 
  onBoostStart, 
  onBoostStop, 
  onPlayerCollision, 
  isSpectator 
}: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = useIsMobile();
  
  // Set the initial zoom level to 0.6 for mobile, and 1.5 for desktop
  const initialZoom = isMobile ? 0.6 : 1.5;
  
  const [camera, setCamera] = useState({ 
    x: 0, 
    y: 0, 
    zoom: initialZoom,
    targetZoom: initialZoom
  });
  
  // Update zoom when mobile status changes
  useEffect(() => {
    setCamera(prev => ({ 
      ...prev, 
      zoom: isMobile ? 0.6 : 1.5 
    }));
    console.log("Mobile status changed, setting zoom to:", isMobile ? 0.6 : 1.5);
  }, [isMobile]);

  const [boostActive, setBoostActive] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastMove, setLastMove] = useState(Date.now());
  const [touchStart, setTouchStart] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const [touchZoomDistanceStart, setTouchZoomDistanceStart] = useState<number | null>(null);

  const { selectedPattern } = useSnapshot(state);

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomAmount = e.deltaY * -0.005;
    const newZoom = Math.max(0.3, Math.min(camera.zoom + zoomAmount, 3));
    setCamera(prev => ({ ...prev, targetZoom: newZoom }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      setCamera(prev => ({
        ...prev,
        x: prev.x - dx / prev.zoom,
        y: prev.y + dy / prev.zoom
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchZoomDistanceStart(distance);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && touchStart.x !== null && touchStart.y !== null) {
      const dx = e.touches[0].clientX - touchStart.x;
      const dy = e.touches[0].clientY - touchStart.y;

      setCamera(prev => ({
        ...prev,
        x: prev.x - dx / prev.zoom,
        y: prev.y + dy / prev.zoom
      }));

      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2 && touchZoomDistanceStart !== null) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const zoomChange = distance - touchZoomDistanceStart;
      const zoomAmount = zoomChange * 0.005;
      const newZoom = Math.max(0.3, Math.min(camera.zoom + zoomAmount, 3));
      setCamera(prev => ({ ...prev, targetZoom: newZoom }));
    }
  };

  const handleTouchEnd = () => {
    setTouchStart({ x: null, y: null });
    setTouchZoomDistanceStart(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSpectator) return;

      let direction = { x: 0, y: 0 };
      const now = Date.now();
      if (now - lastMove < 50) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          direction = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
          direction = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
          direction = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
          direction = { x: 1, y: 0 };
          break;
        case 'Shift':
          if (!boostActive) {
            setBoostActive(true);
            onBoostStart();
          }
          break;
        default:
          return;
      }

      onMove(direction);
      setLastMove(now);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && boostActive) {
        setBoostActive(false);
        onBoostStop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onMove, onBoostStart, onBoostStop, boostActive, lastMove, isSpectator]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const renderFrame = () => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, windowSize.width, windowSize.height);
      ctx.save();

      const zoomDifference = camera.targetZoom - camera.zoom;
      camera.zoom += zoomDifference * 0.05;

      ctx.translate(windowSize.width / 2, windowSize.height / 2);
      ctx.scale(camera.zoom, camera.zoom);
      ctx.translate(-camera.x, -camera.y);

      const drawGrid = () => {
        const gridSize = 50;
        const offsetX = camera.x % gridSize;
        const offsetY = camera.y % gridSize;
        const gridColor = 'rgba(255, 255, 255, 0.05)';

        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1 / camera.zoom;

        for (let x = -windowSize.width / 2 / camera.zoom - offsetX; x < gameState.worldSize.width - camera.x + windowSize.width / 2 / camera.zoom; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, -windowSize.height / 2 / camera.zoom - offsetY);
          ctx.lineTo(x, gameState.worldSize.height - camera.y + windowSize.height / 2 / camera.zoom);
          ctx.stroke();
        }

        for (let y = -windowSize.height / 2 / camera.zoom - offsetY; y < gameState.worldSize.height - camera.y + windowSize.height / 2 / camera.zoom; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(-windowSize.width / 2 / camera.zoom - offsetX, y);
          ctx.lineTo(gameState.worldSize.width - camera.x + windowSize.width / 2 / camera.zoom, y);
          ctx.stroke();
        }
      };

      drawGrid();

      const drawPlayer = (player: any, isCurrentPlayer: boolean) => {
        if (!player.queue) return;

        const headSize = 20;
        const segmentSize = headSize * 0.9;

        ctx.fillStyle = player.color || 'white';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 4 / camera.zoom;

        const drawSegment = (x: number, y: number, index: number) => {
          const size = index === 0 ? headSize : segmentSize;
          const offset = (headSize - segmentSize) / 2;

          if (selectedPattern === 'snake') {
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
          } else if (selectedPattern === 'grub') {
            const grubWidth = size;
            const grubHeight = size * 0.75;
            ctx.beginPath();
            ctx.ellipse(x, y, grubWidth / 2, grubHeight / 2, 0, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
          } else if (selectedPattern === 'block') {
            const blockSize = size * 0.8;
            const blockOffset = (size - blockSize) / 2;
            ctx.fillRect(x - blockSize / 2, y - blockSize / 2, blockSize, blockSize);
            ctx.strokeRect(x - blockSize / 2, y - blockSize / 2, blockSize, blockSize);
          }
        };

        for (let i = 0; i < player.queue.length; i++) {
          const segment = player.queue[i];
          drawSegment(segment.x, segment.y, i);
        }

        if (isCurrentPlayer && !isSpectator) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.font = `bold ${16 / camera.zoom}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(player.pseudo || 'Grub', player.x, player.y - headSize);
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.font = `${14 / camera.zoom}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(player.pseudo || 'Grub', player.x, player.y - headSize);
        }
      };

      for (const id in gameState.players) {
        const player = gameState.players[id];
        if (player) {
          drawPlayer(player, id === playerId);
          if (playerId !== id && playerId) {
            onPlayerCollision(id);
          }
        }
      }

      const drawItem = (item: any) => {
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius || 5, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.font = `bold ${item.radius / 1.5}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.value.toString(), item.x, item.y);
      };

      if (gameState.items) {
        const itemsArray = Array.isArray(gameState.items) ? gameState.items : Object.values(gameState.items);
        itemsArray.forEach(item => {
          drawItem(item);
        });
      }

      ctx.restore();
      
      // Request the next animation frame
      requestAnimationFrame(renderFrame);
    };

    // Start the animation loop
    const animationId = requestAnimationFrame(renderFrame);
    
    // Clean up the animation frame when component unmounts
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [camera, windowSize, gameState, playerId, onPlayerCollision, isSpectator, selectedPattern]);

  return (
    <canvas
      ref={canvasRef}
      width={windowSize.width}
      height={windowSize.height}
      style={{ background: 'rgba(0, 0, 0, 0.8)', position: 'fixed', top: 0, left: 0, zIndex: 1 }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
};

export default GameCanvas;
