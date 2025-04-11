
import React from "react";

interface ZigzagTitleProps {
  className?: string;
}

const ZigzagTitle: React.FC<ZigzagTitleProps> = ({ className = "" }) => {
  // Configuration des couleurs des cercles avec de meilleures couleurs pour la visibilité
  const colors = ["#1EAEDB", "#F97316", "#8B5CF6", "#FFFFFF"];
  
  // Définir les propriétés de base pour tous les cercles avec une taille plus grande
  const baseCircleProps = {
    cx: 0,
    cy: 0,
    r: 15, // Augmentation de la taille des cercles pour meilleure visibilité
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
              filter: "drop-shadow(0px 3px 5px rgba(0, 0, 0, 0.7))" // Ombre plus prononcée
            }}
          />
        ))}
      </g>
    );
  };

  // Points pour chaque lettre (coordonnées [x, y] pour positionner les cercles) - réorganisés et espacés
  const letterCoordinates: [number, number][][] = [
    // 'Z'
    [[30, 20], [50, 20], [70, 20], [70, 40], [50, 60], [30, 60], [70, 60]],
    // 'I'
    [[100, 20], [100, 40], [100, 60]],
    // 'G'
    [[130, 20], [150, 20], [170, 20], [130, 40], [130, 60], [150, 60], [170, 60], [170, 40]],
    // 'Z'
    [[200, 20], [220, 20], [240, 20], [240, 40], [220, 60], [200, 60], [240, 60]],
    // 'A'
    [[270, 20], [290, 20], [270, 40], [290, 40], [310, 40], [270, 60], [310, 60]],
    // 'G'
    [[340, 20], [360, 20], [380, 20], [340, 40], [340, 60], [360, 60], [380, 60], [380, 40]],
    // '.'
    [[410, 60]],
    // 'I'
    [[440, 20], [440, 40], [440, 60]],
    // 'O'
    [[470, 20], [490, 20], [510, 20], [470, 40], [510, 40], [470, 60], [490, 60], [510, 60]]
  ];

  return (
    <div className={`flex justify-center ${className}`}>
      <svg 
        viewBox="0 0 540 80" 
        className="w-full max-w-xl mx-auto"
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
