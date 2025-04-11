
import React from "react";

interface AnimatedArrowProps {
  className?: string;
  text?: string;
}

const AnimatedArrow: React.FC<AnimatedArrowProps> = ({ className = "", text }) => {
  // Configuration des couleurs des cercles
  const colors = ["#1EAEDB", "#F97316", "#8B5CF6", "#FFFFFF"];
  
  // Définir les propriétés de base pour tous les cercles
  const baseCircleProps = {
    cx: 0,
    cy: 0,
    r: 16, // Taille légèrement réduite pour des cercles plus compacts
    fill: "currentColor"
  };
  
  // Fonction pour générer les cercles formant la flèche
  const generateArrowCircles = (color: string, index: number) => {
    // Points formant une flèche pointant vers la droite - design amélioré
    const arrowPoints: [number, number][] = [
      // Tige de la flèche (horizontale) - plus longue et plus dense
      [100, 150], [130, 150], [160, 150], [190, 150], 
      [220, 150], [250, 150], [280, 150], [310, 150], 
      [340, 150], [370, 150], [400, 150], [430, 150],
      
      // Pointe de la flèche (avec une forme plus pointue et plus visible)
      // Partie centrale de la pointe
      [460, 150],
      
      // Partie supérieure de la pointe (diagonale ascendante)
      [460, 120], [475, 100], [490, 80],
      
      // Sommet de la pointe
      [510, 60],
      
      // Partie supérieure droite (diagonale descendante)
      [530, 80], [545, 100], [560, 120],
      
      // Partie droite centrale
      [560, 150],
      
      // Partie inférieure droite (diagonale descendante)
      [560, 180], [545, 200], [530, 220],
      
      // Base de la pointe
      [510, 240],
      
      // Partie inférieure gauche (diagonale ascendante)
      [490, 220], [475, 200], [460, 180],
    ];
    
    return (
      <g key={index} className="arrow-group">
        {arrowPoints.map((point, i) => {
          // Créer un délai progressif basé sur la position horizontale
          // Pour créer un effet de "construction" de la flèche de gauche à droite
          const xPosition = point[0];
          const xFactor = xPosition / 650; // Normaliser la position X pour obtenir un facteur entre 0-1
          const animationDelay = `${xFactor * 0.8}s`; // Délai progressif basé sur la position horizontale
          
          return (
            <circle
              key={`arrow-${index}-circle-${i}`}
              {...baseCircleProps}
              cx={point[0]}
              cy={point[1]}
              fill={color}
              className="animate-pulse"
              style={{ 
                animationDelay,
                animationDuration: "2s",
                animationIterationCount: "infinite",
                filter: "drop-shadow(0px 9px 15px rgba(0, 0, 0, 0.7))"
              }}
            />
          );
        })}
      </g>
    );
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg 
        viewBox="0 0 650 300" 
        className="w-full h-full"
        style={{ filter: "drop-shadow(0px 12px 24px rgba(0, 0, 0, 0.5))" }}
      >
        {colors.map((color, index) => generateArrowCircles(color, index))}
      </svg>
      {text && <span className="text-2xl font-bold tracking-wider mt-2">{text}</span>}
    </div>
  );
};

export default AnimatedArrow;
