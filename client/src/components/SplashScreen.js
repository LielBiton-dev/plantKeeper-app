import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onAnimationComplete }) => {
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Show text after logo animation completes (2 seconds)
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 2000);

    // Complete the splash screen after 3 seconds (2s spin + 1s fade in)
    const completeTimer = setTimeout(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 3000);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(completeTimer);
    };
  }, [onAnimationComplete]);

  return (
    <div className="splash-container">
      <img 
        src="/SplashLogo.png" 
        alt="PlantKeeper Logo" 
        className="logo"
      />
      {showText && <h1 className="app-name">PlantKeeper</h1>}
    </div>
  );
};

export default SplashScreen;