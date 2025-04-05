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

function App() {
  const [user, setUser] = useState(null);
  const [showSplash, setShowSplash] = useState(true);
  const [locationCompleted, setLocationCompleted] = useState(false);
  const [notificationCompleted, setNotificationCompleted] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);

    // Check if steps were completed in local storage
    const hasCompletedLocation = localStorage.getItem("locationCompleted") === "true";
    const hasCompletedNotification = localStorage.getItem("notificationCompleted") === "true";
    
    setLocationCompleted(hasCompletedLocation);
    setNotificationCompleted(hasCompletedNotification);
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

  if (showSplash) {
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/location" />} />
        <Route 
          path="/location" 
          element={
            user && !locationCompleted ? 
            <LocationScreen onComplete={handleLocationComplete} /> : 
            <Navigate to={locationCompleted && !notificationCompleted ? "/notifications" : "/"} />
          } 
        />
         <Route 
          path="/notifications" 
          element={
            user && locationCompleted && !notificationCompleted ? 
            <NotificationScreen onComplete={handleNotificationComplete} /> : 
            <Navigate to="/" />
          } 
        />
        <Route 
          path="/" 
          element={
            user ? 
              (!locationCompleted ? 
                <Navigate to="/location" /> : 
                (!notificationCompleted ? 
                  <Navigate to="/notifications" /> : 
                  <Home />
                )
              ) : 
              <Navigate to="/welcome" />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;