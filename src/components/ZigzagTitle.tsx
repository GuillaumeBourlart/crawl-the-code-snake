import React from "react";

interface ZigzagTitleProps {
  className?: string;
}

const ZigzagTitle: React.FC<ZigzagTitleProps> = ({ className = "" }) => {
  const MAX_CIRCLES_PER_LETTER = 25;

  function samplePoints<T>(points: T[], max: number): T[] {
    if (points.length <= max) return points;
    const step = Math.floor(points.length / max);
    return points.filter((_, i) => i % step === 0).slice(0, max);
  }

  const colors = ["#1EAEDB", "#F97316", "#8B5CF6", "#FFFFFF"];
  
  // ← Ici : on augmente r de 20 → 40
  const baseCircleProps = {
    r: 40,
    fill: "currentColor"
  };
  
  const generateLetter = (points: [number, number][], color: string, index: number) => {
    const pts = samplePoints(points, MAX_CIRCLES_PER_LETTER);
    return (
      <g key={index} className="letter-group">
        {pts.map(([cx, cy], i) => {
          const yFactor = (cy - 50) / 600;
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

  const letterCoordinates: [number, number][][] = [
    [
      [150,  50], [250,  50], [350,  50],
      [ 50,  50], [ 50, 150], [ 50, 250], [ 50, 350], [ 50, 450], [ 50, 550], [ 50, 650],
      [150, 650], [250, 650], [350, 650],
      [350, 450], [350, 550],
      [250, 350], [350, 350]
    ],
    [
      [500,  50], [500, 150], [500, 250], [500, 350], [500, 450], [500, 550], [500, 650],
      [550,  50], [650,  50], [750,  50],
      [550, 350], [650, 350], [750, 350],
      [750, 150], [750, 250],
      [550, 450], [650, 550], [750, 650]
    ],
    [
      [950,  50], [950, 150], [950, 250], [950, 350], [950, 450], [950, 550],
      [1050,650], [1150,650], [1250,650], [1350,650],
      [1350, 50], [1350,150], [1350,250], [1350,350], [1350,450], [1350,550]
    ],
    [
      [1400, 50], [1400,150], [1400,250], [1400,350], [1400,450], [1400,550], [1400,650],
      [1450, 50], [1550, 50], [1650, 50],
      [1450,350], [1550,350], [1650,350],
      [1450,650], [1550,650], [1650,650],
      [1650,150], [1650,250], [1650,450], [1650,550]
    ],
    [
      [1850, 50], [1950, 50], [2050, 50], [2150, 50],
      [2150,150], [2050,250], [1950,350], [1850,450],
      [1850,650], [1950,650], [2050,650], [2150,650]
    ],
    [
      [2400,550], [2500,550],
      [2400,650], [2500,650]
    ],
    [
      [2750, 50], [2850, 50], [2950, 50], [3050, 50], [3150, 50],
      [2950,150], [2950,250], [2950,350], [2950,450], [2950,550],
      [2750,650], [2850,650], [2950,650], [3050,650], [3150,650]
    ],
    [
      [3200, 50], [3300, 50], [3400, 50], [3500, 50], [3600, 50],
      [3200,150], [3200,250], [3200,350], [3200,450], [3200,550], [3200,650],
      [3600,150], [3600,250], [3600,350], [3600,450], [3600,550], [3600,650],
      [3300,650], [3400,650], [3500,650]
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
