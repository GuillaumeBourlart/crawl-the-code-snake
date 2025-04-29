
// GlobalLeaderboardButton.tsx
import { useState, useLayoutEffect, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import GlobalLeaderboardDialog from "./GlobalLeaderboardDialog";

export default function GlobalLeaderboardButton() {
  const [footerHeight, setFooterHeight] = useState(0);
  const footerRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  
  // Utiliser ResizeObserver pour surveiller les changements de hauteur du footer
  useEffect(() => {
    footerRef.current = document.querySelector("footer");
    if (!footerRef.current) return;
    
    // Mesure initiale
    setFooterHeight(footerRef.current.getBoundingClientRect().height);
    
    // Observer les changements de taille
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setFooterHeight(entry.contentRect.height);
      }
    });
    
    resizeObserver.observe(footerRef.current);
    
    // Nettoyer l'observer
    return () => resizeObserver.disconnect();
  }, []);
  
  return (
    <>
      <Button
        variant="pill"
        size="pill"
        onClick={() => setOpen(true)}
        className="fixed left-2.5 z-50 p-2.5 bg-indigo-600 hover:bg-indigo-500 shadow-lg"
        style={{ 
          bottom: `calc(${footerHeight}px + 10px)`,
          transition: "bottom 0.3s ease-in-out"
        }}
      >
        <Trophy className="h-5 w-5 text-yellow-400" />
      </Button>

      <GlobalLeaderboardDialog isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
