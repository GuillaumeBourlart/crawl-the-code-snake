
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCw, LogOut } from "lucide-react";

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
  playerColor = "#FF0000",
}: GameOverDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border border-gray-700 text-white max-w-md p-0 overflow-hidden">
        <div className="relative">
          <div 
            className="absolute top-0 left-0 w-full h-40 opacity-30"
            style={{ 
              background: `linear-gradient(180deg, ${playerColor}, transparent)`, 
              boxShadow: `0 0 40px ${playerColor}`
            }} 
          />
          
          <DialogHeader className="pt-10 px-6 relative z-10">
            <div className="flex justify-center mb-3">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center" 
                style={{ backgroundColor: playerColor }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-8 h-8"
                >
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
              </div>
            </div>
            <DialogTitle className="text-2xl md:text-3xl font-bold text-center">
              Partie terminée
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 pt-0 relative z-10">
            <p className="text-center text-gray-300 mb-6">
              Vous avez été éliminé. Voulez-vous recommencer une partie ?
            </p>
            
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 w-full">
              <Button 
                variant="outline" 
                onClick={onQuit}
                className="w-full md:w-auto bg-gray-800 hover:bg-gray-700 border-gray-700 text-white"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Quitter
              </Button>
              <Button 
                onClick={onRetry}
                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <RotateCw className="mr-2 h-4 w-4" />
                Réessayer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameOverDialog;
