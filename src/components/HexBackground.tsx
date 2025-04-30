
import { useEffect, useRef } from 'react';

interface HexBackgroundProps {
  className?: string;
  paused?: boolean; // Ajout d'une prop pour mettre en pause les animations
}

const HexBackground = ({ className = "", paused = false }: HexBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    
    // Créer le canvas offscreen pour le cache
    offscreenCanvasRef.current = document.createElement('canvas');
    const offscreenCanvas = offscreenCanvasRef.current;
    const offscreenCtx = offscreenCanvas.getContext('2d', { alpha: true });
    if (!offscreenCtx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Redimensionner également le canvas offscreen
      if (offscreenCanvas) {
        offscreenCanvas.width = window.innerWidth;
        offscreenCanvas.height = window.innerHeight;
        
        // Dessiner la grille d'hexagones une seule fois dans le canvas offscreen
        drawHexagonGrid(offscreenCtx, offscreenCanvas.width, offscreenCanvas.height);
      }
    };
    
    // Fonction pour dessiner la grille d'hexagones statique sur le canvas offscreen
    const drawHexagonGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);
      
      // Fond noir simplifié
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);
      
      // Hexagones simplifiés
      const hexSize = 140;
      const hexHeight = hexSize * Math.sqrt(3);
      const hexWidth = hexSize * 2;
      
      const rows = Math.ceil(height / (hexHeight * 0.75)) + 2;
      const cols = Math.ceil(width / (hexWidth * 0.75)) + 2;
      
      ctx.lineWidth = 20; // Bordure plus simple
      
      for (let row = -2; row < rows; row++) {
        for (let col = -2; col < cols; col++) {
          const centerX = col * hexWidth * 0.75;
          const centerY = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);
          
          // Style simplifié - gris foncé
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = centerX + hexSize * Math.cos(angle);
            const y = centerY + hexSize * Math.sin(angle);
            
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.closePath();
          
          // Style de remplissage simplifié - gris foncé uni
          ctx.fillStyle = "#111111";
          ctx.fill();
          
          ctx.strokeStyle = '#000000';
          ctx.stroke();
        }
      }
    };

    const drawAnimatedElements = () => {
      if (!canvas || !offscreenCanvasRef.current) return;
      
      const width = canvas.width;
      const height = canvas.height;
      
      // Effacer le canvas principal
      ctx.clearRect(0, 0, width, height);
      
      // Dessiner le fond depuis le cache
      if (offscreenCanvasRef.current.width > 0 && offscreenCanvasRef.current.height > 0) {
        ctx.drawImage(offscreenCanvasRef.current, 0, 0);
      }
      
      // Effet de lueur centrale simplifié - seulement si non pausé
      if (!paused) {
        const centerGlow = ctx.createRadialGradient(
          width/2, height/2, 0,
          width/2, height/2, height * 0.4
        );
        centerGlow.addColorStop(0, 'rgba(30, 30, 50, 0.15)');
        centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = centerGlow;
        ctx.fillRect(0, 0, width, height);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Animation conditionnelle
    const animate = () => {
      drawAnimatedElements();
      if (!paused) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      }
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      
      // Nettoyer le canvas offscreen
      offscreenCanvasRef.current = null;
    };
  }, [paused]); // Dépendance à paused pour relancer l'effet si l'état change

  return (
    <canvas 
      ref={canvasRef} 
      className={`fixed inset-0 w-full h-full -z-10 ${className}`}
    />
  );
};

export default HexBackground;
