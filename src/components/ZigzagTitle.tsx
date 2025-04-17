import React from "react";

interface ZigzagTitleProps {
  className?: string;
}

const ZigzagTitle: React.FC<ZigzagTitleProps> = ({ className = "" }) => {
  // 1) Choisissez votre rayon ici
  const r = 100;

  // 2) STEP définit l'espacement entre les centres des cercles
  const STEP = r * 1.8;

  // 3) Masques de lettres : 1 = point, 0 = vide
  const LETTER_MASKS: Record<string, number[][]> = {
    G: [
      [1,1,1,1,1],
      [1,0,0,0,0],
      [1,0,1,1,1],
      [1,0,0,0,1],
      [1,1,1,1,1],
    ],
    R: [
      [1,1,1],
      [1,0,1],
      [1,1,1],
      [1,1,0],
      [1,0,1],
    ],
    U: [
      [1,0,1],
      [1,0,1],
      [1,0,1],
      [1,0,1],
      [1,1,1],
    ],
    B: [
      [1,1,0],
      [1,0,1],
      [1,1,0],
      [1,0,1],
      [1,1,0],
    ],
    Z: [
      [1,1,1],
      [0,0,1],
      [0,1,0],
      [1,0,0],
      [1,1,1],
    ],
    ".": [
      [0,0,0],
      [0,0,0],
      [0,1,0],
      [0,0,0],
      [0,1,0],
    ],
    I: [
      [1,1,1],
      [0,1,0],
      [0,1,0],
      [0,1,0],
      [1,1,1],
    ],
    O: [
      [1,1,1],
      [1,0,1],
      [1,0,1],
      [1,0,1],
      [1,1,1],
    ],
  };

  // L'ordre des lettres
  const TEXT = "GRUBZ.IO".split("");

  // 4) Génération des coordonnées
  const letterCoordinates: [number, number][][] = TEXT.map((chr, idx) => {
    const mask = LETTER_MASKS[chr]!;
    const coords: [number, number][] = [];
    const offsetX = idx * (mask[0].length * STEP + STEP); // décallage horizontal par lettre
    mask.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          coords.push([
            offsetX + x * STEP,
            y * STEP
          ]);
        }
      });
    });
    return coords;
  });

  const colors = ["#1EAEDB", "#F97316", "#8B5CF6", "#FFFFFF"];

  // 5) Le cercle de base
  const baseCircleProps = {
    r,
    fill: "currentColor"
  };

  const generateLetter = (points: [number, number][], color: string, index: number) => (
    <g key={index}>
      {points.map(([cx, cy], i) => (
        <circle
          key={i}
          {...baseCircleProps}
          cx={cx}
          cy={cy}
          fill={color}
          className="animate-pulse"
          style={{
            animationDelay: `${(cy / (letterCoordinates[0].length*STEP)) * 0.5}s`,
            animationDuration: "2s",
            animationIterationCount: "infinite",
            filter: "drop-shadow(0px 15px 25px rgba(0,0,0,0.5))",
          }}
        />
      ))}
    </g>
  );

  return (
    <div className={`flex justify-center overflow-x-auto ${className}`}>
      <svg
        // on adapte le viewBox à la taille totale
        viewBox={`0 0 ${
          TEXT.length * (LETTER_MASKS["G"][0].length * STEP + STEP)
        } ${LETTER_MASKS["G"].length * STEP}`}
        className="w-full max-w-[1600px] mx-auto"
        style={{ filter: "drop-shadow(0px 30px 60px rgba(0,0,0,0.5))" }}
      >
        {letterCoordinates.map((pts, idx) =>
          generateLetter(pts, colors[idx % colors.length], idx)
        )}
      </svg>
    </div>
  );
};

export default ZigzagTitle;
