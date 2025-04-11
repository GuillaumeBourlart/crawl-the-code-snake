
import React from "react";

interface AnimatedArrowProps {
  className?: string;
  text?: string;
}

const AnimatedArrow: React.FC<AnimatedArrowProps> = ({ className = "", text }) => {
  // Arrow styling with a simple solid black design like the image
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg 
        viewBox="0 0 400 80" 
        className="w-full h-full"
      >
        {/* Main horizontal line */}
        <line 
          x1="20" 
          y1="40" 
          x2="320" 
          y2="40" 
          stroke="#333" 
          strokeWidth="15" 
          strokeLinecap="round"
        />
        
        {/* Arrow head */}
        <polyline 
          points="290,10 350,40 290,70" 
          stroke="#333" 
          strokeWidth="15" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none"
        />
      </svg>
      {text && <span className="text-2xl font-bold tracking-wider mt-2">{text}</span>}
    </div>
  );
};

export default AnimatedArrow;
