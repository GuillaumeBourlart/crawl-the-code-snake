
import React from "react";

interface AnimatedArrowProps {
  className?: string;
  isClickable?: boolean;
}

const AnimatedArrow: React.FC<AnimatedArrowProps> = ({ 
  className = "",
  isClickable = false
}) => {
  // Base circle properties
  const baseCircleProps = {
    r: 4, // Smaller circles
    fill: isClickable ? "#ffffff" : "#333", // White when clickable, dark otherwise
    className: "animate-pulse"
  };

  // Animation delays based on position
  const getAnimationDelay = (index: number, total: number) => {
    return `${(index / total) * 0.5}s`;
  };

  // Generate the arrow shape using dots (circles)
  const generateArrowPoints = () => {
    // Main horizontal line points - reduced spacing
    const mainLinePoints: [number, number][] = [
      [20, 40], [35, 40], [50, 40], [65, 40], [80, 40], 
      [95, 40], [110, 40], [125, 40], [140, 40], [155, 40],
      [170, 40], [185, 40], [200, 40]
    ];
    
    // Arrow head points - adjusted for smaller spacing
    const arrowHeadPoints: [number, number][] = [
      [185, 25], [195, 30], [205, 35], [215, 40], // Upper diagonal
      [205, 45], [195, 50], [185, 55] // Lower diagonal
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
              filter: "drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.1))"
            }}
          />
        ))}
      </>
    );
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg 
        viewBox="0 0 240 80" // Reduced width for a smaller arrow
        className="w-full h-full"
      >
        {generateArrowPoints()}
      </svg>
    </div>
  );
};

export default AnimatedArrow;
