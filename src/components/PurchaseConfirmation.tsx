
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GameSkin } from "@/types/supabase";
import { ShieldAlert, CreditCard } from "lucide-react";

interface PurchaseConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  skin: GameSkin | null;
  isLoading: boolean;
}

const PurchaseConfirmation = ({
  isOpen,
  onClose,
  onConfirm,
  skin,
  isLoading,
}: PurchaseConfirmationProps) => {
  const [hasReadTerms, setHasReadTerms] = useState(false);

  const handleConfirm = () => {
    setHasReadTerms(false);
    onConfirm();
  };

  const handleClose = () => {
    setHasReadTerms(false);
    onClose();
  };

  if (!skin) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900 border border-gray-800 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-yellow-500" />
            Confirmer l'achat
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Vous êtes sur le point d'acheter le skin <span className="text-indigo-400 font-medium">{skin.name}</span> pour <span className="text-green-500 font-medium">{skin.price_eur ? `${skin.price_eur}€` : `${skin.price}€`}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm text-gray-300">
          <p>
            En achetant ce skin, vous acceptez expressément qu'il soit immédiatement disponible et renoncez à votre droit légal de rétractation. Aucun remboursement ne pourra être effectué. Si vous avez moins de 16 ans, vous devez obtenir l'accord de vos parents avant tout achat.
          </p>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <input 
            type="checkbox" 
            id="terms-checkbox" 
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-700 rounded"
            checked={hasReadTerms}
            onChange={(e) => setHasReadTerms(e.target.checked)}
          />
          <label htmlFor="terms-checkbox" className="text-sm text-gray-300">
            J'ai lu et j'accepte les conditions ci-dessus
          </label>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Annuler
          </Button>
          <Button
            type="button"
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            onClick={handleConfirm}
            disabled={!hasReadTerms || isLoading}
          >
            <CreditCard className="h-4 w-4" />
            Procéder au paiement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseConfirmation;
