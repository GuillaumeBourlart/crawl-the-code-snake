
import { useEffect, useRef, useState } from "react";

interface MobileControlsProps {
  onMove: (direction: { x: number; y: number }) => void;
  onBoost: () => void;
}

const MobileControls = ({ onMove, onBoost }: MobileControlsProps) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickKnobRef = useRef<HTMLDivElement>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [touchId, setTouchId] = useState<number | null>(null);
  
  useEffect(() => {
    const joystick = joystickRef.current;
    const joystickKnob = joystickKnobRef.current;
    
    if (!joystick || !joystickKnob) return;
    
    const joystickRect = joystick.getBoundingClientRect();
    const centerX = joystickRect.width / 2;
    const centerY = joystickRect.height / 2;
    
    // Function to handle joystick movement
    const handleJoystickMove = (clientX: number, clientY: number) => {
      const rect = joystick.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      
      // Calculate distance from center
      const deltaX = x - centerX;
      const deltaY = y - centerY;
      const distance = Math.min(joystick.clientWidth / 2, Math.sqrt(deltaX * deltaX + deltaY * deltaY));
      const angle = Math.atan2(deltaY, deltaX);
      
      // Calculate joystick position
      const joystickX = centerX + distance * Math.cos(angle);
      const joystickY = centerY + distance * Math.sin(angle);
      
      // Move joystick knob
      joystickKnob.style.transform = `translate(${joystickX - joystickKnob.clientWidth / 2}px, ${joystickY - joystickKnob.clientHeight / 2}px)`;
      
      // Calculate normalized direction vector
      const dirX = distance > 0 ? deltaX / distance : 0;
      const dirY = distance > 0 ? deltaY / distance : 0;
      
      // Send movement direction
      onMove({ x: dirX, y: dirY });
    };
    
    const handleTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const touchX = touch.clientX;
        const touchY = touch.clientY;
        
        // Check if touch is within joystick area
        const rect = joystick.getBoundingClientRect();
        if (
          touchX >= rect.left &&
          touchX <= rect.right &&
          touchY >= rect.top &&
          touchY <= rect.bottom
        ) {
          setJoystickActive(true);
          setTouchId(touch.identifier);
          handleJoystickMove(touchX, touchY);
          break;
        }
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!joystickActive || touchId === null) return;
      
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchId) {
          handleJoystickMove(touch.clientX, touch.clientY);
          break;
        }
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (touchId === null) return;
      
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchId) {
          // Reset joystick position
          joystickKnob.style.transform = `translate(${centerX - joystickKnob.clientWidth / 2}px, ${centerY - joystickKnob.clientHeight / 2}px)`;
          setJoystickActive(false);
          setTouchId(null);
          onMove({ x: 0, y: 0 });
          break;
        }
      }
    };
    
    // Initialize joystick knob position
    joystickKnob.style.transform = `translate(${centerX - joystickKnob.clientWidth / 2}px, ${centerY - joystickKnob.clientHeight / 2}px)`;
    
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [onMove, joystickActive, touchId]);
  
  return (
    <div className="fixed bottom-0 left-0 w-full pointer-events-none">
      <div className="container mx-auto p-4 flex justify-between items-center">
        {/* Boost button */}
        <button
          className="w-20 h-20 rounded-full bg-blue-500/60 flex items-center justify-center text-white font-bold text-sm pointer-events-auto active:bg-blue-700/60 active:scale-95 transition-all"
          onTouchStart={onBoost}
        >
          BOOST
        </button>
        
        {/* Joystick */}
        <div
          ref={joystickRef}
          className="w-32 h-32 rounded-full bg-gray-800/60 pointer-events-auto relative"
        >
          <div
            ref={joystickKnobRef}
            className="w-16 h-16 rounded-full bg-gray-200/60 absolute"
          />
        </div>
      </div>
    </div>
  );
};

export default MobileControls;
