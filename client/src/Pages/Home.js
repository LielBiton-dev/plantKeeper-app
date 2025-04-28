import React, { useState, useEffect } from "react";
import { TopNav, BotNav } from '../components/Nav';
import RecommendationModal from "../components/RecommendationModal";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { IoLocationOutline } from "react-icons/io5";
import { IoWaterOutline } from "react-icons/io5";
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
  const [tasks, setTasks] = useState([]);   
  
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
        
        const notificationsRef = collection(db, "notifications");
        const q = query(notificationsRef, where("user_id", "==", user.uid));
        const notificationsSnapshot = await getDocs(q);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingTasks = notificationsSnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              type: data.type,
              plantId: data.plant_id,
              scheduledDate: data.scheduled_date,
              isRead: data.isRead,
            };
          })
          .filter(task => {
            if (!task.scheduledDate) return false;
            const date = new Date(task.scheduledDate.year, task.scheduledDate.month - 1, task.scheduledDate.day);
            date.setHours(0, 0, 0, 0);
            return date.getTime() === today.getTime();;
          })
          .sort((a, b) => {
            const aDate = new Date(a.scheduledDate.year, a.scheduledDate.month - 1, a.scheduledDate.day);
            const bDate = new Date(b.scheduledDate.year, b.scheduledDate.month - 1, b.scheduledDate.day);
            return aDate - bDate;
          })
          .slice(0, 3); // Only first 3 tasks

        setTasks(upcomingTasks);

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

  /* Today's tasks helpers */

  const formatPlantName = (plantId) => {
    if (!plantId) return "your plant";
  
    const plant = userPlants.find(p => p.id === plantId);
    return plant ? plant.name : "your plant";
  };

   // Helper: get icon based on type
   const getIconByType = (type, size = 16) => {
    switch (type) {
      case "watering":
        return <IoWaterOutline size={size} className="task-badge-icon" />;
      default:
        return <IoWaterOutline size={size} className="task-badge-icon" />;
    }
  };

  const formatTaskType = (type) => {
    switch (type) {
      case "watering":
        return "Water";
      case "fertilizer":
        return "Fertilize";
      case "repotting":
        return "Repot";
      case "light":
        return "Sunlight";
      default:
        return "Care";
    }
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
              <div className="location-pill">
                <IoLocationOutline className="location-icon" />
                <span className="location-text">{userLocation}</span>
              </div>
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
                {tasks.length > 0 ? (
                  tasks.map(task => (
                    <div className="task-item">
                      <div className="task-content">
                      <div className="task-status-dot"
                        style={{
                          backgroundColor: task.isRead ? '#34d399' : '#f87171',  // Inner color
                          boxShadow: task.isRead 
                            ? '0 0 0 4px #bbf7d0'  // Outer green glow
                            : '0 0 0 4px #fecaca', // Outer red glow
                        }}
                      ></div>
                        <div className="plant-name">{formatPlantName(task.plantId)}</div>
                      </div>

                      <div className="task-badge">
                        {getIconByType(task.type)} {formatTaskType(task.type)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="task-item no-tasks">
                    <div className="task-content">
                      <div className="plant-name">🌱 No upcoming tasks!</div>
                    </div>
                  </div>
                )}
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