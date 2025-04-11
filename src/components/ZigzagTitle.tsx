
import React from "react";

interface ZigzagTitleProps {
  className?: string;
}

const ZigzagTitle: React.FC<ZigzagTitleProps> = ({ className = "" }) => {
  // Configuration des couleurs des cercles avec de meilleures couleurs pour la visibilité
  const colors = ["#1EAEDB", "#8B5CF6", "#F97316", "#FFFFFF"];
  
  // Définir les propriétés de base pour tous les cercles avec une taille plus grande
  const baseCircleProps = {
    cx: 0,
    cy: 0,
    r: 12, // Augmentation de la taille des cercles
    fill: "currentColor"
  };
  
  // Fonction pour générer les cercles formant chaque lettre
  const generateLetter = (points: [number, number][], color: string, index: number) => {
    return (
      <g key={index} className="letter-group">
        {points.map((point, i) => (
          <circle
            key={`letter-${index}-circle-${i}`}
            {...baseCircleProps}
            cx={point[0]}
            cy={point[1]}
            fill={color}
            className="animate-pulse"
            style={{ 
              animationDelay: `${i * 0.1}s`,
              filter: "drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5))" // Ajout d'ombre pour meilleure visibilité
            }}
          />
        ))}
      </g>
    );
  };

  // Points pour chaque lettre (coordonnées [x, y] pour positionner les cercles) - réorganisés pour mieux former "ZIGZAG.IO"
  const letterCoordinates: [number, number][][] = [
    // 'Z'
    [[20, 10], [40, 10], [60, 10], [60, 25], [40, 40], [20, 40], [60, 40]],
    // 'I'
    [[80, 10], [80, 25], [80, 40]],
    // 'G'
    [[100, 10], [120, 10], [140, 10], [100, 25], [140, 25], [100, 40], [120, 40], [140, 40]],
    // 'Z'
    [[160, 10], [180, 10], [200, 10], [200, 25], [180, 40], [160, 40], [200, 40]],
    // 'A'
    [[220, 10], [240, 10], [220, 25], [240, 25], [260, 25], [220, 40], [260, 40]],
    // 'G'
    [[280, 10], [300, 10], [320, 10], [280, 25], [320, 25], [280, 40], [300, 40], [320, 40]],
    // '.'
    [[340, 40]],
    // 'I'
    [[360, 10], [360, 25], [360, 40]],
    // 'O'
    [[380, 10], [400, 10], [420, 10], [380, 25], [420, 25], [380, 40], [400, 40], [420, 40]]
  ];

  return (
    <div className={`flex justify-center ${className}`}>
      <svg 
        viewBox="0 0 440 60" 
        className="w-full max-w-sm md:max-w-lg" // Augmentation de la taille maximale
        style={{ 
          filter: "drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.5))" 
        }}
      >
        {letterCoordinates.map((letterPoints, index) => {
          const color = colors[index % colors.length];
          return generateLetter(letterPoints, color, index);
        })}
      </svg>
    </div>
  );
};

export default ZigzagTitle;
