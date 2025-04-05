import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

const Collection = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
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
            } else {
              console.log("No user document found for ID:", user.uid);
              setUserName("Plant Lover");
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
            setUserName("Plant Lover");
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
      }
    );
      
      return () => unsubscribe();
    }, [navigate]);

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

  return (
    <div style={{ 
      backgroundColor: '#F0E7D8',
      minHeight: '100vh',
      paddingBottom: '80px'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#28433F',
        color: '#F3EBDF',
        padding: '6px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '40px'
      }}>
        <img 
          src="logo_no_background.png" 
          alt="Plant Logo" 
          style={{ width: '40px', height: '40px' }}
        />
        <div className="top-nav-user">
          <span>{userName}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      {/* Centered container */}
      <div style={{ maxWidth: '20rem', margin: '0 auto', padding: '0 1rem' }}>
        <h1 style={{
          textAlign: 'center',
          margin: '20px 0',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          Your Plants
        </h1>

        {/* Plant grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px'
        }}>
          {userPlants.map(plant => (
            <div key={plant.id} style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '8px',
              textAlign: 'center',
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)'
            }}>
              <img
                src={plant.image_url}
                alt={plant.name}
                style={{
                  width: '100%',
                  height: '100px',
                  objectFit: 'cover',
                  borderRadius: '10px'
                }}
              />
              <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: '500' }}>
                {plant.name}
              </div>
            </div>
          ))}
        </div>
      </div>

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

export default Collection;
