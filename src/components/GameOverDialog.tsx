
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Cpu } from "lucide-react";

interface GameOverDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  onQuit: () => void;
  playerColor?: string; // Add this prop to receive the player's color
}

const GameOverDialog = ({
  isOpen,
  onClose,
  onRetry,
  onQuit,
  playerColor = "#8B5CF6", // Default to purple if no color is provided
}: GameOverDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <Cpu className={`h-12 w-12 animate-pulse mr-2`} style={{ color: playerColor }} />
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
