
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import GlobalLeaderboardDialog from "./GlobalLeaderboardDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/contexts/LanguageContext";

const GlobalLeaderboardButton = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  const { t } = useLanguage();

  return (
    <>
      <Button
        variant="pill"
        size="pill"
        className={`fixed ${isMobile ? 'left-4 bottom-24' : 'left-4 bottom-20'} z-50 gap-2 animate-fade-in`}
        onClick={() => setIsDialogOpen(true)}
      >
        <Trophy className="h-5 w-5 text-yellow-400" />
        <span>{t("top_10_global")}</span>
      </Button>
      
      <GlobalLeaderboardDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
};

export default GlobalLeaderboardButton;
