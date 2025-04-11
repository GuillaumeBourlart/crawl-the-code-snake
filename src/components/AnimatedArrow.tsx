
import React from "react";

interface AnimatedArrowProps {
  className?: string;
  text?: string;
}

const AnimatedArrow: React.FC<AnimatedArrowProps> = ({ className = "" }) => {
  // Base circle properties
  const baseCircleProps = {
    r: 6,
    fill: "#333", 
    className: "animate-pulse"
  };

  // Animation delays based on position
  const getAnimationDelay = (index: number, total: number) => {
    return `${(index / total) * 0.5}s`;
  };

  // Generate the arrow shape using dots (circles)
  const generateArrowPoints = () => {
    // Main horizontal line points
    const mainLinePoints: [number, number][] = [
      [20, 40], [45, 40], [70, 40], [95, 40], [120, 40], 
      [145, 40], [170, 40], [195, 40], [220, 40], [245, 40], 
      [270, 40], [295, 40], [320, 40]
    ];
    
    // Arrow head points
    const arrowHeadPoints: [number, number][] = [
      [295, 15], [305, 20], [315, 25], [325, 30], [335, 35], [345, 40], // Upper diagonal
      [335, 45], [325, 50], [315, 55], [305, 60], [295, 65] // Lower diagonal
    ];
    
    // All arrow points
    const allPoints = [...mainLinePoints, ...arrowHeadPoints];
    
    return (
      <>
        {allPoints.map((point, index) => (
          <circle
            key={`arrow-circle-${index}`}
            cx={point[0]}
            cy={point[1]}
            {...baseCircleProps}
            style={{ 
              animationDelay: getAnimationDelay(index, allPoints.length),
              animationDuration: "2s",
              animationIterationCount: "infinite",
              filter: "drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.1))"
            }}
          />
        ))}
      </>
    );
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg 
        viewBox="0 0 370 80" 
        className="w-full h-full"
      >
        {generateArrowPoints()}
      </svg>
    </div>
  );
};

export default AnimatedArrow;
