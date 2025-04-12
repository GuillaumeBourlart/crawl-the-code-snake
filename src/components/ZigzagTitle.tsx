
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
    r: 54, // Taille des cercles 9 fois plus grande (6 * 9 = 54)
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
          const yFactor = (yPosition - 180) / 540; // Normalize Y position (180-720) to get a factor between 0-1
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
                filter: "drop-shadow(0px 27px 45px rgba(0, 0, 0, 0.7))" // Shadow plus grand pour un titre plus grand
              }}
            />
          );
        })}
      </g>
    );
  };

  // Points pour chaque lettre (coordonnées [x, y]) multipliés par 9 pour les rendre 9 fois plus grandes
  const letterCoordinates: [number, number][][] = [
    // 'G'
    [
      [270, 180], [315, 180], [360, 180], [405, 180], [450, 180], [495, 180], [540, 180], [585, 180], [630, 180], // haut
      [225, 225], [225, 270], [225, 315], [225, 360], [225, 405], [225, 450], [225, 495], [225, 540], [225, 585], [225, 630], [225, 675], // gauche
      [270, 720], [315, 720], [360, 720], [405, 720], [450, 720], [495, 720], [540, 720], [585, 720], [630, 720], // bas
      [630, 675], [630, 630], [630, 585], // droite bas
      [495, 450], [540, 450], [585, 450], [630, 450] // barre horizontale
    ],
    
    // 'R'
    [
      [810, 180], [810, 225], [810, 270], [810, 315], [810, 360], [810, 405], [810, 450], [810, 495], [810, 540], [810, 585], [810, 630], [810, 675], [810, 720], // pilier vertical
      [855, 180], [900, 180], [945, 180], [990, 180], [1035, 180], // haut
      [1080, 225], [1080, 270], [1080, 315], [1080, 360], // droite haut
      [1035, 405], [990, 405], [945, 405], [900, 405], [855, 405], // milieu
      [900, 450], [945, 495], [990, 540], [1035, 585], [1080, 630], [1125, 675], [1170, 720] // jambe droite
    ],
    
    // 'U'
    [
      [1350, 180], [1350, 225], [1350, 270], [1350, 315], [1350, 360], [1350, 405], [1350, 450], [1350, 495], [1350, 540], [1350, 585], [1350, 630], [1350, 675], // gauche
      [1395, 720], [1440, 720], [1485, 720], [1530, 720], [1575, 720], [1620, 720], // bas
      [1665, 675], [1665, 630], [1665, 585], [1665, 540], [1665, 495], [1665, 450], [1665, 405], [1665, 360], [1665, 315], [1665, 270], [1665, 225], [1665, 180] // droite
    ],
    
    // 'B'
    [
      [1845, 180], [1845, 225], [1845, 270], [1845, 315], [1845, 360], [1845, 405], [1845, 450], [1845, 495], [1845, 540], [1845, 585], [1845, 630], [1845, 675], [1845, 720], // pilier
      [1890, 180], [1935, 180], [1980, 180], [2025, 180], [2070, 180], // haut
      [2115, 225], [2115, 270], [2115, 315], // droite haut
      [2070, 360], [2025, 360], [1980, 360], [1935, 360], [1890, 360], // milieu haut
      [1890, 450], [1935, 450], [1980, 450], [2025, 450], [2070, 450], // milieu bas
      [2115, 495], [2115, 540], [2115, 585], [2115, 630], // droite bas
      [2070, 675], [2025, 675], [1980, 675], [1935, 675], [1890, 675], // bas      
      [1890, 720], [1935, 720], [1980, 720], [2025, 720], [2070, 720] // bas ligne
    ],
    
    // 'Z'
    [
      [2295, 180], [2340, 180], [2385, 180], [2430, 180], [2475, 180], [2520, 180], [2565, 180], // ligne du haut
      [2520, 225], [2475, 270], [2430, 315], [2385, 360], [2340, 405], [2295, 450], [2250, 495], [2205, 540], [2160, 585], [2115, 630], [2070, 675], // diagonale
      [2070, 720], [2115, 720], [2160, 720], [2205, 720], [2250, 720], [2295, 720], [2340, 720]  // ligne du bas
    ],
    
    // '.'
    [
      [2520, 720], [2565, 720], [2610, 720],
      [2520, 675], [2565, 675], [2610, 675],
      [2520, 630], [2565, 630], [2610, 630]
    ],
    
    // 'I'
    [
      [2790, 180], [2790, 225], [2790, 270], [2790, 315], [2790, 360], [2790, 405], [2790, 450], [2790, 495], [2790, 540], [2790, 585], [2790, 630], [2790, 675], [2790, 720], // pilier
      [2700, 180], [2745, 180], [2835, 180], [2880, 180], // haut
      [2700, 720], [2745, 720], [2835, 720], [2880, 720]  // bas
    ],
    
    // 'O'
    [
      [3060, 180], [3105, 180], [3150, 180], [3195, 180], [3240, 180], [3285, 180], // haut
      [3015, 225], [3015, 270], [3015, 315], [3015, 360], [3015, 405], [3015, 450], [3015, 495], [3015, 540], [3015, 585], [3015, 630], [3015, 675], // gauche
      [3060, 720], [3105, 720], [3150, 720], [3195, 720], [3240, 720], [3285, 720], // bas
      [3330, 225], [3330, 270], [3330, 315], [3330, 360], [3330, 405], [3330, 450], [3330, 495], [3330, 540], [3330, 585], [3330, 630], [3330, 675] // droite
    ]
  ];

  return (
    <div className={`flex justify-center overflow-x-auto ${className}`}>
      <svg 
        viewBox="0 0 3600 900" 
        className="w-full max-w-[1600px] mx-auto" 
        style={{ 
          filter: "drop-shadow(0px 36px 72px rgba(0, 0, 0, 0.5))"
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
