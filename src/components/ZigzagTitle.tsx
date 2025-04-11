
import React from "react";

interface ZigzagTitleProps {
  className?: string;
}

const ZigzagTitle: React.FC<ZigzagTitleProps> = ({ className = "" }) => {
  // Configuration des couleurs des cercles avec de meilleures couleurs pour la visibilité
  const colors = ["#1EAEDB", "#F97316", "#8B5CF6", "#FFFFFF"];
  
  // Définir les propriétés de base pour tous les cercles
  const baseCircleProps = {
    cx: 0,
    cy: 0,
    r: 8, // Taille des cercles
    fill: "currentColor"
  };
  
  // Fonction pour générer les cercles formant chaque lettre
  const generateLetter = (points: [number, number][], color: string, index: number) => {
    return (
      <g key={index} className="letter-group">
        {points.map((point, i) => {
          // Déterminer l'animation par ligne horizontale (basée sur la coordonnée Y)
          const animationDelay = `${point[1] % 100 * 0.02}s`;
          
          return (
            <circle
              key={`letter-${index}-circle-${i}`}
              {...baseCircleProps}
              cx={point[0]}
              cy={point[1]}
              fill={color}
              className="animate-pulse"
              style={{ 
                animationDelay: animationDelay,
                filter: "drop-shadow(0px 3px 5px rgba(0, 0, 0, 0.7))"
              }}
            />
          );
        })}
      </g>
    );
  };

  // Points pour chaque lettre (coordonnées [x, y]) avec beaucoup plus de cercles pour plus de précision
  const letterCoordinates: [number, number][][] = [
    // 'Z'
    [
      [30, 20], [40, 20], [50, 20], [60, 20], [70, 20], [80, 20], [90, 20], // ligne du haut
      [90, 30], [80, 40], [70, 50], [60, 60], [50, 70], [40, 80], // diagonale
      [30, 80], [40, 80], [50, 80], [60, 80], [70, 80], [80, 80], [90, 80]  // ligne du bas
    ],
    
    // 'I'
    [
      [120, 20], [120, 30], [120, 40], [120, 50], [120, 60], [120, 70], [120, 80], // pilier vertical
      [110, 20], [130, 20], [140, 20], // ligne du haut
      [110, 80], [130, 80], [140, 80]  // ligne du bas
    ],
    
    // 'G'
    [
      [170, 20], [180, 20], [190, 20], [200, 20], [210, 20], // arc supérieur
      [160, 30], [160, 40], [160, 50], [160, 60], [160, 70], // côté gauche
      [170, 80], [180, 80], [190, 80], [200, 80], [210, 80], // bas
      [210, 70], [210, 60], [210, 50], // côté droit
      [190, 50], [200, 50] // barre horizontale du milieu
    ],
    
    // 'Z' - Deuxième Z
    [
      [240, 20], [250, 20], [260, 20], [270, 20], [280, 20], [290, 20], [300, 20], // ligne du haut
      [300, 30], [290, 40], [280, 50], [270, 60], [260, 70], [250, 80], // diagonale
      [240, 80], [250, 80], [260, 80], [270, 80], [280, 80], [290, 80], [300, 80]  // ligne du bas
    ],
    
    // 'A'
    [
      [330, 80], [330, 70], [330, 60], [330, 50], [330, 40], [330, 30], // jambe gauche
      [340, 20], [350, 20], [360, 20], // sommet
      [370, 30], [370, 40], [370, 50], [370, 60], [370, 70], [370, 80], // jambe droite
      [340, 50], [350, 50], [360, 50] // barre horizontale
    ],
    
    // 'G' - Deuxième G
    [
      [400, 20], [410, 20], [420, 20], [430, 20], [440, 20], // arc supérieur
      [390, 30], [390, 40], [390, 50], [390, 60], [390, 70], // côté gauche
      [400, 80], [410, 80], [420, 80], [430, 80], [440, 80], // bas
      [440, 70], [440, 60], [440, 50], // côté droit
      [420, 50], [430, 50] // barre horizontale du milieu
    ],
    
    // '.'
    [
      [465, 80], [470, 80], [475, 80],
      [465, 75], [470, 75], [475, 75],
      [465, 70], [470, 70], [475, 70]
    ],
    
    // 'I'
    [
      [500, 20], [500, 30], [500, 40], [500, 50], [500, 60], [500, 70], [500, 80], // pilier vertical
      [490, 20], [510, 20], [520, 20], // ligne du haut
      [490, 80], [510, 80], [520, 80]  // ligne du bas
    ],
    
    // 'O'
    [
      [550, 20], [560, 20], [570, 20], [580, 20], // haut
      [540, 30], [540, 40], [540, 50], [540, 60], [540, 70], // gauche
      [550, 80], [560, 80], [570, 80], [580, 80], // bas
      [590, 30], [590, 40], [590, 50], [590, 60], [590, 70], // droite
      [590, 20], // complète le haut à droite
      [590, 80]  // complète le bas à droite
    ]
  ];

  return (
    <div className={`flex justify-center ${className}`}>
      <svg 
        viewBox="0 0 630 100" 
        className="w-full max-w-4xl mx-auto"
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
