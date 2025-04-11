
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
    // 'Z'
    [
      [270, 180], [360, 180], [450, 180], [540, 180], [630, 180], [720, 180], [810, 180], // ligne du haut
      [765, 225], [720, 270], [675, 315], [630, 360], [585, 405], [540, 450], [495, 495], [450, 540], [405, 585], [360, 630], [315, 675], // diagonale plus détaillée
      [270, 720], [360, 720], [450, 720], [540, 720], [630, 720], [720, 720], [810, 720]  // ligne du bas
    ],
    
    // 'I'
    [
      [1080, 180], [1080, 225], [1080, 270], [1080, 315], [1080, 360], [1080, 405], [1080, 450], [1080, 495], [1080, 540], [1080, 585], [1080, 630], [1080, 675], [1080, 720], // pilier vertical plus détaillé
      [945, 180], [990, 180], [1035, 180], [1125, 180], [1170, 180], [1215, 180], // ligne du haut plus large
      [945, 720], [990, 720], [1035, 720], [1125, 720], [1170, 720], [1215, 720]  // ligne du bas plus large
    ],
    
    // 'G'
    [
      [1485, 180], [1530, 180], [1575, 180], [1620, 180], [1665, 180], [1710, 180], [1755, 180], [1800, 180], [1845, 180], [1890, 180], // arc supérieur plus détaillé
      [1440, 225], [1440, 270], [1440, 315], [1440, 360], [1440, 405], [1440, 450], [1440, 495], [1440, 540], [1440, 585], [1440, 630], [1440, 675], // côté gauche plus détaillé
      [1485, 720], [1530, 720], [1575, 720], [1620, 720], [1665, 720], [1710, 720], [1755, 720], [1800, 720], [1845, 720], [1890, 720], // bas plus détaillé
      [1890, 675], [1890, 630], [1890, 585], [1890, 540], [1890, 495], // côté droit plus détaillé
      [1665, 450], [1710, 450], [1755, 450], [1800, 450], [1845, 450], [1890, 450] // barre horizontale du milieu plus détaillée
    ],
    
    // 'Z' - Deuxième Z
    [
      [2160, 180], [2250, 180], [2340, 180], [2430, 180], [2520, 180], [2610, 180], [2700, 180], // ligne du haut
      [2655, 225], [2610, 270], [2565, 315], [2520, 360], [2475, 405], [2430, 450], [2385, 495], [2340, 540], [2295, 585], [2250, 630], [2205, 675], // diagonale plus détaillée
      [2160, 720], [2250, 720], [2340, 720], [2430, 720], [2520, 720], [2610, 720], [2700, 720]  // ligne du bas
    ],
    
    // 'A'
    [
      [2970, 720], [2970, 675], [2970, 630], [2970, 585], [2970, 540], [2970, 495], [2970, 450], [2970, 405], [2970, 360], [2970, 315], [2970, 270], [3015, 225], // jambe gauche plus détaillée
      [3060, 180], [3105, 180], [3150, 180], [3195, 180], [3240, 180], // sommet plus détaillé
      [3285, 225], [3330, 270], [3330, 315], [3330, 360], [3330, 405], [3330, 450], [3330, 495], [3330, 540], [3330, 585], [3330, 630], [3330, 675], [3330, 720], // jambe droite plus détaillée
      [3015, 450], [3060, 450], [3105, 450], [3150, 450], [3195, 450], [3240, 450], [3285, 450] // barre horizontale plus détaillée
    ],
    
    // 'G' - Deuxième G
    [
      [3555, 180], [3600, 180], [3645, 180], [3690, 180], [3735, 180], [3780, 180], [3825, 180], [3870, 180], [3915, 180], [3960, 180], // arc supérieur plus détaillé
      [3510, 225], [3510, 270], [3510, 315], [3510, 360], [3510, 405], [3510, 450], [3510, 495], [3510, 540], [3510, 585], [3510, 630], [3510, 675], // côté gauche plus détaillé
      [3555, 720], [3600, 720], [3645, 720], [3690, 720], [3735, 720], [3780, 720], [3825, 720], [3870, 720], [3915, 720], [3960, 720], // bas plus détaillé
      [3960, 675], [3960, 630], [3960, 585], [3960, 540], [3960, 495], [3960, 450], // côté droit plus détaillé
      [3735, 450], [3780, 450], [3825, 450], [3870, 450], [3915, 450], [3960, 450] // barre horizontale du milieu plus détaillée
    ],
    
    // '.'
    [
      [4185, 720], [4230, 720], [4275, 720],
      [4185, 675], [4230, 675], [4275, 675],
      [4185, 630], [4230, 630], [4275, 630]
    ],
    
    // 'I'
    [
      [4500, 180], [4500, 225], [4500, 270], [4500, 315], [4500, 360], [4500, 405], [4500, 450], [4500, 495], [4500, 540], [4500, 585], [4500, 630], [4500, 675], [4500, 720], // pilier vertical plus détaillé
      [4365, 180], [4410, 180], [4455, 180], [4545, 180], [4590, 180], [4635, 180], // ligne du haut plus large
      [4365, 720], [4410, 720], [4455, 720], [4545, 720], [4590, 720], [4635, 720]  // ligne du bas plus large
    ],
    
    // 'O'
    [
      [4905, 180], [4950, 180], [4995, 180], [5040, 180], [5085, 180], [5130, 180], [5175, 180], [5220, 180], [5265, 180], // haut plus détaillé
      [4860, 225], [4860, 270], [4860, 315], [4860, 360], [4860, 405], [4860, 450], [4860, 495], [4860, 540], [4860, 585], [4860, 630], [4860, 675], // gauche plus détaillé
      [4905, 720], [4950, 720], [4995, 720], [5040, 720], [5085, 720], [5130, 720], [5175, 720], [5220, 720], [5265, 720], // bas plus détaillé
      [5310, 225], [5310, 270], [5310, 315], [5310, 360], [5310, 405], [5310, 450], [5310, 495], [5310, 540], [5310, 585], [5310, 630], [5310, 675] // droite plus détaillé
    ]
  ];

  return (
    <div className={`flex justify-center overflow-x-auto ${className}`}>
      <svg 
        viewBox="0 0 5670 900" 
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
