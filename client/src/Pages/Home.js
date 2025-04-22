import React, { useState, useEffect } from "react";
import { TopNav, BotNav } from '../components/Nav';
import RecommendationModal from "../components/RecommendationModal";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { IoLocationOutline } from "react-icons/io5";
import "./Home.css";
import StarActionButton from '../components/StarActionButton';


const Home = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userLocation, setUserLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('new');
  
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
            // Check if user has saved a location and locationEnable is set to 1
            if (userData.userLocation && userData.locationEnable === 1) {
              setUserLocation(userData.userLocation);
              console.log("User location set to:", userData.userLocation);
            } else {
              setUserLocation("Your Garden");
              console.log("Using default location");
            }
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

  const handleOpenModal = (mode) => {
    setModalMode(mode);
    setModalOpen(true);
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
              <IoLocationOutline color="#2e553d"/>
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
            <div className="action-buttons">

            <StarActionButton 
              title="Plant Match"
              subtitle="Discover new plants for your space"
              onClick={() => handleOpenModal('new')}  // Pass 'new' mode
            />

            <StarActionButton 
              title="Plant Care"
              subtitle="Tips for your existing plants"
              onClick={() => handleOpenModal('care')}  // Pass 'care' mode
            />
            </div>
          </div>
        )}
      </main>

      <BotNav />    
      <RecommendationModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        mode={modalMode}
      />
    </div>
  );
};

export default Home;