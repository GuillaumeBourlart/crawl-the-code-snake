
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
}

const GameOverDialog = ({
  isOpen,
  onClose,
  onRetry,
  onQuit,
}: GameOverDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-red-500">
            Partie terminée!
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 text-center">
          <p className="text-gray-300 mb-2">
            Votre processeur a été compromis.
          </p>
          <p className="text-gray-400 text-sm">
            Voulez-vous réessayer ou quitter?
          </p>
        </div>
        <DialogFooter className="flex justify-center gap-4 sm:gap-6">
          <Button
            variant="outline"
            className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
            onClick={onQuit}
          >
            Quitter
          </Button>
          <Button
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
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
