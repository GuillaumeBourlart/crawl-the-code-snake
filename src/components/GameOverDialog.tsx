
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
            <div className="relative w-12 h-12 mr-2">
              {/* Processor styled circle with circuit details */}
              <div 
                className="w-10 h-10 rounded-full"
                style={{ 
                  backgroundColor: playerColor,
                  boxShadow: `0 0 10px ${playerColor}80`
                }}
              />
              
              {/* Circuit lines */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-[1px]" 
                style={{ backgroundColor: `${playerColor}EE` }} />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-6" 
                style={{ backgroundColor: `${playerColor}EE` }} />
              
              {/* Small circuit details in corners */}
              <div className="absolute left-2 top-2 w-2 h-2 bg-transparent">
                <div className="absolute left-0 top-0 w-1 h-[2px]" 
                  style={{ backgroundColor: `${playerColor}EE` }} />
                <div className="absolute left-0 top-0 w-[2px] h-1" 
                  style={{ backgroundColor: `${playerColor}EE` }} />
              </div>
              <div className="absolute right-2 top-2 w-2 h-2 bg-transparent">
                <div className="absolute right-0 top-0 w-1 h-[2px]" 
                  style={{ backgroundColor: `${playerColor}EE` }} />
                <div className="absolute right-0 top-0 w-[2px] h-1" 
                  style={{ backgroundColor: `${playerColor}EE` }} />
              </div>
              <div className="absolute left-2 bottom-2 w-2 h-2 bg-transparent">
                <div className="absolute left-0 bottom-0 w-1 h-[2px]" 
                  style={{ backgroundColor: `${playerColor}EE` }} />
                <div className="absolute left-0 bottom-0 w-[2px] h-1" 
                  style={{ backgroundColor: `${playerColor}EE` }} />
              </div>
              <div className="absolute right-2 bottom-2 w-2 h-2 bg-transparent">
                <div className="absolute right-0 bottom-0 w-1 h-[2px]" 
                  style={{ backgroundColor: `${playerColor}EE` }} />
                <div className="absolute right-0 bottom-0 w-[2px] h-1" 
                  style={{ backgroundColor: `${playerColor}EE` }} />
              </div>
              
              {/* Eyes that follow mouse */}
              <div className="absolute left-1 top-2 w-3 h-3 bg-white rounded-full">
                <div 
                  className="absolute w-1.5 h-1.5 bg-black rounded-full"
                  style={{ 
                    left: `${1 + eyeOffset.x}px`, 
                    top: `${1 + eyeOffset.y}px` 
                  }}
                />
              </div>
              <div className="absolute right-1 top-2 w-3 h-3 bg-white rounded-full">
                <div 
                  className="absolute w-1.5 h-1.5 bg-black rounded-full"
                  style={{ 
                    left: `${1 + eyeOffset.x}px`, 
                    top: `${1 + eyeOffset.y}px` 
                  }}
                />
              </div>
              
              {/* Mouth */}
              <div className="absolute left-4 top-6 w-2 h-1 bg-red-500 rounded" />
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
