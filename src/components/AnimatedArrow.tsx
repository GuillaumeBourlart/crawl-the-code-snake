
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
  const r = 18;
  // 2) Pas centre‑à‑centre (20% de chevauchement)
  const STEP = r * 1.5;

  // 3) Matrice 5×7 représentant la flèche "→"
  const arrowMatrix: number[][] = [
    [0,0,0,0,1,0,0],
    [0,0,0,0,0,1,0],
    [1,1,1,1,1,1,1],
    [0,0,0,0,0,1,0],
    [0,0,0,0,1,0,0],
  ];

  const rows = arrowMatrix.length;
  const cols = arrowMatrix[0].length;
  const fillColor = isClickable ? "#ffffff" : "#555555";

  // calcul du délai d'animation pour chaque point
  const totalDots = arrowMatrix.flat().filter((v) => v === 1).length;
  let dotIndex = 0;
  const getAnimationDelay = (idx: number) => `${(idx / totalDots) * 0.5}s`;

  // Calculate padding for the viewBox to ensure circles aren't cut off
  const padding = r * 1.2;

  return (
    <div className={`flex justify-center items-center w-full h-full mx-auto overflow-visible ${className}`}>
      <svg
        viewBox={`-${padding} -${padding} ${cols * STEP + padding * 2} ${rows * STEP + padding * 2}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {arrowMatrix.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            if (cell === 0) return null;
            const delay = getAnimationDelay(dotIndex++);
            return (
              <circle
                key={`dot-${rowIdx}-${colIdx}`}
                cx={colIdx * STEP + r}
                cy={rowIdx * STEP + r}
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
