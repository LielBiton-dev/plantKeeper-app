import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, functions } from "../firebase/firebase";
import { httpsCallable } from "firebase/functions";

export default function LocationScreen({ onComplete }) {
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
  
    const handleAllowLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const latitude = position.coords.latitude;
              const longitude = position.coords.longitude;
              const locationString = await getCityCountry(latitude, longitude);
              
              await updateUserPreferences({
                locationEnable: 1,
                userLocation: locationString
              });
              console.log("Location saved to database:", locationString);

              onComplete();
              navigate("/");
            } catch (error) {
              console.error("Error updating user location:", error);
              setError("Error saving your location. Please try again.");
            }
          },
          (error) => {
            console.error("Geolocation error:", error);
            setError("Unable to access your location. Please try again.");
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } else {
        setError("Geolocation is not supported by your browser.");
      }
    };

    const getCityCountry = async (latitude, longitude) => {
      try {
        // Use the free Nominatim service for reverse geocoding
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'en', // Get results in English
              'User-Agent': 'PlantKeeper' // Required by Nominatim's usage policy
            }
          }
        );
        
        if (!response.ok) {
          throw new Error('Geocoding service failed');
        }
        
        const data = await response.json();
        const city = data.address.city || 
                     data.address.town || 
                     data.address.village || 
                     data.address.suburb ||
                     data.address.county ||
                     "Unknown";
        const country = data.address.country || "Unknown";
        
        return `${city}, ${country}`;
      } catch (error) {
        console.error("Error getting location name:", error);
        // If reverse geocoding fails, return the coordinates as fallback
        return `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
    };

  const handleSkip = async () => {
    try {
      await updateUserPreferences({
        locationEnable: 0,
        userLocation: null
      });
      console.log("Location permission denied saved to database");
      onComplete();
      navigate("/");
    } catch (error) {
      console.error("Error updating user location preference:", error);
      setError("Error saving your preference. Please try again.");
    }
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