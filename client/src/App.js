import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "./firebase/firebase";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Home from "./Pages/Home";

import WelcomePage from "./Pages/Welcome";
import SplashScreen from "./components/SplashScreen";
import LocationScreen from "./components/LocationScreen";
import NotificationScreen from "./components/NotificationScreen";
import Collection from './Pages/Collection';
import CareInstructions from './Pages/CareInstructions';
import PlantScan from "./Pages/PlantScan";
import CameraScreen from "./components/CameraScreen";
import Notifications from "./Pages/Notifications";
import Profile from "./Pages/Profile";
import IdentificationResults from "./Pages/Identification";
import Dashboard from "./Pages/Dashboard";
import Journal from "./Pages/Journal";
import './styles/global.css';
import './styles/allowScreens.css';
import './styles/auth.css';

function App() {
  const [user, setUser] = useState(null);
  const [showSplash, setShowSplash] = useState(true);
  const [locationCompleted, setLocationCompleted] = useState(false);
  const [notificationCompleted, setNotificationCompleted] = useState(false);
  const [cameraCompleted, setCameraCompleted] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);

    // Check if steps were completed in local storage
    const hasCompletedLocation = localStorage.getItem("locationCompleted") === "true";
    const hasCompletedNotification = localStorage.getItem("notificationCompleted") === "true";
    const hasCompletedCamera = localStorage.getItem("cameraCompleted") === "true";
    
    setLocationCompleted(hasCompletedLocation);
    setNotificationCompleted(hasCompletedNotification);
    setCameraCompleted(hasCompletedCamera);
    });
    return () => unsubscribe();
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleLocationComplete = () => {
    localStorage.setItem("locationCompleted", "true");
    setLocationCompleted(true);
  };

  const handleNotificationComplete = () => {
    localStorage.setItem("notificationCompleted", "true");
    setNotificationCompleted(true);
  };

  const handleCameraComplete = () => {
    localStorage.setItem("cameraCompleted", "true");
    setCameraCompleted(true);
  };

  if (showSplash) {
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/allow-location" />} />
        <Route 
          path="/allow-location" 
          element={
            user && !locationCompleted ? 
            <LocationScreen onComplete={handleLocationComplete} /> : 
            <Navigate to={locationCompleted && !notificationCompleted ? "/allow-notifications" : "/"} />
          } 
        />
         <Route 
          path="/allow-notifications" 
          element={
            user && locationCompleted && !notificationCompleted ? 
            <NotificationScreen onComplete={handleNotificationComplete} /> : 
            <Navigate to="/" />
          } 
        />
        <Route 
          path="/allow-camera" 
          element={
            user && !cameraCompleted ? 
            <CameraScreen onComplete={handleCameraComplete} /> : 
            <Navigate to={cameraCompleted ? "/scan" : "/"} />
          } 
        />
        <Route 
          path="/" 
          element={
            user ? 
              (!locationCompleted ? 
                <Navigate to="/allow-location" /> : 
                (!notificationCompleted ? 
                  <Navigate to="/allow-notifications" /> : 
                  <Home />
                )
              ) : 
              <Navigate to="/login" />
          } 
        />
        <Route path="/collection" element={<Collection />} />
        <Route path="/care-instructions" element={<CareInstructions />} />
        <Route path="/scan" element={<PlantScan />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/identification" element={<IdentificationResults />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/journal" element={<Journal />} />
      </Routes>
    </Router>
  );
}

export default App;