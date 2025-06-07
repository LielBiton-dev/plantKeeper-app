import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, functions } from "../firebase/firebase";
import { httpsCallable } from "firebase/functions";

export default function CameraScreen({ onComplete }) {
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
  
  const handleAllowCamera = async () => {
    try {
      // Request camera permission if browser supports it
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        console.log("Camera permission granted");
        // Save to database that camera is allowed
        await updateUserPreferences({ cameraUseEnable: 1 });
        console.log("Camera permission saved to database");
        
        // Stop all tracks after getting permission (we just needed the permission)
        stream.getTracks().forEach(track => track.stop());
        
        onComplete();
        navigate("/"); // Navigate to home
      } else {
        setError("Your browser doesn't support camera access");
        await updateUserPreferences({ cameraUseEnable: 0 });
        onComplete();
        navigate("/");
      }
    } catch (error) {
      console.error("Error requesting camera permission:", error);
      
      // Check for permission denied error
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setError("Camera permission was denied");
        try {
          await updateUserPreferences({ cameraUseEnable: 0 });
        } catch (dbError) {
          console.error("Error saving camera denial to database:", dbError);
        }
      } else {
        setError("Unable to request camera permission");
        try {
          await updateUserPreferences({ cameraUseEnable: 0 });
        } catch (dbError) {
          console.error("Error saving camera failure to database:", dbError);
        }
      }
    }
  };

  const handleSkip = async () => {
    try {
      // Save that camera was skipped
      await updateUserPreferences({ cameraUseEnable: 0 });
      console.log("Camera permission skipped saved to database");
    } catch (error) {
      console.error("Error saving camera skip to database:", error);
    }
    
    onComplete();
    navigate("/"); // Navigate to home
  };

  return (
    <div className="form-screen">
      <div className="form-content-container">
        <div className="form-container">
          <h2 className="page-title">Camera Access</h2>
        
          <img 
            src="/AllowCamera.png" 
            alt="Camera Access" 
            className="form-image"
          />
          
          <p className="description-text">
            Allow access to your camera to take photos of your plants
          </p>
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