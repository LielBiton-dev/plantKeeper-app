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
            <section>
              <h2 className="page-title" id="home-title">WELCOME TO YOUR GREENHOUSE</h2>
              <p className="description-text" id="home-description">Let's see how your plants are doing</p>
              <p className="location-display">
              <IoLocationOutline color="#2e553d"/>
                <span className="location-text">{userLocation}</span>
              </p>
            </section>

            <hr class="section-divider" />
            
            {/* Status Cards */}
            <div className="status-cards-grid">
            <section className="status-card" id="wateredTodayCard">
              <div className="status-card-container">
                <img
                  src="/spanHomePage1.png"
                  alt="Plants watered"
                  className="status-card-image"
                />
                <div className="status-card-content">
                  <h3>WATERED TODAY</h3>
                  <p id="wateredProgressText">You've watered <b>3</b> out of <b>5</b> plants today!</p>
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
                    <h3>YOUR NEXT TASK</h3>
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
            

            {/* Care Articles */}
            <div class="tips-section">
              <h2 class="section-title page-title">Plant Care Tips</h2>
              <hr class="section-divider" />
              <div class="tips-carousel">
                <div class="tip-card">
                  <img src="/root-rot.png" alt="Root Rot Prevention" class="tip-image" />
                  <div class="tip-content">
                    <h3>How to Prevent Root Rot</h3>
                    <p>Learn the signs of overwatering and how to save your plants from root rot.</p>
                  </div>
                </div>
                <div class="tip-card">
                  <img src="/repotting.png" alt="Repotting 101" class="tip-image" />
                  <div class="tip-content">
                    <h3>Repotting 101</h3>
                    <p>Step-by-step guide to repotting your plants without stress.</p>
                  </div>
                </div>
                <div class="tip-card">
                <img src="/light-indoor.png" alt="Repotting 101" class="tip-image" />
                  <div class="tip-content">
                    <h3>Lighting for Indoor Plants</h3>
                    <p>Understanding your home's light conditions for healthier plants.</p>
                  </div>
                </div>
                <div class="tip-card">
                <img src="/pest-control.png" alt="Pest Control" class="tip-image" />
                  <div class="tip-content">
                    <h3>Natural Pest Control</h3>
                    <p>Eco-friendly solutions to common plant pests.</p>
                  </div>
                </div>
              </div>
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