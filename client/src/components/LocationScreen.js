import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LocationScreen({ onComplete }) {
    const [error, setError] = useState("");
    const navigate = useNavigate();
  
    const handleAllowLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // Save the location data to database here!
            onComplete(); // Mark location step as completed
            navigate("/"); // Navigate to home
          },
          (error) => {
            setError("Unable to access your location. Please try again.");
          }
        );
      } else {
        setError("Geolocation is not supported by your browser.");
      }
    };

  const handleSkip = () => {
    onComplete();
    navigate("/");
  };

  return (
    <div className="form-screen">
      <div className="form-content-container">
        <div className="form-container">
          <h2 className="page-title">Where Are You?</h2>
          
          <img 
            src="/AllowLocation.png" 
            alt="Location" 
            className="form-image"
          />
          
          <p className="description-text">
            To give you correct care instructions we need to know your location
          </p>
          
          {error && (
            <p className="error-text">
              {error}
            </p>
          )}
          
          <button 
            onClick={handleAllowLocation}
            className="primary-button"
          >
            Allow
          </button>
          
          <div className="link-container">
            <button
              onClick={handleSkip}
              className="text-link"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}