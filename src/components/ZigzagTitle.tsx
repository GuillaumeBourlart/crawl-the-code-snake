import React from "react";

interface ZigzagTitleProps {
  className?: string;
}

const ZigzagTitle: React.FC<ZigzagTitleProps> = ({ className = "" }) => {
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

  // 4) Calcul de la largeur en px de chaque lettre (colonnes × STEP)
  const letterWidths = letters.map((ltr) => {
    const bmp = letterBitmaps[ltr];
    return (bmp?.[0].length || 5) * STEP;
  });

  // 5) Offsets cumulés
  const offsets: number[] = [];
  letterWidths.reduce((acc, w, i) => {
    offsets[i] = acc;
    return acc + w + LETTER_SPACING;
  }, 0);

  // Génère un <g> animé pour chaque lettre
  const renderLetter = (chr: string, color: string, offsetX: number) => {
    const bmp = letterBitmaps[chr];
    if (!bmp) return null;
    const rows = bmp.length;
    return (
      <g key={chr} transform={`translate(${offsetX},0)`}>
        {bmp.flatMap((row, rowIdx) =>
          row.map((cell, colIdx) => {
            if (cell === 0) return null;
            const delay = (rowIdx / (rows - 1)) * 0.5;
            return (
              <circle
                key={`${chr}-${rowIdx}-${colIdx}`}
                cx={colIdx * STEP}
                cy={rowIdx * STEP}
                r={r}
                fill={color}
                className="animate-pulse"
                style={{
                  animationDelay: `${delay}s`,
                  animationDuration: "2s",
                  animationIterationCount: "infinite",
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
    <div className={`flex justify-center items-center w-[80%] h-[80%] mx-auto ${className}`}>
      <svg
        viewBox={`0 0 ${
          offsets[offsets.length - 1] + letterWidths[letterWidths.length - 1]
        } ${STEP * 6}`}
        className="w-full h-full"
      >
        {letters.map((ltr, i) => {
          const color = colors[i % colors.length];
          return renderLetter(ltr, color, offsets[i]);
        })}
      </svg>
    </div>
  );
};

export default ZigzagTitle;
