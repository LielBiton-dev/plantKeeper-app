import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useLocation } from "react-router-dom";
import { db, auth } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import PageTransition from "../components/PageTransition";
import "./CareInstructions.css";

const CareInstructions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const type = location.state?.type;
  const [userName, setUserName] = useState("");

  const [plantData, setPlantData] = useState(null);
  const [careData, setCareData] = useState(null);
  const [userPlants, setUserPlants] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {

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
        }

        const userPlantRef = doc(db, "user_plants", `user_${user.uid}`);
        const userPlantSnap = await getDoc(userPlantRef);
        if (userPlantSnap.exists()) {
          setUserPlants(userPlantSnap.data().plants || []);
        }
      }
    });

    return () => unsubscribe();
  }, []);

    const handleCollection = () => navigate("/collection");
    const handleScan = () => navigate("/scan");
    const handleProfile = () => navigate("/profile");
  
    const handleLogout = async () => {
      try {
        await signOut(auth);
        navigate("/welcome");
      } catch (error) {
        console.error("Error signing out:", error);
      }
    };

  useEffect(() => {
    const fetchPlantAndCare = async () => {
      try {
        const plantRef = doc(db, "plants", type.toLowerCase());
        const plantSnap = await getDoc(plantRef);

        if (plantSnap.exists()) {
          const plantInfo = plantSnap.data();
          setPlantData(plantInfo);

          const careRef = doc(db, "care_instructions", plantInfo.care_id);
          const careSnap = await getDoc(careRef);

          if (careSnap.exists()) {
            setCareData(careSnap.data());
          }
        }
      } catch (error) {
        console.error("Failed to fetch plant care data:", error);
      }
    };

    if (type) fetchPlantAndCare();
  }, [type]);

  if (!plantData || !careData) return <div className="loading">Loading...</div>;

  const isInCollection = userPlants.includes(plantData.id);

  return (
    <div className="care-page">
      <header className="care-header">
        <img src="/logo_no_background.png" alt="Logo" className="care-logo" />
        <div className="top-nav-user">
          <span>Hi, {userName} | </span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <PageTransition>
      <div className="care-card">
        <div className="image-container">
          <img src={plantData.image_url} alt={plantData.name} className="plant-image" />
          <div className={`heart-icon ${isInCollection ? 'filled' : ''}`}>&#9829;</div>
        </div>
        <h1 className="plant-name">{plantData.name}</h1>
        <p className="plant-description">{plantData.description}</p>

        <div className="care-tags">
          <div className="care-tag">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 12c1.5-2 4-2 5 0 1 2-1 4-2 5-1-1-3-2-3-5z" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="16" cy="8" r="1.5" />
            <circle cx="8.5" cy="14.5" r="1.5" />
            <circle cx="15.5" cy="14.5" r="1.5" />
          </svg>
            <div>Pet Friendly</div>
          </div>
          <div className="care-tag">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2C10 6 6 9 6 13a6 6 0 1 0 12 0c0-4-4-7-6-11z" />
            </svg>
            <div>Every {careData.watering_frequency_days} days</div>
          </div>
          <div className="care-tag">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
            <div>{careData.sunlight} Hours</div>
          </div>
          <div className="care-tag">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 14.76V3.5a1.5 1.5 0 0 0-3 0v11.26a5 5 0 1 0 3 0z" />
          </svg>
            <div>{careData.temperature_range_celsius}°</div>
          </div>
        </div>
      </div>
      </PageTransition>
       {/* Bottom navigation bar */}
        <div className="bottom-nav">
        {/* Home */}
        <button onClick={() => navigate("/")} className="nav-btn active">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ marginBottom: "0.25rem" }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </button>

        {/* Bookmarks */}
        <button onClick={handleCollection} className="nav-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>

        {/* Scan */}
        <button onClick={handleScan} className="nav-btn scan-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
          </svg>
        </button>

        {/* Notifications */}
        <button className="nav-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        {/* Profile */}
        <button onClick={handleProfile} className="nav-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CareInstructions;
