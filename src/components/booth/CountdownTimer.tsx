// src/components/booth/CountdownTimer.tsx

import React, { useState, useEffect, useCallback } from 'react';

interface CountdownTimerProps {
  seconds: number;
  onComplete: () => void;
  onCancel?: () => void;
  autoStart?: boolean;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  seconds,
  onComplete,
  onCancel,
  autoStart = true,
}) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isActive, setIsActive] = useState(autoStart);

  const reset = useCallback(() => {
    setTimeLeft(seconds);
    setIsActive(false);
  }, [seconds]);

  const cancel = useCallback(() => {
    reset();
    if (onCancel) onCancel();
  }, [reset, onCancel]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      onComplete();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, onComplete]);

  // Sound effect for countdown
  useEffect(() => {
    if (isActive && timeLeft <= 3 && timeLeft > 0) {
      const audio = new Audio('/sounds/beep.mp3');
      audio.play().catch(err => console.error('Error playing sound:', err));
    } else if (isActive && timeLeft === 0) {
      const audio = new Audio('/sounds/camera-shutter.mp3');
      audio.play().catch(err => console.error('Error playing sound:', err));
    }
  }, [isActive, timeLeft]);

  return (
    <div className="flex flex-col items-center justify-center">
      {isActive ? (
        <div className="text-center">
          <div className="text-9xl font-bold mb-8 text-blue-600 drop-shadow-lg">
            {timeLeft}
          </div>
          <button 
            onClick={cancel}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button 
          onClick={() => setIsActive(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xl font-semibold"
        >
          Start Countdown
        </button>
      )}
    </div>
  );
};

export default CountdownTimer;