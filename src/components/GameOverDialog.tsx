
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface GameOverDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  onQuit: () => void;
  playerColor?: string;
}

const GameOverDialog = ({
  isOpen,
  onClose,
  onRetry,
  onQuit,
  playerColor = "#8B5CF6",
}: GameOverDialogProps) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  const calculateEyeOffset = () => {
    if (!isOpen) return { x: 0, y: 0 };
    
    const dialogX = window.innerWidth / 2;
    const dialogY = window.innerHeight / 2 - 50;
    
    const dx = mousePosition.x - dialogX;
    const dy = mousePosition.y - dialogY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return { x: 0, y: 0 };
    
    const maxPupilOffset = 2;
    return {
      x: (dx / distance) * maxPupilOffset,
      y: (dy / distance) * maxPupilOffset
    };
  };
  
  const eyeOffset = calculateEyeOffset();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-transparent border-0 shadow-none translate-y-28">
        <DialogHeader className="flex flex-col items-center">
          <div className="mb-4">
            {/* Character circle with eyes, similar to skin previews */}
            <div className="relative w-24 h-24 rounded-full" style={{ backgroundColor: playerColor, boxShadow: `0 0 20px ${playerColor}80` }}>
              {/* Grid lines for the character */}
              <div className="absolute inset-0 rounded-full opacity-30">
                <div className="absolute top-1/4 left-0 w-full h-px bg-white"></div>
                <div className="absolute top-2/4 left-0 w-full h-px bg-white"></div>
                <div className="absolute top-3/4 left-0 w-full h-px bg-white"></div>
                <div className="absolute left-1/4 top-0 h-full w-px bg-white"></div>
                <div className="absolute left-2/4 top-0 h-full w-px bg-white"></div>
                <div className="absolute left-3/4 top-0 h-full w-px bg-white"></div>
              </div>
              
              {/* Left eye */}
              <div className="absolute left-[calc(50%-7px)] top-[calc(50%-4px)] w-4 h-4 bg-white rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-200"></div>
                <div 
                  className="absolute w-2.5 h-2.5 bg-black rounded-full"
                  style={{ 
                    left: `${0.75 + eyeOffset.x}px`, 
                    top: `${0.75 + eyeOffset.y}px` 
                  }}
                />
                <div 
                  className="absolute w-1 h-1 bg-white rounded-full opacity-80"
                  style={{ 
                    left: `${0.25 + eyeOffset.x}px`, 
                    top: `${0.25 + eyeOffset.y}px` 
                  }}
                />
              </div>
              
              {/* Right eye */}
              <div className="absolute left-[calc(50%+3px)] top-[calc(50%-4px)] w-4 h-4 bg-white rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-200"></div>
                <div 
                  className="absolute w-2.5 h-2.5 bg-black rounded-full"
                  style={{ 
                    left: `${0.75 + eyeOffset.x}px`, 
                    top: `${0.75 + eyeOffset.y}px` 
                  }}
                />
                <div 
                  className="absolute w-1 h-1 bg-white rounded-full opacity-80"
                  style={{ 
                    left: `${0.25 + eyeOffset.x}px`, 
                    top: `${0.25 + eyeOffset.y}px` 
                  }}
                />
              </div>
            </div>
          </div>
          
          <DialogTitle className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            Vous avez perdu
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-center items-center gap-4 mt-4">
          <Button
            variant="outline"
            className="bg-black/50 hover:bg-black/70 text-white border-gray-600"
            onClick={onQuit}
          >
            Quitter
          </Button>
          <Button
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            onClick={onRetry}
          >
            Réessayer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameOverDialog;
