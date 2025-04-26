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
  const [userPlants, setUserPlants] = useState([]);
  
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

        // Get user plants collection
        const userPlantDoc = await getDoc(doc(db, "user_plants", `user_${user.uid}`));

        if (userPlantDoc.exists()) {
          const plantIds = userPlantDoc.data().plants; 
          const plantPromises = plantIds.map(id => getDoc(doc(db, "plants", id)));
          const plantDocs = await Promise.all(plantPromises);
          const fullPlantData = plantDocs
          .filter(doc => doc.exists())
          .map(doc => ({ id: doc.id, ...doc.data() }));
          setUserPlants(fullPlantData);
        } else {
          console.log("No user_plants document found");
          setUserPlants([]);
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
            
            {/* Your Plants */}
            <section className="home-section plants-section">
              <div className="section-title-row">
                <h3 className="section-title">Your Plants</h3>
                <span className="view-all-link" onClick={() => navigate("/collection")}>
                  View all
                </span>
              </div>
              <div className="plant-stories-carousel">
                {userPlants.map((plant) => (
                  <div 
                    key={plant.id} 
                    className="plant-story" 
                    onClick={() => navigate("/care-instructions", { state: { type: plant.id } })}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="plant-story-ring">
                      <div className="plant-story-gap">
                        <img src={plant.image_url} alt={plant.name} className="plant-story-image" />
                      </div>
                    </div>
                    <div className="plant-story-label">{plant.name}</div>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Today's Tasks */}
            <section className="home-section tasks-section">
              <div className="section-title-row">
                <h3 className="section-title">Today's Tasks</h3>
                <span className="view-all-link" onClick={() => navigate("/notifications")}>
                  View all
                </span>
              </div>

              <div className="task-list">
                <div className="task-item">
                  <div className="task-dot water"></div>
                  <div className="task-text">
                    <strong>Water Peace Lily</strong>
                    <span className="task-sub">Every 5 days</span>
                  </div>
                </div>
                <div className="task-item">
                  <div className="task-dot prune"></div>
                  <div className="task-text">
                    <strong>Prune Snake Plant</strong>
                    <span className="task-sub">Remove yellow leaves</span>
                  </div>
                </div>
                <div className="task-item">
                  <div className="task-dot sunlight"></div>
                  <div className="task-text">
                    <strong>Move Orchid to sunlight</strong>
                    <span className="task-sub">Needs 3+ hours today</span>
                  </div>
                </div>
              </div>
            </section>

          
            {/* Action Buttons */}
            <section className="home-section actions-section">
              <div className="action-buttons">
                <StarActionButton 
                  title="Plant Match"
                  subtitle="Discover new plants for your space"
                  onClick={() => handleOpenModal('new')}
                />
                <StarActionButton 
                  title="Plant Care"
                  subtitle="Tips for your existing plants"
                  onClick={() => handleOpenModal('care')}
                />
              </div>
            </section>

            {/* Care Articles */}
            <div className="home-section tips-section">
              <h3 className="section-title">Plant Care Tips</h3>
              <div className="tips-carousel">
                <a href="https://theplantgallery.com/how-to-fix-and-prevent-root-rot/" target="_blank" rel="noopener noreferrer" className="tip-card">
                  <img src="/root-rot.png" alt="Root Rot Prevention" className="tip-image" />
                  <div className="tip-content">
                    <h3>How to Prevent Root Rot</h3>
                    <p>Learn the signs of overwatering and how to save your plants from root rot.</p>
                  </div>
                </a>
                <a href="https://plnts.com/en/care/doctor/repotting/" target="_blank" rel="noopener noreferrer" className="tip-card"> 
                  <img src="/repotting.png" alt="Repotting 101" className="tip-image" />
                  <div className="tip-content">
                    <h3>Repotting 101</h3>
                    <p>Step-by-step guide to repotting your plants without stress.</p>
                  </div>
                </a>
                <a href="https://www.rhs.org.uk/plants/types/houseplants/artificial-lighting/" target="_blank" rel="noopener noreferrer" className="tip-card"> 
                  <img src="/light-indoor.png" alt="Repotting 101" className="tip-image" />
                  <div className="tip-content">
                    <h3>Lighting for Indoor Plants</h3>
                    <p>Understanding your home's light conditions for healthier plants.</p>
                  </div>
                </a>
                <a href="https://www.thebiggreenk.com/blog/homemade-pest-solutions-for-houseplants/" target="_blank" rel="noopener noreferrer" className="tip-card"> 
                  <img src="/pest-control.png" alt="Pest Control" className="tip-image" />
                  <div className="tip-content">
                    <h3>Natural Pest Control</h3>
                    <p>Eco-friendly solutions to common plant pests.</p>
                  </div>
                </a>
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