
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
    r: 6,
    fill: "currentColor"
  };
  
  // Fonction pour générer les cercles formant chaque lettre
  const generateLetter = (points: [number, number][], color: string, index: number) => {
    return (
      <g key={index} className="letter-group">
        {points.map((point, i) => {
          // Utiliser la coordonnée Y pour créer un délai progressif vers le bas
          // Tous les cercles d'une même lettre auront le même type d'animation
          // Plus on descend dans la lettre, plus l'animation est décalée
          const yPosition = point[1];
          const yFactor = (yPosition - 20) / 60; // Normalize Y position (20-80) to get a factor between 0-1
          const animationDelay = `${yFactor * 0.5}s`; // Délai progressif basé sur la position verticale
          
          return (
            <circle
              key={`letter-${index}-circle-${i}`}
              {...baseCircleProps}
              cx={point[0]}
              cy={point[1]}
              fill={color}
              className="animate-pulse"
              style={{ 
                animationDelay,
                animationDuration: "2s",
                animationIterationCount: "infinite",
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
      [85, 25], [80, 30], [75, 35], [70, 40], [65, 45], [60, 50], [55, 55], [50, 60], [45, 65], [40, 70], [35, 75], // diagonale plus détaillée
      [30, 80], [40, 80], [50, 80], [60, 80], [70, 80], [80, 80], [90, 80]  // ligne du bas
    ],
    
    // 'I'
    [
      [120, 20], [120, 25], [120, 30], [120, 35], [120, 40], [120, 45], [120, 50], [120, 55], [120, 60], [120, 65], [120, 70], [120, 75], [120, 80], // pilier vertical plus détaillé
      [105, 20], [110, 20], [115, 20], [125, 20], [130, 20], [135, 20], // ligne du haut plus large
      [105, 80], [110, 80], [115, 80], [125, 80], [130, 80], [135, 80]  // ligne du bas plus large
    ],
    
    // 'G'
    [
      [165, 20], [170, 20], [175, 20], [180, 20], [185, 20], [190, 20], [195, 20], [200, 20], [205, 20], [210, 20], // arc supérieur plus détaillé
      [160, 25], [160, 30], [160, 35], [160, 40], [160, 45], [160, 50], [160, 55], [160, 60], [160, 65], [160, 70], [160, 75], // côté gauche plus détaillé
      [165, 80], [170, 80], [175, 80], [180, 80], [185, 80], [190, 80], [195, 80], [200, 80], [205, 80], [210, 80], // bas plus détaillé
      [210, 75], [210, 70], [210, 65], [210, 60], [210, 55], // côté droit plus détaillé
      [185, 50], [190, 50], [195, 50], [200, 50], [205, 50], [210, 50] // barre horizontale du milieu plus détaillée
    ],
    
    // 'Z' - Deuxième Z
    [
      [240, 20], [250, 20], [260, 20], [270, 20], [280, 20], [290, 20], [300, 20], // ligne du haut
      [295, 25], [290, 30], [285, 35], [280, 40], [275, 45], [270, 50], [265, 55], [260, 60], [255, 65], [250, 70], [245, 75], // diagonale plus détaillée
      [240, 80], [250, 80], [260, 80], [270, 80], [280, 80], [290, 80], [300, 80]  // ligne du bas
    ],
    
    // 'A'
    [
      [330, 80], [330, 75], [330, 70], [330, 65], [330, 60], [330, 55], [330, 50], [330, 45], [330, 40], [330, 35], [330, 30], [335, 25], // jambe gauche plus détaillée
      [340, 20], [345, 20], [350, 20], [355, 20], [360, 20], // sommet plus détaillé
      [365, 25], [370, 30], [370, 35], [370, 40], [370, 45], [370, 50], [370, 55], [370, 60], [370, 65], [370, 70], [370, 75], [370, 80], // jambe droite plus détaillée
      [335, 50], [340, 50], [345, 50], [350, 50], [355, 50], [360, 50], [365, 50] // barre horizontale plus détaillée
    ],
    
    // 'G' - Deuxième G
    [
      [395, 20], [400, 20], [405, 20], [410, 20], [415, 20], [420, 20], [425, 20], [430, 20], [435, 20], [440, 20], // arc supérieur plus détaillé
      [390, 25], [390, 30], [390, 35], [390, 40], [390, 45], [390, 50], [390, 55], [390, 60], [390, 65], [390, 70], [390, 75], // côté gauche plus détaillé
      [395, 80], [400, 80], [405, 80], [410, 80], [415, 80], [420, 80], [425, 80], [430, 80], [435, 80], [440, 80], // bas plus détaillé
      [440, 75], [440, 70], [440, 65], [440, 60], [440, 55], [440, 50], // côté droit plus détaillé
      [415, 50], [420, 50], [425, 50], [430, 50], [435, 50], [440, 50] // barre horizontale du milieu plus détaillée
    ],
    
    // '.'
    [
      [465, 80], [470, 80], [475, 80],
      [465, 75], [470, 75], [475, 75],
      [465, 70], [470, 70], [475, 70]
    ],
    
    // 'I'
    [
      [500, 20], [500, 25], [500, 30], [500, 35], [500, 40], [500, 45], [500, 50], [500, 55], [500, 60], [500, 65], [500, 70], [500, 75], [500, 80], // pilier vertical plus détaillé
      [485, 20], [490, 20], [495, 20], [505, 20], [510, 20], [515, 20], // ligne du haut plus large
      [485, 80], [490, 80], [495, 80], [505, 80], [510, 80], [515, 80]  // ligne du bas plus large
    ],
    
    // 'O'
    [
      [545, 20], [550, 20], [555, 20], [560, 20], [565, 20], [570, 20], [575, 20], [580, 20], [585, 20], // haut plus détaillé
      [540, 25], [540, 30], [540, 35], [540, 40], [540, 45], [540, 50], [540, 55], [540, 60], [540, 65], [540, 70], [540, 75], // gauche plus détaillé
      [545, 80], [550, 80], [555, 80], [560, 80], [565, 80], [570, 80], [575, 80], [580, 80], [585, 80], // bas plus détaillé
      [590, 25], [590, 30], [590, 35], [590, 40], [590, 45], [590, 50], [590, 55], [590, 60], [590, 65], [590, 70], [590, 75] // droite plus détaillée
    ]
  ];

  return (
    <div className={`flex justify-center ${className}`}>
      <svg 
        viewBox="0 0 630 100" 
        className="w-full max-w-5xl mx-auto" 
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
