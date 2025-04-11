
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
    r: 3, // Smaller circles (reduced from 4 to 3)
    fill: isClickable ? "#ffffff" : "#333333", // White when clickable, dark otherwise
    className: "animate-pulse"
  };

  // Animation delays based on position
  const getAnimationDelay = (index: number, total: number) => {
    return `${(index / total) * 0.5}s`;
  };

  // Generate the arrow shape using dots (circles)
  const generateArrowPoints = () => {
    // Main horizontal line points - with smaller spacing
    const mainLinePoints: [number, number][] = [
      [20, 40], [30, 40], [40, 40], [50, 40], [60, 40], 
      [70, 40], [80, 40], [90, 40], [100, 40], [110, 40],
      [120, 40], [130, 40], [140, 40], [150, 40], [160, 40]
    ];
    
    // Arrow head points - with smaller spacing
    const arrowHeadPoints: [number, number][] = [
      [150, 30], [155, 32], [160, 35], [165, 37], [170, 40], // Upper diagonal
      [165, 43], [160, 45], [155, 48], [150, 50] // Lower diagonal
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
              animationDuration: "1.5s", // Faster animation
              animationIterationCount: "infinite",
              filter: isClickable ? "drop-shadow(0px 2px 4px rgba(255, 255, 255, 0.3))" : "none"
            }}
          />
        ))}
      </>
    );
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg 
        viewBox="0 0 200 80" // Smaller viewBox for a more compact arrow
        className="w-full h-full"
      >
        {generateArrowPoints()}
      </svg>
    </div>
  );
};

export default AnimatedArrow;
