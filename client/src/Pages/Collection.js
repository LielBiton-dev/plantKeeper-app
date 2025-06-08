import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "../firebase/firebase";
import { doc, getDoc, collection, getDocs, query, where, orderBy } from "firebase/firestore";
import PageTransition from "../components/PageTransition";
import { TopNav, BotNav } from '../components/Nav';
import { MdModeEditOutline } from "react-icons/md";
import { FaPlus, FaTimes } from 'react-icons/fa';
import "./Collection.css"; 

const today = new Date();
today.setHours(0, 0, 0, 0);

const Collection = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userPlants, setUserPlants] = useState([]);
  const [showPlantList, setShowPlantList] = useState(false);
  const [availablePlants, setAvailablePlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [plantToDelete, setPlantToDelete] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAvailablePlants = useCallback(async () => {
    try {
      const plantsRef = collection(db, "plants");
      const plantsSnapshot = await getDocs(plantsRef);
      const plantsList = plantsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter out plants the user already has
      const userPlantIds = userPlants.map(plant => plant.id);
      const filteredPlants = plantsList.filter(plant => !userPlantIds.includes(plant.id));
      
      setAvailablePlants(filteredPlants);
    } catch (error) {
      console.error("Error fetching available plants:", error);
    }
  }, [userPlants]);

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
                );
                
                const notificationsSnapshot = await getDocs(notificationsQuery);
                const todayNumber = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

                const upcoming = notificationsSnapshot.docs.find(doc => {
                    const d = doc.data().scheduled_date;
                    const docDateNum = d.year * 10000 + d.month * 100 + d.day;
                    return docDateNum >= todayNumber;
                  });
          
                let nextTask = null;
                if (upcoming) {
                  const taskDoc =  upcoming.data();
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

    useEffect(() => {
      if (showPlantList) {
        fetchAvailablePlants();
      }
    }, [showPlantList, fetchAvailablePlants, userPlants]); 

    const formatNextTaskMessage = (type, scheduledDate) => {
      if (!scheduledDate) return "";
    
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

    const handleAddPlantToCollection = async () => {
      if (!selectedPlant) return;
      
      setIsAdding(true);
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error("User not authenticated");
          return;
        }

        // ✅ Use Cloud Function instead of direct Firestore write
        const addPlantToUserCollection = httpsCallable(functions, 'addPlantToUserCollection');
        const result = await addPlantToUserCollection({ plantId: selectedPlant.id });

        if (result.data.success) {
          console.log("Plant added to collection:", selectedPlant.id);
          
          if (result.data.alreadyExists) {
            console.log("Plant was already in collection");
          }
          
          // Update the UI by adding the plant to userPlants
          setUserPlants([...userPlants, selectedPlant]);
          
          // Close the modals
          setShowConfirmation(false);
          setShowPlantList(false);
          setSelectedPlant(null);
        } else {
          console.error("Failed to add plant to collection");
        }
        
      } catch (error) {
        console.error("Error adding plant to collection:", error);
        // You could show an error message to the user here
      } finally {
        setIsAdding(false);
      }
    };

    const handleRemovePlant = async () => {
      if (!plantToDelete) return;
      
      setIsDeleting(true);
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error("User not authenticated");
          return;
        }

        const removePlantComplete = httpsCallable(functions, 'removePlantFromUserCollectionComplete');
        const result = await removePlantComplete({ plantId: plantToDelete.id });

        if (result.data.success) {
          console.log("Plant removed from collection:", plantToDelete.id);
          console.log("Deleted notifications:", result.data.deletedNotifications);

          setUserPlants(userPlants.filter(plant => plant.id !== plantToDelete.id));

          setShowDeleteConfirmation(false);
          setPlantToDelete(null);
          setEditMode(false);
        } else {
          console.error("Failed to remove plant from collection");
        }
        
      } catch (error) {
        console.error("Error removing plant from collection:", error);
      } finally {
        setIsDeleting(false);
      }
    };

  return (
    <div className="page-container bg-light">
      <TopNav userName={userName} />
      <PageTransition>
        <div className="content-container">
          <div className="page-header">
            <div className="page-title-container">
              {userPlants.length > 0 && (
                <button 
                  className={`edit-plants-button ${editMode ? 'active' : ''}`}
                  onClick={() => setEditMode(!editMode)}
                >
                  {editMode ? <FaTimes size={20} /> : <MdModeEditOutline size={20} />}
                </button>
              )}
              <h2 className="page-title">My plants</h2>
            </div>
          </div>

          <div className="plant-grid">
            {userPlants.map(plant => (
                <div key={plant.id} className={`plant-card ${editMode ? 'edit-mode' : ''}`}>
                  {editMode && (
                    <button 
                      className="delete-plant-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlantToDelete(plant);
                        setShowDeleteConfirmation(true);
                      }}
                    >
                      −
                    </button>
                  )}
                  <div 
                    className="plant-card-content"
                    onClick={() => !editMode && navigate("/care-instructions", { state: { type: plant.id } })}
                    style={{ cursor: editMode ? 'default' : 'pointer' }}
                  >
                  <img src={plant.image_url} alt={plant.name} />
                  <div className="collection-plant-name">{plant.name}</div>
                  <span className="next-care">
                    {plant.nextTask
                      ? formatNextTaskMessage(plant.nextTask.type, plant.nextTask.scheduledDate)
                      : "No upcoming tasks"}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {/* Plant selection modal */}
          {showPlantList && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>Add a plant to your collection</h3>
                  <button className="close-button" onClick={() => setShowPlantList(false)}>×</button>
                </div>
                <div className="available-plants-list">
                  {availablePlants.map(plant => (
                    <div 
                      key={plant.id} 
                      className="available-plant-item"
                      onClick={() => {
                        setSelectedPlant(plant);
                        setShowConfirmation(true);
                      }}
                    >
                      <img src={plant.image_url} alt={plant.name} className="plant-thumbnail" />
                      <div className="plant-info">
                        <div className="available-plant-name">{plant.name}</div>
                        <div className="plant-scientific-name">{plant.scientific_name}</div>
                      </div>
                    </div>
                  ))}
                  {availablePlants.length === 0 && (
                    <div className="no-plants-message">
                      No more plants available to add to your collection.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Confirmation dialog */}
          {showConfirmation && selectedPlant && (
            <div className="confirmation-overlay">
              <div className="confirmation-dialog">
                <p>You are about to add {selectedPlant.name} to your collection, are you sure?</p>
                <div className="confirmation-actions">
                  <button 
                    className="cancel-button"
                    onClick={() => {
                      setShowConfirmation(false);
                      setSelectedPlant(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="confirm-button" 
                    onClick={handleAddPlantToCollection}
                    disabled={isAdding}
                  >
                    {isAdding ? 'Adding...' : 'Add to Collection'}
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="floating-add-button" onClick={() => setShowPlantList(true)}>
            <FaPlus />
          </div>  
        </div>
        {/* Delete confirmation dialog */}
        {showDeleteConfirmation && plantToDelete && (
          <div className="confirmation-overlay">
            <div className="confirmation-dialog">
              <p>You are about to delete {plantToDelete.name} from your collection. <br></br>This will also remove all related notifications. <br></br>Are you sure?</p>
              <div className="confirmation-actions">
                <button 
                  className="cancel-button"
                  onClick={() => {
                    setShowDeleteConfirmation(false);
                    setPlantToDelete(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="delete-button" 
                  onClick={handleRemovePlant}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Plant'}
                </button>
              </div>
            </div>
          </div>
        )}
        </PageTransition>    
        <BotNav />
      </div>
    
    );
  };
 

export default Collection;
