
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LogOut, RefreshCw } from "lucide-react";

interface GameOverDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  onQuit: () => void;
  playerColor?: string;
}

const GameOverDialog = ({ isOpen, onClose, onRetry, onQuit, playerColor = "#8B5CF6" }: GameOverDialogProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setShowDialog(true);
      const timer = setTimeout(() => setOpen(true), 100);
      return () => clearTimeout(timer);
    } else {
      setOpen(false);
      const timer = setTimeout(() => setShowDialog(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  if (!showDialog) return null;
  
  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) onClose();
      setOpen(value);
    }}>
      <DialogContent className="bg-gray-800/95 border-gray-700 rounded-2xl p-8 shadow-2xl max-w-md w-[90%] md:w-full overflow-visible fixed top-[50%] left-[50%] transform -translate-x-[50%] -translate-y-[50%]">
        <DialogHeader className="mb-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative mb-2">
              <div 
                className="w-24 h-24 rounded-full relative flex items-center justify-center"
                style={{ 
                  backgroundColor: playerColor,
                  boxShadow: `0 0 20px 5px ${playerColor}40`
                }}
              >
                <div className="absolute w-full h-full rounded-full bg-white/10" />
                
                {/* Left eye */}
                <div className="absolute w-6 h-6 bg-white rounded-full" 
                  style={{ 
                    top: "30%", 
                    left: "50%", 
                    transform: "translateX(-8px)",
                    width: "12px",
                    height: "12px"
                  }}
                >
                  <div className="absolute w-3 h-3 bg-black rounded-full"
                    style={{ 
                      top: "50%", 
                      left: "50%", 
                      transform: "translate(-50%, -50%)",
                      width: "7px",
                      height: "7px"
                    }}
                  />
                </div>
                
                {/* Right eye */}
                <div className="absolute w-6 h-6 bg-white rounded-full" 
                  style={{ 
                    top: "30%", 
                    right: "50%", 
                    transform: "translateX(8px)",
                    width: "12px",
                    height: "12px"
                  }}
                >
                  <div className="absolute w-3 h-3 bg-black rounded-full"
                    style={{ 
                      top: "50%", 
                      left: "50%", 
                      transform: "translate(-50%, -50%)",
                      width: "7px",
                      height: "7px"
                    }}
                  />
                </div>
                
                {/* Dead X for left eye */}
                <div className="absolute" style={{ top: "30%", left: "50%", transform: "translateX(-8px)" }}>
                  <div className="relative w-7 h-7">
                    <div className="absolute bg-gray-800 h-1 w-7 top-3 left-0 transform rotate-45"></div>
                    <div className="absolute bg-gray-800 h-1 w-7 top-3 left-0 transform -rotate-45"></div>
                  </div>
                </div>
                
                {/* Dead X for right eye */}
                <div className="absolute" style={{ top: "30%", right: "50%", transform: "translateX(8px)" }}>
                  <div className="relative w-7 h-7">
                    <div className="absolute bg-gray-800 h-1 w-7 top-3 left-0 transform rotate-45"></div>
                    <div className="absolute bg-gray-800 h-1 w-7 top-3 left-0 transform -rotate-45"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogTitle className="text-3xl font-bold text-white">
              Game Over!
            </DialogTitle>
            
            <DialogDescription className="text-gray-300 text-lg">
              Vous avez été éliminé. Voulez-vous réessayer?
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row gap-4 pt-4 w-full">
          <Button 
            className="flex-1 py-6 text-lg rounded-xl bg-transparent hover:bg-transparent text-white opacity-80 hover:opacity-100" 
            onClick={onRetry}
            style={{
              backgroundColor: `${playerColor}20`,
              color: playerColor
            }}
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Réessayer
          </Button>
          
          <Button 
            className="flex-1 py-6 text-lg rounded-xl bg-transparent hover:bg-transparent text-white opacity-80 hover:opacity-100" 
            onClick={onQuit}
            style={{
              backgroundColor: "rgba(244, 67, 54, 0.2)",
              color: "#f44336"
            }}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Quitter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameOverDialog;
