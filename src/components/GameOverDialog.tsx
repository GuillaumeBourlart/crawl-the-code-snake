
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  
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
      <DialogContent className={`bg-transparent border-0 shadow-none ${isMobile ? 'translate-y-0' : 'translate-y-28'}`}>
        <DialogHeader className="flex flex-col items-center">
          <div className="mb-4">
            {/* Character circle with eyes, similar to skin previews */}
            <div className="relative w-24 h-24 rounded-full bg-white/5 backdrop-blur-sm p-1" style={{ 
              backgroundColor: "rgba(255, 255, 255, 0.1)", 
              borderRadius: "100%",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)"
            }}>
              <div className="relative w-full h-full rounded-full" style={{ backgroundColor: playerColor, boxShadow: `0 0 20px ${playerColor}80` }}>
                {/* Grid lines for the character */}
                <div className="absolute inset-0 rounded-full opacity-30">
                  <div className="absolute top-1/4 left-0 w-full h-px bg-white"></div>
                  <div className="absolute top-2/4 left-0 w-full h-px bg-white"></div>
                  <div className="absolute top-3/4 left-0 w-full h-px bg-white"></div>
                  <div className="absolute left-1/4 top-0 h-full w-px bg-white"></div>
                  <div className="absolute left-2/4 top-0 h-full w-px bg-white"></div>
                  <div className="absolute left-3/4 top-0 h-full w-px bg-white"></div>
                </div>
                
                {/* Left eye - Fixed size relative to head */}
                <div className="absolute left-[calc(50%-12px)] top-[calc(50%-8px)] w-6 h-6 bg-white rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-200"></div>
                  <div 
                    className="absolute w-4 h-4 bg-black rounded-full"
                    style={{ 
                      left: `${1 + eyeOffset.x}px`, 
                      top: `${1 + eyeOffset.y}px` 
                    }}
                  />
                  <div 
                    className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-80"
                    style={{ 
                      left: `${0.5 + eyeOffset.x}px`, 
                      top: `${0.5 + eyeOffset.y}px` 
                    }}
                  />
                </div>
                
                {/* Right eye - Fixed size relative to head */}
                <div className="absolute left-[calc(50%+6px)] top-[calc(50%-8px)] w-6 h-6 bg-white rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-200"></div>
                  <div 
                    className="absolute w-4 h-4 bg-black rounded-full"
                    style={{ 
                      left: `${1 + eyeOffset.x}px`, 
                      top: `${1 + eyeOffset.y}px` 
                    }}
                  />
                  <div 
                    className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-80"
                    style={{ 
                      left: `${0.5 + eyeOffset.x}px`, 
                      top: `${0.5 + eyeOffset.y}px` 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogTitle className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            {t("game_over")}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-center items-center gap-4 mt-4">
          <Button
            variant="ghost"
            className="bg-black/30 hover:bg-black/50 text-lg font-medium text-red-500 hover:text-red-400"
            onClick={onQuit}
          >
            {t("quit")}
          </Button>
          <Button
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-lg font-medium border-0"
            style={{ 
              background: `linear-gradient(to right, ${playerColor}, ${playerColor}cc)`,
              boxShadow: `0 4px 14px ${playerColor}50`
            }}
            onClick={onRetry}
          >
            {t("retry")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameOverDialog;
