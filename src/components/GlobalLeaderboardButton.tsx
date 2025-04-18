
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
        className="fixed left-[10px] bottom-[calc(var(--footer-height)+10px)] z-50 p-2.5 h-auto w-auto"
        onClick={() => setIsDialogOpen(true)}
      >
        <Trophy className="h-5 w-5 text-yellow-400" />
      </Button>
      
      <GlobalLeaderboardDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
};

export default GlobalLeaderboardButton;
