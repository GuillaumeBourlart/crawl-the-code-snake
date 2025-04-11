
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
    r: 18, // Taille des cercles triplée (6 * 3 = 18)
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
          const yFactor = (yPosition - 60) / 180; // Normalize Y position (60-240) to get a factor between 0-1
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
                filter: "drop-shadow(0px 9px 15px rgba(0, 0, 0, 0.7))" // Shadow plus grand pour un titre plus grand
              }}
            />
          );
        })}
      </g>
    );
  };

  // Points pour chaque lettre (coordonnées [x, y]) multipliés par 3 pour les rendre 3 fois plus grandes
  const letterCoordinates: [number, number][][] = [
    // 'Z'
    [
      [90, 60], [120, 60], [150, 60], [180, 60], [210, 60], [240, 60], [270, 60], // ligne du haut
      [255, 75], [240, 90], [225, 105], [210, 120], [195, 135], [180, 150], [165, 165], [150, 180], [135, 195], [120, 210], [105, 225], // diagonale plus détaillée
      [90, 240], [120, 240], [150, 240], [180, 240], [210, 240], [240, 240], [270, 240]  // ligne du bas
    ],
    
    // 'I'
    [
      [360, 60], [360, 75], [360, 90], [360, 105], [360, 120], [360, 135], [360, 150], [360, 165], [360, 180], [360, 195], [360, 210], [360, 225], [360, 240], // pilier vertical plus détaillé
      [315, 60], [330, 60], [345, 60], [375, 60], [390, 60], [405, 60], // ligne du haut plus large
      [315, 240], [330, 240], [345, 240], [375, 240], [390, 240], [405, 240]  // ligne du bas plus large
    ],
    
    // 'G'
    [
      [495, 60], [510, 60], [525, 60], [540, 60], [555, 60], [570, 60], [585, 60], [600, 60], [615, 60], [630, 60], // arc supérieur plus détaillé
      [480, 75], [480, 90], [480, 105], [480, 120], [480, 135], [480, 150], [480, 165], [480, 180], [480, 195], [480, 210], [480, 225], // côté gauche plus détaillé
      [495, 240], [510, 240], [525, 240], [540, 240], [555, 240], [570, 240], [585, 240], [600, 240], [615, 240], [630, 240], // bas plus détaillé
      [630, 225], [630, 210], [630, 195], [630, 180], [630, 165], // côté droit plus détaillé
      [555, 150], [570, 150], [585, 150], [600, 150], [615, 150], [630, 150] // barre horizontale du milieu plus détaillée
    ],
    
    // 'Z' - Deuxième Z
    [
      [720, 60], [750, 60], [780, 60], [810, 60], [840, 60], [870, 60], [900, 60], // ligne du haut
      [885, 75], [870, 90], [855, 105], [840, 120], [825, 135], [810, 150], [795, 165], [780, 180], [765, 195], [750, 210], [735, 225], // diagonale plus détaillée
      [720, 240], [750, 240], [780, 240], [810, 240], [840, 240], [870, 240], [900, 240]  // ligne du bas
    ],
    
    // 'A'
    [
      [990, 240], [990, 225], [990, 210], [990, 195], [990, 180], [990, 165], [990, 150], [990, 135], [990, 120], [990, 105], [990, 90], [1005, 75], // jambe gauche plus détaillée
      [1020, 60], [1035, 60], [1050, 60], [1065, 60], [1080, 60], // sommet plus détaillé
      [1095, 75], [1110, 90], [1110, 105], [1110, 120], [1110, 135], [1110, 150], [1110, 165], [1110, 180], [1110, 195], [1110, 210], [1110, 225], [1110, 240], // jambe droite plus détaillée
      [1005, 150], [1020, 150], [1035, 150], [1050, 150], [1065, 150], [1080, 150], [1095, 150] // barre horizontale plus détaillée
    ],
    
    // 'G' - Deuxième G
    [
      [1185, 60], [1200, 60], [1215, 60], [1230, 60], [1245, 60], [1260, 60], [1275, 60], [1290, 60], [1305, 60], [1320, 60], // arc supérieur plus détaillé
      [1170, 75], [1170, 90], [1170, 105], [1170, 120], [1170, 135], [1170, 150], [1170, 165], [1170, 180], [1170, 195], [1170, 210], [1170, 225], // côté gauche plus détaillé
      [1185, 240], [1200, 240], [1215, 240], [1230, 240], [1245, 240], [1260, 240], [1275, 240], [1290, 240], [1305, 240], [1320, 240], // bas plus détaillé
      [1320, 225], [1320, 210], [1320, 195], [1320, 180], [1320, 165], [1320, 150], // côté droit plus détaillé
      [1245, 150], [1260, 150], [1275, 150], [1290, 150], [1305, 150], [1320, 150] // barre horizontale du milieu plus détaillée
    ],
    
    // '.'
    [
      [1395, 240], [1410, 240], [1425, 240],
      [1395, 225], [1410, 225], [1425, 225],
      [1395, 210], [1410, 210], [1425, 210]
    ],
    
    // 'I'
    [
      [1500, 60], [1500, 75], [1500, 90], [1500, 105], [1500, 120], [1500, 135], [1500, 150], [1500, 165], [1500, 180], [1500, 195], [1500, 210], [1500, 225], [1500, 240], // pilier vertical plus détaillé
      [1455, 60], [1470, 60], [1485, 60], [1515, 60], [1530, 60], [1545, 60], // ligne du haut plus large
      [1455, 240], [1470, 240], [1485, 240], [1515, 240], [1530, 240], [1545, 240]  // ligne du bas plus large
    ],
    
    // 'O'
    [
      [1635, 60], [1650, 60], [1665, 60], [1680, 60], [1695, 60], [1710, 60], [1725, 60], [1740, 60], [1755, 60], // haut plus détaillé
      [1620, 75], [1620, 90], [1620, 105], [1620, 120], [1620, 135], [1620, 150], [1620, 165], [1620, 180], [1620, 195], [1620, 210], [1620, 225], // gauche plus détaillé
      [1635, 240], [1650, 240], [1665, 240], [1680, 240], [1695, 240], [1710, 240], [1725, 240], [1740, 240], [1755, 240], // bas plus détaillé
      [1770, 75], [1770, 90], [1770, 105], [1770, 120], [1770, 135], [1770, 150], [1770, 165], [1770, 180], [1770, 195], [1770, 210], [1770, 225] // droite plus détaillé
    ]
  ];

  return (
    <div className={`flex justify-center ${className}`}>
      <svg 
        viewBox="0 0 1890 300" 
        className="w-full max-w-screen-xl mx-auto" 
        style={{ 
          filter: "drop-shadow(0px 12px 24px rgba(0, 0, 0, 0.5))"
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
