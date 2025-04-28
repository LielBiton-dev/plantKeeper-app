import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
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
          
          const fullPlantData = await Promise.all(
            plantDocs
              .filter(doc => doc.exists())
              .map(async (doc) => {
                const plantData = doc.data();
                const plantId = doc.id;
          
                // Fetch next task
                const notificationsRef = collection(db, "notifications");
                const notificationsQuery = query(
                  notificationsRef,
                  where("user_id", "==", user.uid),
                  where("plant_id", "==", plantId),
                  orderBy("scheduled_date.year", "asc"),
                  orderBy("scheduled_date.month", "asc"),
                  orderBy("scheduled_date.day", "asc"),
                  limit(1)
                );
          
                const notificationsSnapshot = await getDocs(notificationsQuery);
                let nextTask = null;
          
                if (!notificationsSnapshot.empty) {
                  const taskDoc = notificationsSnapshot.docs[0].data();
                  nextTask = {
                    type: taskDoc.type,
                    scheduledDate: taskDoc.scheduled_date,
                  };
                }
          
                return { id: plantId, ...plantData, nextTask };
              })
          );

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

    const formatNextTaskMessage = (type, scheduledDate) => {
      if (!scheduledDate) return "";
    
      const today = new Date();
      today.setHours(0, 0, 0, 0);
    
      const taskDate = new Date(scheduledDate.year, scheduledDate.month - 1, scheduledDate.day);
      taskDate.setHours(0, 0, 0, 0);
    
      const diffTime = taskDate.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
      if (diffDays === 0) {
        return `${capitalizeFirstLetter(type)} today`;
      } else if (diffDays === 1) {
        return `${capitalizeFirstLetter(type)} tomorrow`;
      } else if (diffDays > 1) {
        return `${capitalizeFirstLetter(type)} in ${diffDays} days`;
      } else {
        return `${capitalizeFirstLetter(type)} ${Math.abs(diffDays)} days ago`; // fallback for past
      }
    };
    
    const capitalizeFirstLetter = (str) => {
      if (!str) return "";
      return str.charAt(0).toUpperCase() + str.slice(1);
    };

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
                <span className="next-care">
                  {plant.nextTask
                    ? formatNextTaskMessage(plant.nextTask.type, plant.nextTask.scheduledDate)
                    : "No upcoming tasks"}
                </span>
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
