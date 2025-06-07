import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, functions } from "../firebase/firebase";
import { httpsCallable } from "firebase/functions";

export default function NotificationScreen({ onComplete }) {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const user = auth.currentUser;

// General function to update user preferences
  const updateUserPreferences = async (preferences) => {
    if (!user) {
      throw new Error("No user is currently signed in");
    }
    
    const updatePrefs = httpsCallable(functions, 'updateUserPreferences');
    const result = await updatePrefs(preferences);
    return result.data;
  };
  
  const handleAllowNotifications = async () => {
    try {
      // Request notification permission if browser supports it
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        
        if (permission === "granted") {
          console.log("Notification permission granted");
          await updateUserPreferences({ notificationsEnable: 1 });
          console.log("Notification permission saved to database");
        } else {
          console.log("Notification permission denied");
          await updateUserPreferences({ notificationsEnable: 0 });
          console.log("Notification denial saved to database");
        }
        onComplete();
        navigate("/"); // Navigate to home
      } else {
        setError("Your browser doesn't support notifications");
        await updateUserPreferences({ notificationsEnable: 0 });
        onComplete();
        navigate("/");
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      setError("Unable to request notification permission");
      try {
        await updateUserPreferences({ notificationsEnable: 0 });
      } catch (dbError) {
        console.error("Error saving notification failure to database:", dbError);
      }
    }
  };

  const handleSkip = async () => {
    try {
      // Save that notifications were skipped
      await updateUserPreferences({ notificationsEnable: 0 });
      console.log("Notification permission skipped saved to database");
    } catch (error) {
      console.error("Error saving notification skip to database:", error);
    }
    
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