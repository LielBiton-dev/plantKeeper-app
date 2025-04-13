import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function NotificationScreen({ onComplete }) {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  
  const handleAllowNotifications = async () => {
    try {
      // Request notification permission if browser supports it
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        
        if (permission === "granted") {
          console.log("Notification permission granted");
        } else {
          console.log("Notification permission denied");
        }
        onComplete();
        navigate("/"); // Navigate to home
      } else {
        setError("Your browser doesn't support notifications");
        onComplete();
        navigate("/");
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      setError("Unable to request notification permission");
    }
  };

  const handleSkip = () => {
    onComplete();
    navigate("/"); // Navigate to home
  };

  return (
    <div className="form-screen">
      <div className="form-content-container">
        <div className="form-container">
          <h2 className="page-title">Push Notifications</h2>

          <img 
            src="/AllowNotifications.png" 
            alt="Notifications" 
            className="form-image"
          />
          
          <p className="description-text">
            Get notified when it's time to care for your plants
          </p>
          {error && (
            <p className="error-text">
              {error}
            </p>
          )}
          
          <button 
            onClick={handleAllowNotifications}
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