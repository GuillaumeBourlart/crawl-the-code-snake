import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import GlobalLeaderboardDialog from "./GlobalLeaderboardDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/contexts/LanguageContext";

const GlobalLeaderboardButton = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);

  useEffect(() => {
    const updateFooterHeight = () => {
      const footer = document.querySelector("footer");
      if (footer) {
        setFooterHeight(footer.clientHeight);
      }
    };
    updateFooterHeight();
    window.addEventListener("resize", updateFooterHeight);
    return () => window.removeEventListener("resize", updateFooterHeight);
  }, []);

  return (
    <>
      <Button
        variant="pill"
        size="pill"
        onClick={() => setIsDialogOpen(true)}
        className="absolute left-4 z-50 p-2.5 h-auto w-auto"
        style={{ bottom: `${footerHeight + 8}px` }} // 8px de marge au‑dessus du footer
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
