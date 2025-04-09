
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
    const dialogY = window.innerHeight / 2 + 100;
    const processorX = dialogX - 50;
    const processorY = dialogY;
    
    const dx = mousePosition.x - processorX;
    const dy = mousePosition.y - processorY;
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
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <div className="relative w-16 h-16 mr-2">
              <div 
                className="w-12 h-12 rounded-md absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden"
                style={{ 
                  backgroundColor: playerColor,
                  boxShadow: `0 0 10px ${playerColor}80`,
                  borderWidth: "2px",
                  borderColor: `${playerColor}70`,
                  borderStyle: "solid"
                }}
              >
                <div 
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-4 h-1.5"
                  style={{ 
                    backgroundColor: `${playerColor}00`,
                    borderBottomLeftRadius: "4px",
                    borderBottomRightRadius: "4px",
                    borderLeft: `4px solid ${playerColor}40`,
                    borderRight: `4px solid ${playerColor}40`,
                    borderBottom: `4px solid ${playerColor}40`,
                  }}
                />
                
                <div className="absolute inset-1 opacity-30">
                  <div className="absolute top-1/4 left-0 w-full h-px bg-white" />
                  <div className="absolute top-2/4 left-0 w-full h-px bg-white" />
                  <div className="absolute top-3/4 left-0 w-full h-px bg-white" />
                  <div className="absolute left-1/4 top-0 h-full w-px bg-white" />
                  <div className="absolute left-2/4 top-0 h-full w-px bg-white" />
                  <div className="absolute left-3/4 top-0 h-full w-px bg-white" />
                </div>
              </div>
              
              <div 
                className="w-8 h-8 rounded-sm absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden"
                style={{ 
                  background: `linear-gradient(135deg, ${playerColor} 0%, ${playerColor}DD 100%)`,
                  boxShadow: "inset 0 0 5px rgba(0,0,0,0.3)",
                  borderWidth: "1px",
                  borderColor: `${playerColor}90`,
                  borderStyle: "solid"
                }}
              />
              
              <div className="absolute left-[calc(50%-12px)] top-0 w-1.5 h-3 flex flex-col">
                <div className="h-2.5" style={{ backgroundColor: playerColor }} />
                <div className="h-0.5 w-[7px] -ml-[1px] bg-gray-300" />
              </div>
              <div className="absolute left-[calc(50%-4px)] top-0 w-1.5 h-3 flex flex-col">
                <div className="h-2.5" style={{ backgroundColor: playerColor }} />
                <div className="h-0.5 w-[7px] -ml-[1px] bg-gray-300" />
              </div>
              <div className="absolute left-[calc(50%+4px)] top-0 w-1.5 h-3 flex flex-col">
                <div className="h-2.5" style={{ backgroundColor: playerColor }} />
                <div className="h-0.5 w-[7px] -ml-[1px] bg-gray-300" />
              </div>
              
              <div className="absolute left-[calc(50%-12px)] bottom-0 w-1.5 h-3 flex flex-col-reverse">
                <div className="h-2.5" style={{ backgroundColor: playerColor }} />
                <div className="h-0.5 w-[7px] -ml-[1px] bg-gray-300" />
              </div>
              <div className="absolute left-[calc(50%-4px)] bottom-0 w-1.5 h-3 flex flex-col-reverse">
                <div className="h-2.5" style={{ backgroundColor: playerColor }} />
                <div className="h-0.5 w-[7px] -ml-[1px] bg-gray-300" />
              </div>
              <div className="absolute left-[calc(50%+4px)] bottom-0 w-1.5 h-3 flex flex-col-reverse">
                <div className="h-2.5" style={{ backgroundColor: playerColor }} />
                <div className="h-0.5 w-[7px] -ml-[1px] bg-gray-300" />
              </div>
              <div className="absolute left-[calc(50%+12px)] bottom-0 w-1.5 h-3 flex flex-col-reverse">
                <div className="h-2.5" style={{ backgroundColor: playerColor }} />
                <div className="h-0.5 w-[7px] -ml-[1px] bg-gray-300" />
              </div>
              
              <div className="absolute left-0 top-[calc(50%-8px)] h-1.5 w-3 flex flex-row">
                <div className="w-2.5" style={{ backgroundColor: playerColor }} />
                <div className="w-0.5 h-[7px] -mt-[1px] bg-gray-300" />
              </div>
              <div className="absolute left-0 top-[calc(50%+8px)] h-1.5 w-3 flex flex-row">
                <div className="w-2.5" style={{ backgroundColor: playerColor }} />
                <div className="w-0.5 h-[7px] -mt-[1px] bg-gray-300" />
              </div>
              
              <div className="absolute right-0 top-[calc(50%-8px)] h-1.5 w-3 flex flex-row-reverse">
                <div className="w-2.5" style={{ backgroundColor: playerColor }} />
                <div className="w-0.5 h-[7px] -mt-[1px] bg-gray-300" />
              </div>
              <div className="absolute right-0 top-[calc(50%+8px)] h-1.5 w-3 flex flex-row-reverse">
                <div className="w-2.5" style={{ backgroundColor: playerColor }} />
                <div className="w-0.5 h-[7px] -mt-[1px] bg-gray-300" />
              </div>
              
              <div className="absolute left-[calc(50%-6px)] top-[calc(50%-2px)] w-3 h-3 bg-white rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-200" />
                <div 
                  className="absolute w-2 h-2 bg-black rounded-full"
                  style={{ 
                    left: `${0.5 + eyeOffset.x}px`, 
                    top: `${0.5 + eyeOffset.y}px` 
                  }}
                />
                <div 
                  className="absolute w-1 h-1 bg-white rounded-full opacity-80"
                  style={{ 
                    left: `${0.2 + eyeOffset.x}px`, 
                    top: `${0.2 + eyeOffset.y}px` 
                  }}
                />
              </div>
              <div className="absolute left-[calc(50%+3px)] top-[calc(50%-2px)] w-3 h-3 bg-white rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-200" />
                <div 
                  className="absolute w-2 h-2 bg-black rounded-full"
                  style={{ 
                    left: `${0.5 + eyeOffset.x}px`, 
                    top: `${0.5 + eyeOffset.y}px` 
                  }}
                />
                <div 
                  className="absolute w-1 h-1 bg-white rounded-full opacity-80"
                  style={{ 
                    left: `${0.2 + eyeOffset.x}px`, 
                    top: `${0.2 + eyeOffset.y}px` 
                  }}
                />
              </div>
            </div>
            <DialogTitle className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              Vous avez perdu
            </DialogTitle>
          </div>
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
