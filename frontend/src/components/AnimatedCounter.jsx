import { useEffect, useState } from 'react';

export default function AnimatedCounter({ value, duration = 1000 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    let animationFrameId;

    const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, "")) : value;
    if (isNaN(numericValue)) {
      setCount(value);
      return;
    }

    const startValue = count;
    
    // We only animate counting up or down based on a timer
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function (easeOutExpo)
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      const current = startValue + (numericValue - startValue) * easeProgress;
      setCount(current);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setCount(numericValue);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [value, duration]);

  // If original value had a percentage, append it back
  const displayValue = typeof value === 'string' && value.includes('%') 
    ? `${Math.round(count)}%` 
    : Math.round(count);

  return <span>{displayValue}</span>;
}
