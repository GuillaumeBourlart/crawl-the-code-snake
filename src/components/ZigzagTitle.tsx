
import React from "react";

interface ZigzagTitleProps {
  className?: string;
}

const ZigzagTitle: React.FC<ZigzagTitleProps> = ({ className = "" }) => {
  // Configuration des couleurs des cercles pour créer un effet visuel intéressant
  const colors = ["#9b87f5", "#7366ff", "#33C3F0", "#0FA0CE"];
  
  // Définir les propriétés de base pour tous les cercles
  const baseCircleProps = {
    cx: 0,
    cy: 0,
    r: 10,
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
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </g>
    );
  };

  // Points pour chaque lettre (coordonnées [x, y] pour positionner les cercles)
  const letterCoordinates = [
    // 'z'
    [[10, 10], [25, 10], [40, 10], [40, 25], [25, 40], [10, 40], [40, 40]],
    // 'i'
    [[60, 10], [60, 25], [60, 40]],
    // 'g'
    [[80, 10], [95, 10], [110, 10], [80, 25], [110, 25], [80, 40], [95, 40], [110, 40], [110, 55]],
    // 'z'
    [[130, 10], [145, 10], [160, 10], [160, 25], [145, 40], [130, 40], [160, 40]],
    // 'a'
    [[180, 10], [195, 10], [210, 10], [180, 25], [195, 25], [210, 25], [180, 40], [210, 40]],
    // 'g'
    [[230, 10], [245, 10], [260, 10], [230, 25], [260, 25], [230, 40], [245, 40], [260, 40], [260, 55]],
    // '.'
    [[280, 40]],
    // 'i'
    [[300, 10], [300, 25], [300, 40]],
    // 'o'
    [[320, 10], [335, 10], [350, 10], [320, 25], [350, 25], [320, 40], [335, 40], [350, 40]]
  ];

  return (
    <div className={`flex justify-center ${className}`}>
      <svg 
        viewBox="0 0 360 60" 
        className="w-full max-w-xs md:max-w-md"
        style={{ 
          filter: "drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.3))" 
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
