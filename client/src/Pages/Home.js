import React, { useState, useEffect } from "react";
import { TopNav, BotNav } from '../components/Nav';
import RecommendationModal from "../components/RecommendationModal";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import "./Home.css";


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

  const handleRecommendations = () => {
    setIsRecommendationModalOpen(true);
  };

  return (
    <div className="page-container bg-light">
      <TopNav userName={userName} />
      
      {/* Main content */}
      <main className="content page-fade">
        {loading ? (
          <p className="loading-text">Loading your garden profile...</p>
        ) : (
          <div className="content-container">
            {/* Greeting section */}
            <section className="greeting">
              <h2 className="page-title">Welcome to your greenhouse</h2>
              <p className="description-text">Let's see how your plants are doing</p>
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
            </section>
            
          {/* Status Cards */}
          <div className="status-cards-grid">
            <section className="status-card">
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
            </section>
            
            <section className="status-card">
              <div className="status-card-container">
                <img 
                  src="/spanHomePage2.png" 
                  alt="Next task" 
                  className="status-card-image" 
                />
                <div className="status-card-content">
                  <h3>Your next task</h3>
                  <p>Water your Lilys</p>
                </div>
              </div>
            </section>
          </div>
            
            {/* Action Buttons */}
            <div className="action-buttons">
              <button className="action-btn hover-scale">
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
                className="action-btn hover-scale"
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
      </main>

      <BotNav />    
      <RecommendationModal 
        isOpen={isRecommendationModalOpen} 
        onClose={() => setIsRecommendationModalOpen(false)} 
      />
    </div>
  );
};

export default Home;