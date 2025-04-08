import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CameraScreen.css";

export default function CameraScreen({ onComplete }) {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  
  const handleAllowCamera = async () => {
    try {
      // Request camera permission if browser supports it
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        console.log("Camera permission granted");
        
        // Stop all tracks after getting permission (we just needed the permission)
        stream.getTracks().forEach(track => track.stop());
        
        onComplete();
        navigate("/"); // Navigate to home
      } else {
        setError("Your browser doesn't support camera access");
        onComplete();
        navigate("/");
      }
    } catch (error) {
      console.error("Error requesting camera permission:", error);
      
      // Check for permission denied error
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setError("Camera permission was denied");
      } else {
        setError("Unable to request camera permission");
      }
    }
  };

  const handleSkip = () => {
    onComplete();
    navigate("/"); // Navigate to home
  };

  return (
    <div className="camera-page">
      <div className="content-container">
        <div className="form-container">
          <h2 className="page-title">Camera Access</h2>
          
          <p className="description-text">
            Allow access to your camera to take photos of your plants
          </p>
          
          <div className="camera-image">
            <img 
              src="/AllowCamera.png" 
              alt="Camera Access" 
              className="camera-image"
            />
          </div>
          
          {error && (
            <p className="error-text">
              {error}
            </p>
          )}
          
          <button 
            onClick={handleAllowCamera}
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