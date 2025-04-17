
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
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();
  
  if (!skin) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{t("purchase_confirmation")}</DialogTitle>
          <DialogDescription className="text-gray-300">
            {t("about_to_purchase")} <span className="text-indigo-400 font-medium">{skin.name}</span> {t("for")} {skin.price} €
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2 text-sm">
          <div className="bg-gray-800/60 p-3 rounded-md border border-gray-700/50">
            <p className="text-gray-200">
              {t("purchase_agreement")}
            </p>
          </div>
          
          <div className="bg-gray-800/60 p-3 rounded-md border border-gray-700/50">
            <p className="text-gray-200">
              {t("age_agreement")}
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-3 sm:gap-0">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onClose}
          >
            {t("cancel")}
          </Button>
          <Button
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
            onClick={() => onConfirm(skin)}
          >
            {t("continue_payment")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseConfirmationDialog;
