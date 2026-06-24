import { useState, useEffect } from 'react';

export const useCountdown = (initialSeconds: number, onComplete?: () => void) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onComplete) onComplete();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onComplete) onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onComplete]);

  const formatTime = () => {
    const hrs = Math.floor(secondsLeft / 3600);
    const mins = Math.floor((secondsLeft % 3600) / 60);
    const secs = secondsLeft % 60;

    const paddedHrs = String(hrs).padStart(2, '0');
    const paddedMins = String(mins).padStart(2, '0');
    const paddedSecs = String(secs).padStart(2, '0');

    return `${paddedHrs}:${paddedMins}:${paddedSecs}`;
  };

  return {
    secondsLeft,
    formattedTime: formatTime(),
    isExpired: secondsLeft === 0,
  };
};
