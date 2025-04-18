// GlobalLeaderboardButton.tsx
import { useState, useLayoutEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import GlobalLeaderboardDialog from "./GlobalLeaderboardDialog";

export default function GlobalLeaderboardButton() {
  const [footerHeight, setFooterHeight] = useState(0);
  const footerRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    footerRef.current = document.querySelector("footer");
    if (!footerRef.current) return;

    // mesure initiale
    setFooterHeight(footerRef.current.getBoundingClientRect().height);

    // observe tout changement de hauteur
    const ro = new ResizeObserver(entries => {
      for (let e of entries) {
        setFooterHeight(e.contentRect.height);
      }
    });
    ro.observe(footerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      <Button
        variant="pill"
        size="pill"
        onClick={() => setOpen(true)}
        className="fixed left-4 z-50 p-2.5"
        style={{ bottom: footerHeight + 8 }} // 8px de marge
      >
        <Trophy className="h-5 w-5 text-yellow-400" />
      </Button>

      <GlobalLeaderboardDialog isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
