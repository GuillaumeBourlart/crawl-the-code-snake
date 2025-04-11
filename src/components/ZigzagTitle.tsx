
import React from "react";

interface ZigzagTitleProps {
  className?: string;
}

const ZigzagTitle: React.FC<ZigzagTitleProps> = ({ className = "" }) => {
  // Configuration des couleurs des cercles avec de meilleures couleurs pour la visibilité
  const colors = ["#1EAEDB", "#F97316", "#8B5CF6", "#FFFFFF"];
  
  // Définir les propriétés de base pour tous les cercles avec une taille plus petite pour permettre plus de détails
  const baseCircleProps = {
    cx: 0,
    cy: 0,
    r: 10, // Taille réduite pour permettre plus de cercles rapprochés
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
              animationDelay: `${i * 0.05}s`,
              filter: "drop-shadow(0px 3px 5px rgba(0, 0, 0, 0.7))"
            }}
          />
        ))}
      </g>
    );
  };

  // Points pour chaque lettre (coordonnées [x, y]) avec beaucoup plus de cercles pour plus de précision
  const letterCoordinates: [number, number][][] = [
    // 'Z' - Plus de points pour plus de précision
    [
      [30, 20], [40, 20], [50, 20], [60, 20], [70, 20], [80, 20], // ligne du haut
      [80, 30], [70, 40], [60, 50], [50, 60], // diagonale
      [30, 60], [40, 60], [50, 60], [60, 60], [70, 60], [80, 60]  // ligne du bas
    ],
    
    // 'I' - Pilier vertical avec plus de points
    [
      [110, 20], [110, 30], [110, 40], [110, 50], [110, 60],
      [100, 20], [120, 20], // ligne du haut
      [100, 60], [120, 60]  // ligne du bas
    ],
    
    // 'G' - Forme plus détaillée
    [
      [140, 20], [150, 20], [160, 20], [170, 20], [180, 20], // arc supérieur
      [140, 30], [140, 40], [140, 50], // côté gauche
      [140, 60], [150, 60], [160, 60], [170, 60], [180, 60], // bas
      [180, 50], [180, 40], // côté droit
      [170, 40], [160, 40] // barre horizontale du milieu
    ],
    
    // 'Z' - Deuxième Z plus précis
    [
      [210, 20], [220, 20], [230, 20], [240, 20], [250, 20], [260, 20], // ligne du haut
      [260, 30], [250, 40], [240, 50], [230, 60], // diagonale
      [210, 60], [220, 60], [230, 60], [240, 60], [250, 60], [260, 60]  // ligne du bas
    ],
    
    // 'A' - A plus détaillé
    [
      [280, 60], [280, 50], [280, 40], [280, 30], // jambe gauche
      [290, 20], [300, 20], // sommet
      [310, 30], [310, 40], [310, 50], [310, 60], // jambe droite
      [285, 40], [295, 40], [305, 40] // barre horizontale
    ],
    
    // 'G' - Deuxième G plus détaillé
    [
      [340, 20], [350, 20], [360, 20], [370, 20], [380, 20], // arc supérieur
      [340, 30], [340, 40], [340, 50], // côté gauche
      [340, 60], [350, 60], [360, 60], [370, 60], [380, 60], // bas
      [380, 50], [380, 40], // côté droit
      [370, 40], [360, 40] // barre horizontale du milieu
    ],
    
    // '.' - Point
    [
      [405, 60], [410, 60], [415, 60],
      [405, 55], [410, 55], [415, 55]
    ],
    
    // 'I' - Deuxième I plus détaillé
    [
      [440, 20], [440, 30], [440, 40], [440, 50], [440, 60],
      [430, 20], [450, 20], // ligne du haut
      [430, 60], [450, 60]  // ligne du bas
    ],
    
    // 'O' - O plus détaillé et oval
    [
      [470, 20], [480, 20], [490, 20], [500, 20], // haut
      [470, 30], [470, 40], [470, 50], // gauche
      [470, 60], [480, 60], [490, 60], [500, 60], // bas
      [510, 30], [510, 40], [510, 50], // droite
      [500, 20], [510, 20], // complète le haut à droite
      [500, 60], [510, 60]  // complète le bas à droite
    ]
  ];

  return (
    <div className={`flex justify-center ${className}`}>
      <svg 
        viewBox="0 0 540 80" 
        className="w-full max-w-2xl mx-auto"
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
