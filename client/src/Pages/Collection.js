import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import PageTransition from "../components/PageTransition";
import { TopNav, BotNav } from '../components/Nav';
import "./Collection.css"; 

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

  return (
    <div className="page-container bg-light">
      <TopNav userName={userName} />
      <PageTransition>
        <div className="content-container">
          <h2 className="page-title">My plants</h2>

          <div className="plant-grid">
            {userPlants.map(plant => (
              <div key={plant.id} className="plant-card" 
              onClick={() => navigate("/care-instructions", { state: { type: plant.id } })}
              style={{ cursor: 'pointer' }}>
                <img src={plant.image_url} alt={plant.name} />
                <div className="collection-plant-name">{plant.name}</div>
                <span class="next-care">Water in 3 days</span>
              </div>
            ))}
          </div>
        </div>
        </PageTransition>      
        <BotNav />
      </div>
    
    );
  };
 

export default Collection;
