
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GameSkin } from "@/types/supabase";

interface PurchaseConfirmationDialogProps {
  skin: GameSkin | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (skin: GameSkin) => void;
}

const PurchaseConfirmationDialog = ({
  skin,
  isOpen,
  onClose,
  onConfirm,
}: PurchaseConfirmationDialogProps) => {
  if (!skin) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Confirmation d'achat</DialogTitle>
          <DialogDescription className="text-gray-300">
            Vous êtes sur le point d'acheter le skin <span className="text-indigo-400 font-medium">{skin.name}</span> pour {skin.price} €
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2 text-sm">
          <div className="bg-gray-800/60 p-3 rounded-md border border-gray-700/50">
            <p className="text-gray-200">
              En achetant ce skin, vous acceptez expressément qu'il soit immédiatement disponible et renoncez à votre droit légal de rétractation. Aucun remboursement ne pourra être effectué.
            </p>
          </div>
          
          <div className="bg-gray-800/60 p-3 rounded-md border border-gray-700/50">
            <p className="text-gray-200">
              Si vous avez moins de 16 ans, vous devez obtenir l'accord d'un parent avant d'effectuer tout achat sur notre site.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-3 sm:gap-0">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onClose}
          >
            Annuler
          </Button>
          <Button
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
            onClick={() => onConfirm(skin)}
          >
            Continuer le paiement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseConfirmationDialog;
