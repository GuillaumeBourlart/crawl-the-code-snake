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
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function shadeColor(color: string, percent: number) {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = Math.floor((R * (100 + percent)) / 100);
  G = Math.floor((G * (100 + percent)) / 100);
  B = Math.floor((B * (100 + percent)) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  const RR = R.toString(16).length === 1 ? "0" + R.toString(16) : R.toString(16);
  const GG = G.toString(16).length === 1 ? "0" + G.toString(16) : G.toString(16);
  const BB = B.toString(16).length === 1 ? "0" + B.toString(16) : B.toString(16);

  return "#" + RR + GG + BB;
}

function darkenColor(color: string, percent: number) {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = Math.floor((R * (100 - percent)) / 100);
  G = Math.floor((G * (100 - percent)) / 100);
  B = Math.floor((B * (100 - percent)) / 100);

  R = R < 0 ? 0 : R;
  G = G < 0 ? 0 : G;
  B = B < 0 ? 0 : B;

  const RR = R.toString(16).length === 1 ? "0" + R.toString(16) : R.toString(16);
  const GG = G.toString(16).length === 1 ? "0" + G.toString(16) : G.toString(16);
  const BB = B.toString(16).length === 1 ? "0" + B.toString(16) : B.toString(16);

  return "#" + RR + GG + BB;
}

function adjustPinColor(color: string) {
  const rgb = hexToRgb(color);
  if (!rgb) return "rgba(255, 215, 0, 0.7)";
  const max = Math.max(rgb.r, rgb.g, rgb.b) / 255;
  const min = Math.min(rgb.r, rgb.g, rgb.b) / 255;
  const luminance = (max + min) / 2;
  return `rgba(${Math.min(255, rgb.r + 100)}, ${Math.min(255, Math.max(150, rgb.g + 50))}, 50, 0.7)`;
}

let _joystickDirection = { x: 0, y: 0 };
export const handleJoystickDirection = (direction: { x: number; y: number }) => {
  _joystickDirection = direction;
};

/**
 * Dessine un motif honeycomb (nid d'abeille) qui couvre toute la surface.
 * Ce motif ne sera pas transformé par la caméra.
 */
function drawHoneycombPattern(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cellSize: number
) {
  ctx.strokeStyle = "rgba(200, 100, 255, 0.25)";
  ctx.lineWidth = 2;
  ctx.shadowColor = "rgba(255, 255, 255, 0.2)";
  ctx.shadowBlur = 4;

  const hexWidth = cellSize;
  const hexHeight = Math.sqrt(3) * (cellSize / 2);

  const drawHexagon = (cx: number, cy: number) => {
    ctx.beginPath();
    for (let side = 0; side < 6; side++) {
      const angle = (Math.PI / 3) * side;
      const px = cx + hexWidth * 0.5 * Math.cos(angle);
      const py = cy + hexWidth * 0.5 * Math.sin(angle);
      side === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  };

  for (let y = 0; y < height + cellSize; y += hexHeight) {
    for (let x = 0; x < width + cellSize; x += hexWidth * 0.75) {
      const offset = ((Math.round(y / hexHeight)) % 2) * (hexWidth * 0.375);
      drawHexagon(x + offset, y);
    }
  }
  ctx.shadowBlur = 0;
}

const GameCanvas = ({
  gameState,
  playerId,
  onMove,
  onBoostStart,
  onBoostStop,
  onPlayerCollision,
}: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = useIsMobile();
  const [camera, setCamera] = useState({
    x: 0,
    y: 0,
    zoom: isMobile ? 0.7 : 1,
  });
  const requestRef = useRef<number>();
  const rendererStateRef = useRef({
    players: {} as Record<string, Player>,
    items: [] as GameItem[],
    gridNeedsUpdate: true,
    mousePosition: { x: 0, y: 0 },
    joystickDirection: { x: 0, y: 0 },
    boostParticles: [] as {
      x: number;
      y: number;
      size: number;
      alpha: number;
      vx: number;
      vy: number;
      color: string;
    }[],
  });
  const gridCacheCanvasRef = useRef<HTMLCanvasElement | null>(null);

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
    setCamera((prev) => ({
      ...prev,
      x: player.x,
      y: player.y,
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
      const worldX =
        (canvasX / canvas.width) * (canvas.width / camera.zoom) +
        camera.x -
        canvas.width / camera.zoom / 2;
      const worldY =
        (canvasY / canvas.height) * (canvas.height / camera.zoom) +
        camera.y -
        canvas.height / camera.zoom / 2;
      const dx = worldX - player.x;
      const dy = worldY - player.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > 0) {
        onMove({ x: dx / length, y: dy / length });
      }
    };
    const handleMouseDown = () => onBoostStart();
    const handleMouseUp = () => onBoostStop();
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
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
    return baseSize * (1 + queueCount * 0.1);
  };

  useEffect(() => {
    if (!playerId || !gameState.players[playerId]) return;
    const player = gameState.players[playerId];
    setCamera((prev) => ({
      ...prev,
      x: player.x,
      y: player.y,
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
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    if (!gridCacheCanvasRef.current) {
      gridCacheCanvasRef.current = document.createElement("canvas");
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
    window.addEventListener("resize", resizeCanvas);

    /**
     * Mise à jour du canvas cache (fond fixe : dégradé, vignette, honeycomb et bordures néon)
     */
    const updateGridCache = () => {
      const gridCanvas = gridCacheCanvasRef.current;
      if (!gridCanvas) return;
      const gridCtx = gridCanvas.getContext("2d", { alpha: false });
      if (!gridCtx) return;
      const width = gridCanvas.width;
      const height = gridCanvas.height;

      // Fond violet en dégradé
      const bgGradient = gridCtx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.max(width, height)
      );
      bgGradient.addColorStop(0, "#240046");
      bgGradient.addColorStop(0.5, "#3c096c");
      bgGradient.addColorStop(1, "#03001e");
      gridCtx.fillStyle = bgGradient;
      gridCtx.fillRect(0, 0, width, height);

      // Vignette
      const vignetteGradient = gridCtx.createRadialGradient(
        width / 2,
        height / 2,
        height * 0.5,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.9
      );
      vignetteGradient.addColorStop(0, "rgba(0,0,0,0)");
      vignetteGradient.addColorStop(0.7, "rgba(0,0,0,0.3)");
      vignetteGradient.addColorStop(1, "rgba(0,0,0,0.8)");
      gridCtx.fillStyle = vignetteGradient;
      gridCtx.fillRect(0, 0, width, height);

      // Motif honeycomb fixe
      drawHoneycombPattern(gridCtx, width, height, 40);

      // Bordures du canevas en néon (fixes, sans transformation)
      gridCtx.shadowColor = "#FF00FF";
      gridCtx.shadowBlur = 10;
      gridCtx.strokeStyle = "#FF00FF";
      gridCtx.lineWidth = 3;
      gridCtx.strokeRect(0, 0, width, height);
      gridCtx.shadowBlur = 0;

      rendererStateRef.current.gridNeedsUpdate = false;
    };

    const renderFrame = (timestamp: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const width = canvas.width;
      const height = canvas.height;

      // Dessin du fond fixe à partir du canvas cache (dégradé, vignette, honeycomb et bordures néon)
      if (rendererStateRef.current.gridNeedsUpdate && gridCacheCanvasRef.current) {
        updateGridCache();
      }
      if (gridCacheCanvasRef.current) {
        ctx.drawImage(gridCacheCanvasRef.current, 0, 0);
      }
      
      // Conserver une transformation pour dessiner les entités mobiles (joueurs, items, particules)
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(camera.zoom, camera.zoom);
      ctx.translate(-camera.x, -camera.y);

      const viewportLeft = camera.x - width / camera.zoom / 2 - 100;
      const viewportRight = camera.x + width / camera.zoom / 2 + 100;
      const viewportTop = camera.y - height / camera.zoom / 2 - 100;
      const viewportBottom = camera.y + height / camera.zoom / 2 + 100;

      // Particules de boost
      const boostParticles = rendererStateRef.current.boostParticles;
      for (let i = boostParticles.length - 1; i >= 0; i--) {
        const particle = boostParticles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.size *= 0.92;
        particle.alpha *= 0.92;
        if (particle.size < 0.5 || particle.alpha < 0.05) {
          boostParticles.splice(i, 1);
          continue;
        }
        if (
          particle.x >= viewportLeft &&
          particle.x <= viewportRight &&
          particle.y >= viewportTop &&
          particle.y <= viewportBottom
        ) {
          const particleGradient = ctx.createRadialGradient(
            particle.x,
            particle.y,
            0,
            particle.x,
            particle.y,
            particle.size
          );
          const alphaHex = Math.floor(particle.alpha * 255)
            .toString(16)
            .padStart(2, "0");
          particleGradient.addColorStop(0, `${particle.color}${alphaHex}`);
          particleGradient.addColorStop(1, `${particle.color}00`);
          ctx.fillStyle = particleGradient;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Rendu des items
      const visibleItems = rendererStateRef.current.items.filter(
        (item) =>
          item.x >= viewportLeft &&
          item.x <= viewportRight &&
          item.y >= viewportTop &&
          item.y <= viewportBottom
      );
      visibleItems.forEach((item) => {
        ctx.fillStyle = item.color || "#FFFFFF";
        ctx.beginPath();
        ctx.arc(item.x, item.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.beginPath();
        ctx.arc(item.x - 3, item.y - 3, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Rendu des joueurs
      Object.entries(rendererStateRef.current.players).forEach(([id, player]) => {
        const isCurrentPlayer = id === playerId;
        const currentPlayerSize = calculatePlayerSize(player);
        const baseColor = player.color || (isCurrentPlayer ? "#8B5CF6" : "#FFFFFF");
        if (player.queue && player.queue.length > 0) {
          const visibleQueue = player.queue.filter(
            (segment) =>
              segment.x >= viewportLeft &&
              segment.x <= viewportRight &&
              segment.y >= viewportTop &&
              segment.y <= viewportBottom
          );
          if (visibleQueue.length > 0) {
            [...visibleQueue].reverse().forEach((segment) => {
              const segmentGradient = ctx.createRadialGradient(
                segment.x,
                segment.y,
                0,
                segment.x,
                segment.y,
                currentPlayerSize / 2
              );
              segmentGradient.addColorStop(0, shadeColor(baseColor, 10));
              segmentGradient.addColorStop(1, baseColor);
              ctx.fillStyle = segmentGradient;
              ctx.beginPath();
              ctx.arc(segment.x, segment.y, currentPlayerSize / 2, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowColor = `${darkenColor(baseColor, 60)}40`;
              ctx.shadowBlur = 2;
              ctx.shadowOffsetX = 1;
              ctx.shadowOffsetY = 1;
              ctx.strokeStyle = darkenColor(baseColor, 30);
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(segment.x, segment.y, currentPlayerSize / 2, 0, Math.PI * 2);
              ctx.stroke();
              ctx.shadowColor = "transparent";
              ctx.shadowBlur = 0;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;
              if (player.boosting) {
                const time = Date.now() / 300;
                const pulseFactor = 0.2 * Math.sin(time + segment.x * 0.01) + 0.8;
                const glowGradient = ctx.createRadialGradient(
                  segment.x,
                  segment.y,
                  currentPlayerSize * 0.3,
                  segment.x,
                  segment.y,
                  currentPlayerSize * 0.8 * pulseFactor
                );
                glowGradient.addColorStop(0, `${baseColor}40`);
                glowGradient.addColorStop(0.5, `${baseColor}20`);
                glowGradient.addColorStop(1, `${baseColor}00`);
                ctx.fillStyle = glowGradient;
                ctx.beginPath();
                ctx.arc(segment.x, segment.y, currentPlayerSize * 0.8 * pulseFactor, 0, Math.PI * 2);
                ctx.fill();
              }
            });
          }
        }
        drawPlayerProcessor(ctx, player, isCurrentPlayer);
        if (
          player.x < viewportLeft ||
          player.x > viewportRight ||
          player.y < viewportTop ||
          player.y > viewportBottom
        ) {
          const dx = player.x - camera.x;
          const dy = player.y - camera.y;
          const angle = Math.atan2(dy, dx);
          const edgeRadius = (Math.min(canvas.width, canvas.height) / 2 / camera.zoom) * 0.9;
          const edgeX = camera.x + Math.cos(angle) * edgeRadius;
          const edgeY = camera.y + Math.sin(angle) * edgeRadius;
          ctx.save();
          ctx.translate(edgeX, edgeY);
          ctx.rotate(angle);
          const arrowSize = 15 / camera.zoom;
          ctx.fillStyle = player.color || "#FFFFFF";
          ctx.beginPath();
          ctx.moveTo(arrowSize, 0);
          ctx.lineTo(-arrowSize / 2, arrowSize / 2);
          ctx.lineTo(-arrowSize / 2, -arrowSize / 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1 / camera.zoom;
          ctx.stroke();
          const distanceText = Math.round(Math.sqrt(dx * dx + dy * dy));
          ctx.fillStyle = "#FFFFFF";
          ctx.font = `${12 / camera.zoom}px Arial`;
          ctx.textAlign = "center";
          ctx.fillText(`${distanceText}`, 0, arrowSize + 15 / camera.zoom);
          ctx.restore();
        }
        if (isCurrentPlayer) {
          ctx.fillStyle = "#FFFF00";
          ctx.font = "12px Arial";
          ctx.textAlign = "center";
          ctx.fillText(`You (${player.queue?.length || 0})`, player.x, player.y - calculatePlayerSize(player) - 15);
        } else {
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "12px Arial";
          ctx.textAlign = "center";
          ctx.fillText(`Player (${player.queue?.length || 0})`, player.x, player.y - calculatePlayerSize(player) - 15);
        }
      });
      ctx.restore();
      requestRef.current = requestAnimationFrame(renderFrame);
    };

    requestRef.current = requestAnimationFrame(renderFrame);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [camera, gameState, playerId, isMobile]);

  const drawPlayerProcessor = (
    ctx: CanvasRenderingContext2D | null,
    player: Player,
    isCurrentPlayer: boolean
  ) => {
    if (!ctx) return;
    const playerSize = calculatePlayerSize(player);
    const playerColor = player.color || (isCurrentPlayer ? "#8B5CF6" : "#FFFFFF");
    ctx.save();
    const chipSize = playerSize * 0.9;
    const cornerRadius = chipSize * 0.15;
    const gradient = ctx.createLinearGradient(
      player.x - chipSize / 2,
      player.y - chipSize / 2,
      player.x + chipSize / 2,
      player.y + chipSize / 2
    );
    gradient.addColorStop(0, playerColor);
    gradient.addColorStop(1, shadeColor(playerColor, -15));
    ctx.fillStyle = gradient;
    roundedRect(ctx, player.x - chipSize / 2, player.y - chipSize / 2, chipSize, chipSize, cornerRadius);
    const notchWidth = chipSize * 0.3;
    const notchHeight = chipSize * 0.08;
    ctx.fillStyle = darkenColor(playerColor, 40);
    ctx.beginPath();
    ctx.moveTo(player.x - notchWidth / 2, player.y - chipSize / 2);
    ctx.lineTo(player.x + notchWidth / 2, player.y - chipSize / 2);
    ctx.lineTo(player.x + notchWidth / 2, player.y - chipSize / 2 + notchHeight);
    ctx.lineTo(player.x, player.y - chipSize / 2 + notchHeight * 1.5);
    ctx.lineTo(player.x - notchWidth / 2, player.y - chipSize / 2 + notchHeight);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = darkenColor(playerColor, 30);
    ctx.lineWidth = 2;
    roundedRect(ctx, player.x - chipSize / 2, player.y - chipSize / 2, chipSize, chipSize, cornerRadius, true);
    ctx.strokeStyle = shadeColor(playerColor, 10);
    ctx.lineWidth = 1;
    roundedRect(ctx, player.x - chipSize / 2 + 3, player.y - chipSize / 2 + 3, chipSize - 6, chipSize - 6, cornerRadius / 1.5, true);
    const innerSize = chipSize * 0.65;
    const coreGradient = ctx.createRadialGradient(
      player.x,
      player.y,
      innerSize * 0.1,
      player.x,
      player.y,
      innerSize * 0.7
    );
    coreGradient.addColorStop(0, shadeColor(playerColor, 20));
    coreGradient.addColorStop(1, shadeColor(playerColor, -10));
    ctx.fillStyle = coreGradient;
    roundedRect(ctx, player.x - innerSize / 2, player.y - innerSize / 2, innerSize, innerSize, cornerRadius / 2);
    const linesCount = 3;
    const lineSpacing = innerSize / (linesCount + 1);
    for (let i = 1; i <= linesCount; i++) {
      ctx.beginPath();
      ctx.moveTo(player.x - innerSize / 2 + 5, player.y - innerSize / 2 + i * lineSpacing);
      ctx.lineTo(player.x + innerSize / 2 - 5, player.y - innerSize / 2 + i * lineSpacing);
      ctx.stroke();
    }
    for (let i = 1; i <= linesCount; i++) {
      ctx.beginPath();
      ctx.moveTo(player.x - innerSize / 2 + i * lineSpacing, player.y - innerSize / 2 + 5);
      ctx.lineTo(player.x - innerSize / 2 + i * lineSpacing, player.y + innerSize / 2 - 5);
      ctx.stroke();
    }
    const pinLength = playerSize * 0.25;
    const pinWidth = playerSize * 0.07;
    const pinGradient = ctx.createLinearGradient(
      player.x - chipSize / 2,
      player.y - chipSize / 2,
      player.x + chipSize / 2,
      player.y + chipSize / 2
    );
    pinGradient.addColorStop(0, shadeColor(playerColor, -20));
    pinGradient.addColorStop(1, darkenColor(playerColor, 30));
    ctx.fillStyle = pinGradient;
    const numberOfPins = 5;
    const pinSpacing = chipSize / (numberOfPins + 1);
    for (let i = 1; i <= numberOfPins; i++) {
      if (i === 2 || i === 4) continue;
      ctx.fillStyle = pinGradient;
      // Top pins
      ctx.fillRect(player.x - chipSize / 2 + i * pinSpacing - pinWidth / 2, player.y - chipSize / 2 - pinLength, pinWidth, pinLength);
      ctx.fillStyle = "#AAA";
      ctx.fillRect(player.x - chipSize / 2 + i * pinSpacing - pinWidth / 2 - 1, player.y - chipSize / 2 - pinLength, pinWidth + 2, 3);
      // Bottom pins
      ctx.fillStyle = pinGradient;
      ctx.fillRect(player.x - chipSize / 2 + i * pinSpacing - pinWidth / 2, player.y + chipSize / 2, pinWidth, pinLength);
      ctx.fillStyle = "#AAA";
      ctx.fillRect(player.x - chipSize / 2 + i * pinSpacing - pinWidth / 2 - 1, player.y + chipSize / 2 + pinLength - 3, pinWidth + 2, 3);
    }
    const sidePinCount = 3;
    const sidePinSpacing = chipSize / (sidePinCount + 1);
    for (let i = 1; i <= sidePinCount; i++) {
      ctx.fillStyle = pinGradient;
      // Left side
      ctx.fillRect(player.x - chipSize / 2 - pinLength, player.y - chipSize / 2 + i * sidePinSpacing - pinWidth / 2, pinLength, pinWidth);
      ctx.fillStyle = "#AAA";
      ctx.fillRect(player.x - chipSize / 2 - pinLength, player.y - chipSize / 2 + i * sidePinSpacing - pinWidth / 2 - 1, 3, pinWidth + 2);
      // Right side
      ctx.fillStyle = pinGradient;
      ctx.fillRect(player.x + chipSize / 2, player.y - chipSize / 2 + i * sidePinSpacing - pinWidth / 2, pinLength, pinWidth);
      ctx.fillStyle = "#AAA";
      ctx.fillRect(player.x + chipSize / 2 + pinLength - 3, player.y - chipSize / 2 + i * sidePinSpacing - pinWidth / 2 - 1, 3, pinWidth + 2);
    }
    const eyeSize = playerSize * 0.15;
    const eyeDistance = playerSize * 0.2;
    const eyeOffsetY = -playerSize * 0.05;
    const eyeGradient = ctx.createRadialGradient(
      player.x - eyeDistance,
      player.y + eyeOffsetY,
      eyeSize * 0.2,
      player.x - eyeDistance,
      player.y + eyeOffsetY,
      eyeSize
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
          const worldMouseX =
            (mousePos.x / canvasWidth) * (canvasWidth / camera.zoom) +
            camera.x -
            canvasWidth / camera.zoom / 2;
          const worldMouseY =
            (mousePos.y / canvasHeight) * (canvasHeight / camera.zoom) +
            camera.y -
            canvasHeight / camera.zoom / 2;
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
    const pupilGradientLeft = ctx.createRadialGradient(
      player.x - eyeDistance + pupilOffsetX,
      player.y + eyeOffsetY + pupilOffsetY,
      0,
      player.x - eyeDistance + pupilOffsetX,
      player.y + eyeOffsetY + pupilOffsetY,
      eyeSize * 0.6
    );
    pupilGradientLeft.addColorStop(0, "#444444");
    pupilGradientLeft.addColorStop(1, "#000000");
    ctx.fillStyle = pupilGradientLeft;
    ctx.beginPath();
    ctx.arc(player.x - eyeDistance + pupilOffsetX, player.y + eyeOffsetY + pupilOffsetY, eyeSize * 0.6, 0, Math.PI * 2);
    ctx.fill();
    const pupilGradientRight = ctx.createRadialGradient(
      player.x + eyeDistance + pupilOffsetX,
      player.y + eyeOffsetY + pupilOffsetY,
      0,
      player.x + eyeDistance + pupilOffsetX,
      player.y + eyeOffsetY + pupilOffsetY,
      eyeSize * 0.6
    );
    pupilGradientRight.addColorStop(0, "#444444");
    pupilGradientRight.addColorStop(1, "#000000");
    ctx.fillStyle = pupilGradientRight;
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
      const glowColor = playerColor;
      const glowRadius = playerSize * 0.9;
      const boostGradient = ctx.createRadialGradient(
        player.x,
        player.y,
        playerSize * 0.5,
        player.x,
        player.y,
        glowRadius
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

  function roundedRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    stroke = false
  ) {
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
    stroke ? context.stroke() : context.fill();
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{
        touchAction: "none",
        // Vous pouvez aussi définir une bordure CSS en complément
        border: "4px solid #FF00FF",
        boxShadow: "0 0 20px #FF00FF",
      }}
    />
  );
};

export default GameCanvas;
