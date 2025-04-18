import React from "react";

interface AnimatedArrowProps {
  className?: string;
  isClickable?: boolean;
}

const AnimatedArrow: React.FC<AnimatedArrowProps> = ({
  className = "",
  isClickable = false,
}) => {
  // Rayon des cercles
  const r = 15;
  // Pas centre‑à‑centre (20% de chevauchement)
  const STEP = r * 1.5;

  // Matrice 5×7 représentant la flèche "→"
  const arrowMatrix: number[][] = [
    [0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 1, 1],
    [0, 0, 0, 0, 0, 0, 1],
  ];

  const rows = arrowMatrix.length;
  const cols = arrowMatrix[0].length;

  const fillColor = isClickable ? "#ffffff" : "#555555";
  const totalDots = arrowMatrix.flat().filter((v) => v === 1).length;
  let dotIndex = 0;
  const getDelay = (idx: number) => `${(idx / totalDots) * 0.5}s`;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        viewBox={`0 0 ${cols * STEP} ${rows * STEP}`}
        className="w-full h-full"
      >
        {/* Groupe animé pour osciller */}
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0;10,0;0,0"
            dur="2s"
            repeatCount="indefinite"
          />
          {arrowMatrix.map((row, y) =>
            row.map((cell, x) => {
              if (cell === 0) return null;
              const cx = x * STEP + r;
              const cy = y * STEP + r;
              const key = `dot-${y}-${x}`;
              const delay = getDelay(dotIndex++);
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
                      ? "drop-shadow(0 2px 4px rgba(255,255,255,0.3))"
                      : "none",
                  }}
                />
              );
            })
          )}
        </g>
      </svg>
    </div>
  );
};

export default AnimatedArrow;
