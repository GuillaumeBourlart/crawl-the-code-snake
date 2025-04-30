import React from "react";

interface ZigzagTitleProps {
  className?: string;
  paused?: boolean;  // Ajout prop pour désactiver l'animation
}

const ZigzagTitle: React.FC<ZigzagTitleProps> = ({ 
  className = "",
  paused = false
}) => {
  // 1) Rayon des cercles (gros titre)
  const r = 300;
  // 2) Pas centre‑à‑centre ×1.6 (20% de chevauchement)
  const STEP = r * 1.6; // 480 px
  // 3) Marge fixe entre lettres (en plus de leur propre largeur)
  const LETTER_SPACING = STEP * 0.5; // ajustable

  // Bitmap 5×5 (sauf "." à 3×5)
  const letterBitmaps: Record<string, number[][]> = {
    G: [
      [1,1,1,1,1],
      [1,0,0,0,0],
      [1,0,1,1,1],
      [1,0,0,0,1],
      [1,1,1,1,1],
    ],
    R: [
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,1,1,1,0],
      [1,0,1,0,0],
      [1,0,0,1,0],
    ],
    U: [
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,1],
    ],
    B: [
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,1,1,1,0],
    ],
    Z: [
      [1,1,1,1,1],
      [0,0,0,1,0],
      [0,0,1,0,0],
      [0,1,0,0,0],
      [1,1,1,1,1],
    ],
    ".": [
      [0,0,0],
      [0,0,0],
      [0,0,0],
      [0,0,0],
      [0,1,0],
    ],
    I: [
      [1,1,1,1,1],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [1,1,1,1,1],
    ],
    O: [
      [1,1,1,1,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,1],
    ],
  };

  const colors = ["#1EAEDB", "#F97316", "#8B5CF6", "#FFFFFF"];
  const letters = ["G", "R", "U", "B", "Z", ".", "I", "O"];

  // largeur de chaque lettre
  const letterWidths = letters.map(l =>
    (letterBitmaps[l]?.[0].length || 5) * STEP
  );
  // offsets cumulés
  const offsets: number[] = [];
  letterWidths.reduce((acc, w, i) => {
    offsets[i] = acc;
    return acc + w + LETTER_SPACING;
  }, 0);

  // calcule la taille brute du dessin sans marge
  const rawWidth = offsets[offsets.length - 1] + letterWidths[letterWidths.length - 1];
  const rawHeight = (letterBitmaps.G.length - 1) * STEP + r; // dernière ligne à (rows-1)*STEP + rayon

  // margins égales à r tout autour
  const vbX = -r;
  const vbY = -r;
  const vbW = rawWidth + 2 * r;
  const vbH = rawHeight + 2 * r;

  const renderLetter = (ltr: string, color: string, x: number) => {
    const bmp = letterBitmaps[ltr];
    return (
      <g key={ltr} transform={`translate(${x},0)`}>
        {bmp.flatMap((row, y) =>
          row.map((cell, x2) => {
            if (!cell) return null;
            const delay = (y / (bmp.length - 1)) * 0.5;
            return (
              <circle
                key={`${ltr}-${y}-${x2}`}
                cx={x2 * STEP}
                cy={y * STEP}
                r={r}
                fill={color}
                className={!paused ? "animate-pulse" : ""}
                style={!paused ? {
                  animationDelay: `${delay}s`,
                  animationDuration: "2s",
                  animationIterationCount: "infinite",
                  filter: "drop-shadow(0px 27px 45px rgba(0,0,0,0.7))",
                } : {
                  filter: "drop-shadow(0px 27px 45px rgba(0,0,0,0.7))",
                }}
              />
            );
          })
        )}
      </g>
    );
  };

  return (
    <div
      className={`flex items-center justify-center w-full h-full overflow-visible ${className}`}
    >
      <svg
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
      >
        {letters.map((ltr, i) =>
          renderLetter(ltr, colors[i % colors.length], offsets[i])
        )}
      </svg>
    </div>
  );
};

export default ZigzagTitle;
