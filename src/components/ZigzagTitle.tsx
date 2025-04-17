
import React from "react";

interface ZigzagTitleProps {
  className?: string;
}

const ZigzagTitle: React.FC<ZigzagTitleProps> = ({ className = "" }) => {
  // 1) nombre max de cercles par lettre
  const MAX_CIRCLES_PER_LETTER = 25;

  // 2) utilitaire pour échantillonner
  function samplePoints<T>(points: T[], max: number): T[] {
    if (points.length <= max) return points;
    const step = Math.floor(points.length / max);
    return points.filter((_, i) => i % step === 0).slice(0, max);
  }

  // Couleurs alternées
  const colors = ["#1EAEDB", "#F97316", "#8B5CF6", "#FFFFFF"];
  
  // 3) rayon réduit à 20
  const baseCircleProps = {
    r: 20,
    fill: "currentColor"
  };
  
  // Fonction pour générer les cercles formant chaque lettre
 // Génère un <g> de cercles pour une lettre
  const generateLetter = (points: [number, number][], color: string, index: number) => {
    // on échantillonne
    const pts = samplePoints(points, MAX_CIRCLES_PER_LETTER);

    return (
      <g key={index} className="letter-group">
        {pts.map(([cx, cy], i) => {
          const yFactor = (cy - 180) / 540;
          const animationDelay = `${yFactor * 0.5}s`;
          return (
            <circle
              key={`ltr-${index}-c-${i}`}
              {...baseCircleProps}
              cx={cx}
              cy={cy}
              fill={color}
              className="animate-pulse"
              style={{
                animationDelay,
                animationDuration: "2s",
                animationIterationCount: "infinite",
                filter: "drop-shadow(0px 15px 25px rgba(0,0,0,0.5))"
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
      [270, 180], [315, 180], [360, 180], [405, 180], [450, 180], [495, 180], [540, 180], [585, 180], [630, 180], // arc supérieur
      [225, 225], [225, 270], [225, 315], [225, 360], [225, 405], [225, 450], [225, 495], [225, 540], [225, 585], [225, 630], [225, 675], // côté gauche
      [270, 720], [315, 720], [360, 720], [405, 720], [450, 720], [495, 720], [540, 720], [585, 720], [630, 720], // bas
      [630, 675], [630, 630], [630, 585], [630, 540], [630, 495], // côté droit
      [450, 450], [495, 450], [540, 450], [585, 450], [630, 450] // barre horizontale du milieu
    ],
    
    // 'R'
    [
      [765, 180], [810, 180], [855, 180], [900, 180], [945, 180], [990, 180], // haut
      [720, 225], [720, 270], [720, 315], [720, 360], [720, 405], [720, 450], [720, 495], [720, 540], [720, 585], [720, 630], [720, 675], [720, 720], // tige verticale
      [990, 225], [990, 270], [990, 315], [990, 360], // arc droit supérieur
      [945, 405], [900, 405], [855, 405], [810, 405], [765, 405], // ligne horizontale milieu
      [810, 450], [855, 495], [900, 540], [945, 585], [990, 630], [1035, 675], [1080, 720] // jambe diagonale
    ],
    
    // 'U'
    [
      [1170, 180], [1170, 225], [1170, 270], [1170, 315], [1170, 360], [1170, 405], [1170, 450], [1170, 495], [1170, 540], [1170, 585], [1170, 630], [1170, 675], // gauche vertical
      [1215, 720], [1260, 720], [1305, 720], [1350, 720], [1395, 720], [1440, 720], // bas
      [1485, 675], [1485, 630], [1485, 585], [1485, 540], [1485, 495], [1485, 450], [1485, 405], [1485, 360], [1485, 315], [1485, 270], [1485, 225], [1485, 180] // droite vertical
    ],
    
    // 'B'
    [
      [1620, 180], [1665, 180], [1710, 180], [1755, 180], [1800, 180], [1845, 180], // ligne du haut
      [1575, 225], [1575, 270], [1575, 315], [1575, 360], [1575, 405], [1575, 450], [1575, 495], [1575, 540], [1575, 585], [1575, 630], [1575, 675], [1575, 720], // tige verticale
      [1620, 450], [1665, 450], [1710, 450], [1755, 450], [1800, 450], [1845, 450], // ligne du milieu
      [1620, 720], [1665, 720], [1710, 720], [1755, 720], [1800, 720], [1845, 720], // ligne du bas
      [1890, 225], [1890, 270], [1890, 315], [1890, 360], [1890, 405], // arc droit supérieur
      [1890, 495], [1890, 540], [1890, 585], [1890, 630], [1890, 675] // arc droit inférieur
    ],
    
    // 'Z'
    [
      [2070, 180], [2115, 180], [2160, 180], [2205, 180], [2250, 180], [2295, 180], [2340, 180], // ligne du haut
      [2295, 225], [2250, 270], [2205, 315], [2160, 360], [2115, 405], [2070, 450], [2025, 495], [1980, 540], [1935, 585], [1890, 630], [1845, 675], // diagonale
      [1890, 720], [1935, 720], [1980, 720], [2025, 720], [2070, 720], [2115, 720], [2160, 720]  // ligne du bas
    ],
    
    // '.'
    [
      [2385, 720], [2430, 720], [2475, 720],
      [2385, 675], [2430, 675], [2475, 675],
      [2385, 630], [2430, 630], [2475, 630]
    ],
    
    // 'I'
    [
      [2610, 180], [2610, 225], [2610, 270], [2610, 315], [2610, 360], [2610, 405], [2610, 450], [2610, 495], [2610, 540], [2610, 585], [2610, 630], [2610, 675], [2610, 720], // pilier vertical
      [2520, 180], [2565, 180], [2655, 180], [2700, 180], // ligne du haut
      [2520, 720], [2565, 720], [2655, 720], [2700, 720]  // ligne du bas
    ],
    
    // 'O'
    [
      [2880, 180], [2925, 180], [2970, 180], [3015, 180], [3060, 180], [3105, 180], [3150, 180], // haut
      [2835, 225], [2835, 270], [2835, 315], [2835, 360], [2835, 405], [2835, 450], [2835, 495], [2835, 540], [2835, 585], [2835, 630], [2835, 675], // gauche
      [2880, 720], [2925, 720], [2970, 720], [3015, 720], [3060, 720], [3105, 720], [3150, 720], // bas
      [3195, 225], [3195, 270], [3195, 315], [3195, 360], [3195, 405], [3195, 450], [3195, 495], [3195, 540], [3195, 585], [3195, 630], [3195, 675] // droite
    ]
  ];

  return (
    <div className={`flex justify-center overflow-x-auto ${className}`}>
      <svg
        viewBox="0 0 3600 900"
        className="w-full max-w-[1600px] mx-auto"
        style={{ filter: "drop-shadow(0px 30px 60px rgba(0,0,0,0.5))" }}
      >
        {letterCoordinates.map((pts, idx) => {
          const color = colors[idx % colors.length];
          return generateLetter(pts, color, idx);
        })}
      </svg>
    </div>
  );
};

export default ZigzagTitle;
