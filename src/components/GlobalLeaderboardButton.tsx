
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import GlobalLeaderboardDialog from "./GlobalLeaderboardDialog";

const GlobalLeaderboardButton = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant="pill"
        size="pill"
        className="fixed left-4 bottom-4 z-50 gap-2 animate-fade-in"
        onClick={() => setIsDialogOpen(true)}
      >
        <Trophy className="h-5 w-5 text-yellow-400" />
        <span>Top 10</span>
      </Button>
      
      <GlobalLeaderboardDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
};

export default GlobalLeaderboardButton;
