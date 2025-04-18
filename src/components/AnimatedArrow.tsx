import React from "react";

interface AnimatedArrowProps {
  className?: string;
  isClickable?: boolean;
}

const AnimatedArrow: React.FC<AnimatedArrowProps> = ({
  className = "",
  isClickable = false,
}) => {
  // 1) Rayon des cercles un peu plus gros
  const r = 5;
  // 2) Espacement horizontal entre points
  const STEP = 20;

  // couleur selon clicabilité
  const fillColor = isClickable ? "#ffffff" : "#555555";

  // animation delay
  const getAnimationDelay = (index: number, total: number) =>
    `${(index / total) * 0.5}s`;

  // génère la forme de la flèche
  const generateArrowPoints = () => {
    // Corps de la flèche : une ligne de points
    const mainLinePoints: [number, number][] = [];
    for (let x = 10; x <= 130; x += STEP) {
      mainLinePoints.push([x, 50]);
    }

    // Pointe triangulaire
    const arrowHeadPoints: [number, number][] = [
      [150, 50], // pointe centrale
      [140, 40], // haut gauche
      [140, 60], // bas gauche
      [130, 50], // base gauche
    ];

    const allPoints = [...mainLinePoints, ...arrowHeadPoints];

    return allPoints.map((point, i) => (
      <circle
        key={i}
        cx={point[0]}
        cy={point[1]}
        r={r}
        fill={fillColor}
        className="animate-pulse"
        style={{
          animationDelay: getAnimationDelay(i, allPoints.length),
          animationDuration: "1.5s",
          animationIterationCount: "infinite",
          filter: isClickable
            ? "drop-shadow(0px 2px 4px rgba(255,255,255,0.3))"
            : "none",
        }}
      />
    ));
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 180 100" className="w-full h-full">
        {generateArrowPoints()}
      </svg>
    </div>
  );
};

export default AnimatedArrow;
