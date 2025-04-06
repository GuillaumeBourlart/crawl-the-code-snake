
import React from "react";
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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <div className="relative w-12 h-12 mr-2">
              <div 
                className="w-10 h-10 rounded-full animate-pulse" 
                style={{ backgroundColor: playerColor }}
              />
              <div className="absolute left-1 top-2 w-3 h-3 bg-white rounded-full">
                <div className="absolute left-1 top-1 w-1 h-1 bg-black rounded-full"/>
              </div>
              <div className="absolute right-1 top-2 w-3 h-3 bg-white rounded-full">
                <div className="absolute left-1 top-1 w-1 h-1 bg-black rounded-full"/>
              </div>
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
