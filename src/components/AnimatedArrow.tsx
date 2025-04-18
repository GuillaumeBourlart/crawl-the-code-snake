import React from "react";

interface AnimatedArrowProps {
  className?: string;
  isClickable?: boolean;
}

const AnimatedArrow: React.FC<AnimatedArrowProps> = ({
  className = "",
  isClickable = false,
}) => {
  // 1) Rayon des cercles
  const r = 5;
  // 2) Pas centre‑à‑centre (20% de chevauchement)
  const STEP = r * 4; // ajustez pour modifier l'espacement

  // 3) Matrice 5×7 représentant la flèche "→"
  // 1 = point dessiné, 0 = rien
  const arrowMatrix: number[][] = [
    [0,0,0,0,1,0,0],
    [0,0,0,0,0,1,0],
    [1,1,1,1,1,1,1],
    [0,0,0,0,0,1,0],
    [0,0,0,0,1,0,0],
  ];

  const rows = arrowMatrix.length;
  const cols = arrowMatrix[0].length;

  // couleurs selon clicabilité
  const fillColor = isClickable ? "#ffffff" : "#555555";

  // génération du délai d'animation
  const getAnimationDelay = (index: number, total: number) =>
    `${(index / total) * 0.5}s`;

  // on aplatit la matrice et on crée les <circle>
  const totalDots = arrowMatrix.flat().filter(v => v === 1).length;
  let dotIndex = 0;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        viewBox={`0 0 ${cols * STEP} ${rows * STEP}`}
        className="w-full h-full"
      >
        {arrowMatrix.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            if (!cell) return null;
            const delay = getAnimationDelay(dotIndex, totalDots);
            const cx = colIdx * STEP + r;
            const cy = rowIdx * STEP + r;
            const key = `dot-${rowIdx}-${colIdx}`;
            dotIndex++;
            return (
              <circle
                key={key}
                cx={cx}
                cy={cy}
                r={r}
                fill={fillColor}
                className="animate-pulse"
                style={{
                  animationDelay: delay,
                  animationDuration: "1.5s",
                  animationIterationCount: "infinite",
                  filter: isClickable
                    ? "drop-shadow(0px 2px 4px rgba(255,255,255,0.3))"
                    : "none",
                }}
              />
            );
          })
        )}
      </svg>
    </div>
  );
};

export default AnimatedArrow;
