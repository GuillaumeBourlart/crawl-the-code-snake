
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
  
  // Calculate eye position based on mouse
  const calculateEyeOffset = () => {
    if (!isOpen) return { x: 0, y: 0 };
    
    // Get dialog position (approximated to center of screen)
    const dialogX = window.innerWidth / 2;
    const dialogY = window.innerHeight / 2 - 50; // Slightly above center
    
    // Get processor position within dialog
    const processorX = dialogX - 50;
    const processorY = dialogY;
    
    // Calculate direction to mouse
    const dx = mousePosition.x - processorX;
    const dy = mousePosition.y - processorY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return { x: 0, y: 0 };
    
    // Normalize and scale for pupil movement
    const maxPupilOffset = 2;
    return {
      x: (dx / distance) * maxPupilOffset,
      y: (dy / distance) * maxPupilOffset
    };
  };
  
  const eyeOffset = calculateEyeOffset();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <div className="relative w-16 h-16 mr-2">
              {/* Processor chip base */}
              <div 
                className="w-12 h-12 rounded-md absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ 
                  backgroundColor: playerColor,
                  boxShadow: `0 0 10px ${playerColor}80`
                }}
              />
              
              {/* Inner processor core */}
              <div 
                className="w-8 h-8 rounded-sm absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ 
                  backgroundColor: `${playerColor}DD`,
                }}
              />
              
              {/* Processor pins */}
              {/* Top pins */}
              <div className="absolute left-[calc(50%-12px)] top-0 w-1.5 h-3" style={{ backgroundColor: playerColor }} />
              <div className="absolute left-[calc(50%-4px)] top-0 w-1.5 h-3" style={{ backgroundColor: playerColor }} />
              <div className="absolute left-[calc(50%+4px)] top-0 w-1.5 h-3" style={{ backgroundColor: playerColor }} />

              {/* Bottom pins */}
              <div className="absolute left-[calc(50%-12px)] bottom-0 w-1.5 h-3" style={{ backgroundColor: playerColor }} />
              <div className="absolute left-[calc(50%-4px)] bottom-0 w-1.5 h-3" style={{ backgroundColor: playerColor }} />
              <div className="absolute left-[calc(50%+4px)] bottom-0 w-1.5 h-3" style={{ backgroundColor: playerColor }} />
              <div className="absolute left-[calc(50%+12px)] bottom-0 w-1.5 h-3" style={{ backgroundColor: playerColor }} />

              {/* Left pins */}
              <div className="absolute left-0 top-[calc(50%-8px)] h-1.5 w-3" style={{ backgroundColor: playerColor }} />
              <div className="absolute left-0 top-[calc(50%+8px)] h-1.5 w-3" style={{ backgroundColor: playerColor }} />

              {/* Right pins */}
              <div className="absolute right-0 top-[calc(50%-8px)] h-1.5 w-3" style={{ backgroundColor: playerColor }} />
              <div className="absolute right-0 top-[calc(50%+8px)] h-1.5 w-3" style={{ backgroundColor: playerColor }} />
              
              {/* Eyes */}
              <div className="absolute left-[calc(50%-6px)] top-[calc(50%-2px)] w-3 h-3 bg-white rounded-full">
                <div 
                  className="absolute w-2 h-2 bg-black rounded-full"
                  style={{ 
                    left: `${0.5 + eyeOffset.x}px`, 
                    top: `${0.5 + eyeOffset.y}px` 
                  }}
                />
              </div>
              <div className="absolute left-[calc(50%+3px)] top-[calc(50%-2px)] w-3 h-3 bg-white rounded-full">
                <div 
                  className="absolute w-2 h-2 bg-black rounded-full"
                  style={{ 
                    left: `${0.5 + eyeOffset.x}px`, 
                    top: `${0.5 + eyeOffset.y}px` 
                  }}
                />
              </div>
            </div>
            <DialogTitle className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              Vous avez perdu
            </DialogTitle>
          </div>
        </DialogHeader>
        <DialogFooter className="flex justify-center gap-4 sm:gap-6 mt-4">
          <Button
            variant="outline"
            className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GameOverDialog;
