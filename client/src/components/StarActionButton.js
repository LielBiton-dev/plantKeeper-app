import React from 'react';
import '../Pages/Home.css';
import { PiStarFour } from "react-icons/pi";

const SparkleStarFourPoint = () => (
  <span className="star">
    <PiStarFour />
  </span>
);

const StarActionButton = ({ icon, title, subtitle, onClick }) => {
  const starsArray = Array(7).fill();
  
  return (
    <button className="action-btn" onClick={onClick}>
      <div className="stars">
        {starsArray.map((_, index) => (
          <SparkleStarFourPoint key={index} />
        ))}
      </div>
      <span className="action-icon">{icon}</span>
      {title}
      <span className="action-subtitle">{subtitle}</span>
    </button>
  );
};

export default StarActionButton;