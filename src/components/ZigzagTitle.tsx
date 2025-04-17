import React from "react";

interface ZigzagTitleProps { className?: string; }
const ZigzagTitle: React.FC<ZigzagTitleProps> = ({ className = "" }) => {
  // 1) Rayon des cercles
  const r = 10000;
  // 2) Pas centre-à-centre ×5 (pour 20% de chevauchement)
  const STEP = r * 1.6; // 480 px

  // Bitmap 5×5 pour chaque caractère de “GRUBZ.IO”
  // 1 = on dessine un cercle, 0 = on ne dessine pas
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
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,1,0,0],
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

  const colors = ["#1EAEDB","#F97316","#8B5CF6","#FFFFFF"];

  // Pour un caractère, on parcours sa bitmap et on génère les <circle>
  const renderLetter = (chr: string, color: string, offsetX: number) => {
    const bmp = letterBitmaps[chr];
    if (!bmp) return null;

    return (
      <g key={chr} transform={`translate(${offsetX},0)`}>
        {bmp.flatMap((row, rowIdx) =>
          row.map((cell, colIdx) => {
            if (cell === 0) return null;
            return (
              <circle
                key={`${chr}-${rowIdx}-${colIdx}`}
                cx={colIdx * STEP}
                cy={rowIdx * STEP}
                r={r}
                fill={color}
              />
            );
          })
        )}
      </g>
    );
  };

  const letters = ["G","R","U","B","Z",".","I","O"];
  return (
    <svg
      viewBox={`0 0 ${letters.length * STEP * 6} ${STEP * 6}`}
      className={className}
    >
      {letters.map((ltr, i) => {
        const color = colors[i % colors.length];
        // on espace chaque lettre de STEP*6 px pour laisser l’œil respirer
        const offsetX = i * STEP * 6;
        return renderLetter(ltr, color, offsetX);
      })}
    </svg>
  );
};

export default ZigzagTitle;
