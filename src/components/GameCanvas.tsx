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
  queue?: Array<{ x: number; y: number; color?: string }>;
  boosting?: boolean;
  itemEatenCount?: number;
  skin_id?: number | null;
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
  isSpectator?: boolean;
}

const BASE_SIZE = 20;
const ITEMS_PER_SEGMENT    = 4;
const INITIAL_SEGMENTS     = 10;
const DEFAULT_ITEM_EATEN_COUNT = ITEMS_PER_SEGMENT * INITIAL_SEGMENTS;  // 40
const HEAD_GROWTH_FACTOR   = 0.02;
const BG_SRC = '/lovable-uploads/5f6bfbbf-3d4c-4583-b25e-7da5106d819b.png';

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

const getHeadRadius = (player: Player): number => {
  return BASE_SIZE / 2 + Math.max(0, (player.itemEatenCount || 0) - DEFAULT_ITEM_EATEN_COUNT) * HEAD_GROWTH_FACTOR;
};

const getSegmentRadius = (player: Player): number => {
  return BASE_SIZE / 2 + Math.max(0, (player.itemEatenCount || 0) - DEFAULT_ITEM_EATEN_COUNT) * HEAD_GROWTH_FACTOR;
};

const GameCanvas = ({ 
  gameState, 
  playerId, 
  onMove, 
  onBoostStart,
  onBoostStop,
  onPlayerCollision,
  isSpectator = false
}: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = useIsMobile();
  
  const initialZoom = isMobile ? 0.6 : 1.5;
  
  const [camera, setCamera] = useState({ 
    x: 0, 
    y: 0, 
    zoom: initialZoom
  });
  
  useEffect(() => {
    setCamera(prev => ({ 
      ...prev, 
      zoom: isMobile ? 0.6 : 1.5 
    }));
    console.log("Mobile status changed, setting zoom to:", isMobile ? 0.6 : 1.5);
  }, [isMobile]);
  
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>(0);
  const lastRenderTimeRef = useRef<number>(0);
  const gradientCacheRef = useRef<Record<string, CanvasGradient>>({});
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const backgroundPatternRef = useRef<CanvasPattern | null>(null);
  
  const rendererStateRef = useRef({
    players: {} as Record<string, Player>,
    items: [] as GameItem[],
    mousePosition: { x: 0, y: 0 },
    joystickDirection: { x: 0, y: 0 },
    boostParticles: [] as {x: number, y: number, size: number, alpha: number, vx: number, vy: number, color: string}[],
    itemAnimations: {} as Record<string, { 
      offsetX: number, 
      offsetY: number, 
      phaseX: number, 
      phaseY: number, 
      speedX: number, 
      speedY: number,
      radius: number,
      rotationSpeed: number,
      rotationAngle: number
    }>,
    detachedSegments: [] as {
      x: number, 
      y: number, 
      radius: number, 
      color: string, 
      zIndex: number
    }[]
  });
  
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
      y: player.y,
      zoom: prev.zoom
    }));
  }, [gameState, playerId]);
  
  useEffect(() => {
    if (!playerId) return;
    
    if (isSpectator) return;
    
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
  }, [gameState, playerId, onMove, onBoostStart, onBoostStop, camera, isSpectator]);
  
  useEffect(() => {
    if (!playerId || !gameState.players[playerId] || !onPlayerCollision || isSpectator) return;
    
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
  }, [gameState, playerId, onPlayerCollision, isSpectator]);
  
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
          speedY: 0.5 + Math.random() * 0.5,
          radius: 2 + Math.random() * 3,
          rotationSpeed: 0.5 + Math.random() * 1.5,
          rotationAngle: Math.random() * Math.PI * 2
        };
      }
    });
    
    Object.keys(rendererStateRef.current.itemAnimations).forEach(id => {
      if (!gameState.items?.find(item => item.id === id)) {
        delete rendererStateRef.current.itemAnimations[id];
      }
    });
    
    const detachedSegments: {
      x: number, 
      y: number, 
      radius: number, 
      color: string, 
      zIndex: number
    }[] = [];
    
    Object.entries(gameState.players).forEach(([id, player]) => {
      if (player.queue && player.queue.length > 0) {
        player.queue.forEach((segment, index) => {
          const radius = getSegmentRadius(player);
          const segmentColor = segment.color || player.color || '#8B5CF6';
          
          detachedSegments.push({
            x: segment.x,
            y: segment.y,
            radius,
            color: segmentColor,
            zIndex: player.queue!.length - index
          });
        });
      }
    });
    
    rendererStateRef.current.detachedSegments = detachedSegments;
    rendererStateRef.current.players = { ...gameState.players };
    rendererStateRef.current.items = gameState.items || [];
  }, [gameState]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    
    // Charger l'image de fond
    const backgroundImg = new Image();
    backgroundImg.src = BG_SRC;
    backgroundImg.onload = () => {
      backgroundImageRef.current = backgroundImg;
      backgroundPatternRef.current = ctx.createPattern(backgroundImg, 'repeat');
    };
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Fonction pour créer et mettre en cache un gradient radial
    const getOrCreateRadialGradient = (
      key: string,
      x0: number,
      y0: number,
      r0: number,
      x1: number,
      y1: number,
      r1: number,
      colorStops: Array<{ offset: number, color: string }>
    ): CanvasGradient => {
      if (!gradientCacheRef.current[key]) {
        const gradient = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
        colorStops.forEach(stop => {
          gradient.addColorStop(stop.offset, stop.color);
        });
        gradientCacheRef.current[key] = gradient;
      }
      return gradientCacheRef.current[key];
    };
    
    const renderFrame = (timestamp: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      
      if (!previousTimeRef.current) {
        console.log("Rendering first frame with camera zoom:", camera.zoom, "isMobile:", isMobile);
      }
      
      const width = canvas.width;
      const height = canvas.height;
      
      // Fond noir de base
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      
      // Appliquer le pattern d'image de fond si disponible
      if (backgroundPatternRef.current) {
        ctx.save();
        ctx.fillStyle = backgroundPatternRef.current;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
      
      // Effet de lumière centrale subtil
      const centerGlowKey = 'centerGlow';
      const centerGlow = getOrCreateRadialGradient(
        centerGlowKey,
        width/2, height/2, 0,
        width/2, height/2, height * 0.4,
        [
          { offset: 0, color: 'rgba(30, 30, 50, 0.1)' },
          { offset: 1, color: 'rgba(0, 0, 0, 0)' }
        ]
      );
      
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, width, height);
      
      ctx.save();
      
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(camera.zoom, camera.zoom);
      ctx.translate(-camera.x, -camera.y);
      
      // Dessiner les limites du monde de jeu
      const borderWidth = 4;
      const borderGlow = 15;
      
      ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
      ctx.shadowBlur = borderGlow;
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
      ctx.lineWidth = borderWidth + borderGlow;
      ctx.strokeRect(0, 0, gameState.worldSize.width, gameState.worldSize.height);
      
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(0, 0, gameState.worldSize.width, gameState.worldSize.height);
      
      const time = Date.now() * 0.001;
      const pulseIntensity = 0.5 + 0.5 * Math.sin(time);
      
      ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 * pulseIntensity})`;
      ctx.lineWidth = borderWidth + 10;
      ctx.strokeRect(0, 0, gameState.worldSize.width, gameState.worldSize.height);
      
      // Dessiner les segments du joueur
      const allSegments = [...rendererStateRef.current.detachedSegments];
      allSegments.sort((a, b) => a.zIndex - b.zIndex);
      
      allSegments.forEach(segment => {
        if (!segment.color) return;
        
        // Création et cache du gradient pour le segment
        const segmentGradientKey = `segment-${segment.color}-${segment.radius}`;
        const gradient = getOrCreateRadialGradient(
          segmentGradientKey,
          segment.x, segment.y, 0,
          segment.x, segment.y, segment.radius,
          [
            { offset: 0, color: segment.color },
            { offset: 1, color: shadeColor(segment.color, -15) }
          ]
        );
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(segment.x, segment.y, segment.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = shadeColor(segment.color, -30);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(segment.x, segment.y, segment.radius, 0, Math.PI * 2);
        ctx.stroke();
      });
      
      // Dessiner les items
      rendererStateRef.current.items.forEach(item => {
        const animation = rendererStateRef.current.itemAnimations[item.id];
        if (!animation || !item.color) return;
        
        const itemX = item.x + Math.sin(Date.now() * 0.001 * animation.speedX + animation.phaseX) * animation.radius * 1.15;
        const itemY = item.y + Math.cos(Date.now() * 0.001 * animation.speedY + animation.phaseY) * animation.radius * 1.15;
        
        animation.rotationAngle += animation.rotationSpeed * 0.01;
        
        const itemRadius = item.radius || 5;
        
        // Création et mise en cache des gradients pour les items
        const itemGradientKey = `item-${item.color}-${itemRadius}`;
        const itemGradient = getOrCreateRadialGradient(
          itemGradientKey,
          itemX, itemY, 0,
          itemX, itemY, itemRadius,
          [
            { offset: 0, color: item.color },
            { offset: 1, color: shadeColor(item.color, -20) }
          ]
        );
        
        ctx.fillStyle = itemGradient;
        ctx.beginPath();
        ctx.arc(itemX, itemY, itemRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Création et mise en cache des gradients pour le glow des items
        const glowGradientKey = `glow-${item.color}-${itemRadius}`;
        const glowGradient = getOrCreateRadialGradient(
          glowGradientKey,
          itemX, itemY, itemRadius * 0.5,
          itemX, itemY, itemRadius * 3,
          [
            { offset: 0, color: `${item.color}80` },
            { offset: 0.6, color: `${item.color}40` },
            { offset: 1, color: `${item.color}00` }
          ]
        );
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(itemX, itemY, itemRadius * 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = shadeColor(item.color, 30);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(itemX, itemY, itemRadius, 0, Math.PI * 2);
        ctx.stroke();
      });
      
      // Dessiner les têtes des joueurs
      Object.entries(rendererStateRef.current.players).forEach(([id, player]) => {
        if (player && player.color) {
          drawPlayerHead(player, id === playerId);
        }
      });
      
      ctx.restore();
      
      previousTimeRef.current = timestamp;
      requestRef.current = requestAnimationFrame(renderFrame);
    };
    
    requestRef.current = requestAnimationFrame(renderFrame);
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
      
      // Nettoyer le cache des gradients
      gradientCacheRef.current = {};
    };
  }, [gameState, camera, playerId, isMobile]);
  
  const drawPlayerHead = (player: Player, isCurrentPlayer: boolean) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    const headRadius = getHeadRadius(player);
    const playerColor = player.color || (isCurrentPlayer ? '#8B5CF6' : '#FFFFFF');
    
    let pupilOffsetX = 0;
    let pupilOffsetY = 0;
    
    let directionX = 0;
    let directionY = -1;
    
    if (player.direction) {
      directionX = player.direction.x;
      directionY = player.direction.y;
    } else if (player.queue && player.queue.length > 0) {
      const firstSegment = player.queue[0];
      const dx = player.x - firstSegment.x;
      const dy = player.y - firstSegment.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > 0) {
        directionX = dx / length;
        directionY = dy / length;
      }
    }
    
    const perpDirX = -directionY;
    const perpDirY = directionX;
    
    const eyeSize = headRadius * 0.5;
    const pupilSize = eyeSize * 0.6;
    const eyeDistance = eyeSize * 1.1;
    const eyeForwardOffset = headRadius * 0.30;
    
    ctx.save();
    
    const gradient = ctx.createRadialGradient(
      player.x, player.y, 0,
      player.x, player.y, headRadius
    );
    gradient.addColorStop(0, playerColor);
    gradient.addColorStop(1, shadeColor(playerColor, -15));
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(player.x, player.y, headRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = shadeColor(playerColor, -30);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, headRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    const leftEyeX = player.x + directionX * eyeForwardOffset - perpDirX * eyeDistance;
    const leftEyeY = player.y + directionY * eyeForwardOffset - perpDirY * eyeDistance;
    const rightEyeX = player.x + directionX * eyeForwardOffset + perpDirX * eyeDistance;
    const rightEyeY = player.y + directionY * eyeForwardOffset + perpDirY * eyeDistance;
    
    if (isCurrentPlayer) {
      if (isMobile) {
        const joystickDir = rendererStateRef.current.joystickDirection;
        if (joystickDir && (joystickDir.x !== 0 || joystickDir.y !== 0)) {
          const maxPupilOffset = eyeSize * 0.3;
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
            const maxPupilOffset = eyeSize * 0.3;
            pupilOffsetX = (dx / distance) * maxPupilOffset;
            pupilOffsetY = (dy / distance) * maxPupilOffset;
          }
        }
      }
    }
    
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = "#666666";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = "#666666";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
    ctx.stroke();
    
    if (player.boosting) {
      const pupilColor = "#ea384c";
      
      ctx.fillStyle = pupilColor;
      ctx.beginPath();
      ctx.moveTo(leftEyeX + pupilOffsetX - pupilSize, leftEyeY + pupilOffsetY - pupilSize/2);
      ctx.lineTo(leftEyeX + pupilOffsetX + pupilSize, leftEyeY + pupilOffsetY);
      ctx.lineTo(leftEyeX + pupilOffsetX - pupilSize, leftEyeY + pupilOffsetY + pupilSize/2);
      ctx.closePath();
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(rightEyeX + pupilOffsetX - pupilSize, rightEyeY + pupilOffsetY - pupilSize/2);
      ctx.lineTo(rightEyeX + pupilOffsetX + pupilSize, rightEyeY + pupilOffsetY);
      ctx.lineTo(rightEyeX + pupilOffsetX - pupilSize, rightEyeY + pupilOffsetY + pupilSize/2);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(leftEyeX + pupilOffsetX, leftEyeY + pupilOffsetY, pupilSize, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(rightEyeX + pupilOffsetX, rightEyeY + pupilOffsetY, pupilSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const highlightSize = eyeSize * 0.3;
    const highlightOffsetX = -pupilSize * 0.5;
    const highlightOffsetY = -pupilSize * 0.5;
    
    ctx.fillStyle = "#FFFFFF";
    
    ctx.beginPath();
    ctx.arc(
      leftEyeX + pupilOffsetX + highlightOffsetX, 
      leftEyeY + pupilOffsetY + highlightOffsetY, 
      highlightSize, 
      0, Math.PI * 2
    );
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(
      rightEyeX + pupilOffsetX + highlightOffsetX, 
      rightEyeY + pupilOffsetY + highlightOffsetY, 
      highlightSize, 
      0, Math.PI * 2
    );
    ctx.fill();
    
    if (player.boosting) {
      const glowColor = playerColor;
      
      const glowRadius = headRadius * 1.5;
      const boostGradient = ctx.createRadialGradient(
        player.x, player.y, headRadius,
        player.x, player.y, glowRadius
      );
      
      boostGradient.addColorStop(0, `${glowColor}40`);
      boostGradient.addColorStop(0.5, `${glowColor}20`);
      boostGradient.addColorStop(1, `${glowColor}00`);
      
      ctx.fillStyle = boostGradient;
      ctx.beginPath();
      ctx.arc(player.x, player.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  };
  
  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full touch-none"
    />
  );
};

export default GameCanvas;
