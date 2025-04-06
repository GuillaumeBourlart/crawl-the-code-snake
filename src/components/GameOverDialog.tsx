
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
          <div className="flex items-center justify-center mb-2">
            <Cpu className="h-12 w-12 text-purple-400 animate-pulse mr-2" />
            <DialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              Connexion perdue!
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="py-4 text-center space-y-3">
          <p className="text-gray-300 text-lg font-semibold">
            Votre processeur a été déconnecté du réseau
          </p>
          <p className="text-gray-400">
            Un processeur rival a pris le dessus. Voulez-vous tenter de vous reconnecter?
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
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            onClick={onRetry}
          >
            Reconnexion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GameOverDialog;
