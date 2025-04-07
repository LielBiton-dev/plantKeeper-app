import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import "./Home.css";
import RecommendationModal from "../components/RecommendationModal";

const Home = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userLocation, setUserLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [isRecommendationModalOpen, setIsRecommendationModalOpen] = useState(false);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          console.log("User authenticated:", user.uid);
          const userDoc = await getDoc(doc(db, "users", user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("User data retrieved:", userData);
            
            if (userData.firstName) {
              setUserName(userData.firstName);
            } else {
              setUserName("Plant Lover");
              console.log("No name found in user data, using default");
            }          
            // Default location for now
            setUserLocation("Your Garden");
          } else {
            console.log("No user document found for ID:", user.uid);
            // Document doesn't exist - use default
            setUserName("Plant Lover");
            setUserLocation("Your Garden");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserName("Plant Lover");
          setUserLocation("Your Garden");
        } finally {
          setLoading(false);
        }
      } else {
        // User not logged in, redirect to welcome
        console.log("No authenticated user, redirecting");
        navigate("/welcome");
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);

  const handleCollection = () => {
    navigate("/collection");
  };

  const handleScan = () => {
    navigate("/scan");
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  const handleRecommendations = () => {
    setIsRecommendationModalOpen(true);
  };
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/welcome");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="home-container">
      {/* Top navigation bar */}
      <div className="top-nav">
        <div className="top-nav-logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
          </svg>
        </div>
        <div className="top-nav-user">
          <span>Hi, {userName} | </span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
      
      {/* Content container */}
      <div className="content">
        {loading ? (
          <p className="loading-text">Loading your garden profile...</p>
        ) : (
          <div className="content-container">
            {/* Greeting */}
            <div className="greeting">
              <h2>Welcome to your greenhouse</h2>
              <p>Let's see how your plants are doing</p>
                {/* Location display */}
              <p className="location-display">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="location-icon"
                > 
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path> 
                  <circle cx="12" cy="10" r="3"></circle> 
                </svg>
                <span className="location-text">{userLocation}</span>
              </p>
            </div>

            <div className="card status-card">
              <div className="status-card-container">
                <img 
                  src="/spanHomePage1.png" 
                  alt="Plants watered" 
                  className="status-card-image" 
                />
                <div className="status-card-content">
                  <h3>3 Plants Watered</h3>
                  <p>Well done! Your plants are happy</p>
                </div>
              </div>
            </div>
            
            {/* Next Task Card */}
            <div className="card status-card">
              <div className="status-card-container">
                <img 
                  src="/spanHomePage2.png" 
                  alt="Plants watered" 
                  className="status-card-image" 
                />
                <div className="status-card-content">
                  <h3>Your next task</h3>
                  <p>Water your Lilys</p>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="action-buttons">
              <button className="action-btn">
                <span className="action-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v8"></path>
                    <path d="M12 22v-8"></path>
                    <path d="M18 15l-6-6-6 6"></path>
                  </svg>
                </span>
                Explore New Tips
                <span className="action-subtitle">
                  Prepare your plants for the coming season!
                </span>
              </button>
              
              <button 
                onClick={handleRecommendations}
                className="action-btn"
              >
                <span className="action-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"></path>
                    <path d="M12 6v6l4 2"></path>
                  </svg>
                </span>
                Try a New Plant
                <span className="action-subtitle">
                  Add a Monstera to your collection
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom navigation bar */}
      <div className="bottom-nav">
        {/* Home button */}
        <button onClick={() => navigate("/")} className="nav-btn active">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "0.25rem" }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </button>
        
        {/* Bookmarks button */}
        <button onClick={handleCollection} className="nav-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>

        {/* Scan button */}
        <button onClick={handleScan} className="nav-btn scan-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
            <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
            <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
            <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
          </svg>
        </button>
        
        {/* Notifications button */}
        <button className="nav-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </button>
        
        {/* Profile button */}
        <button onClick={handleProfile} className="nav-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </button>
      </div>
      <RecommendationModal 
        isOpen={isRecommendationModalOpen} 
        onClose={() => setIsRecommendationModalOpen(false)} 
      />
    </div>
  );
};

export default Home;