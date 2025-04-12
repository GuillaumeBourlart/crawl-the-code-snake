
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GameSkin } from "@/types/supabase";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PurchaseConfirmationProps {
  skin: GameSkin | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (skin: GameSkin) => Promise<void>;
}

const PurchaseConfirmation = ({
  skin,
  isOpen,
  onClose,
  onConfirm,
}: PurchaseConfirmationProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    if (!skin) return;
    
    setIsProcessing(true);
    try {
      await onConfirm(skin);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!skin) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-blue-500/30 text-white">
        <DialogHeader>
          <DialogTitle>Confirmer l'achat</DialogTitle>
          <DialogDescription className="text-gray-300">
            Vous êtes sur le point d'acheter le skin <span className="text-indigo-400 font-semibold">{skin.name}</span> pour <span className="text-indigo-400 font-semibold">{skin.price_eur}€</span>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-2">
          <p className="text-sm bg-blue-900/30 p-3 rounded border border-blue-500/30">
            En achetant ce skin, vous acceptez expressément qu'il soit immédiatement disponible et renoncez à votre droit légal de rétractation. Aucun remboursement ne pourra être effectué. Si vous avez moins de 16 ans, vous devez obtenir l'accord de vos parents avant tout achat.
          </p>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-blue-500/30 text-white"
            disabled={isProcessing}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isProcessing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              "Confirmer l'achat"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseConfirmation;
