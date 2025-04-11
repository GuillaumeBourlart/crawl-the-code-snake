
import React from "react";

interface AnimatedArrowProps {
  className?: string;
  text: string;
}

const AnimatedArrow: React.FC<AnimatedArrowProps> = ({ className = "", text }) => {
  // Configuration des couleurs des cercles
  const colors = ["#1EAEDB", "#F97316", "#8B5CF6", "#FFFFFF"];
  
  // Définir les propriétés de base pour tous les cercles
  const baseCircleProps = {
    cx: 0,
    cy: 0,
    r: 18, // Taille de base pour chaque cercle
    fill: "currentColor"
  };
  
  // Fonction pour générer les cercles formant la flèche
  const generateArrowCircles = (color: string, index: number) => {
    // Points formant une flèche pointant vers la droite
    const arrowPoints: [number, number][] = [
      // Tige de la flèche (horizontale)
      [120, 150], [150, 150], [180, 150], [210, 150], [240, 150], [270, 150], [300, 150], 
      [330, 150], [360, 150], [390, 150], [420, 150], [450, 150], [480, 150],
      
      // Pointe de la flèche (triangle)
      [510, 150], // Point central
      [480, 120], [480, 90], // Partie supérieure
      [510, 60], [540, 90], [540, 120], // Sommet et partie droite supérieure
      [510, 150], // Retour au point central
      [540, 180], [540, 210], // Partie droite inférieure
      [510, 240], [480, 210], [480, 180], // Base et partie gauche inférieure
    ];
    
    return (
      <g key={index} className="arrow-group">
        {arrowPoints.map((point, i) => {
          // Créer un délai progressif basé sur la position horizontale
          // Pour créer un effet de "construction" de la flèche de gauche à droite
          const xPosition = point[0];
          const xFactor = xPosition / 600; // Normaliser la position X pour obtenir un facteur entre 0-1
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
        viewBox="0 0 600 300" 
        className="w-full h-full"
        style={{ filter: "drop-shadow(0px 12px 24px rgba(0, 0, 0, 0.5))" }}
      >
        {colors.map((color, index) => generateArrowCircles(color, index))}
      </svg>
      <span className="text-2xl font-bold tracking-wider mt-2">{text}</span>
    </div>
  );
};

export default AnimatedArrow;
