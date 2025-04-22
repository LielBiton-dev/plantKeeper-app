import React, { useEffect, useState } from "react";
import { FaPaw } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { useLocation } from "react-router-dom";
import { db, auth } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import PageTransition from "../components/PageTransition";
import { TopNav } from '../components/Nav';
import { IoIosArrowBack } from "react-icons/io";
import { IoWaterOutline } from "react-icons/io5";
import { PiSunLight } from "react-icons/pi";
import { TbTemperature } from "react-icons/tb";
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

  return (
    <div className="page-container bg-light">
      <TopNav userName={userName} />

      <div className="back-button" onClick={() => navigate("/collection")}>
        <IoIosArrowBack size={20} />
        <span>Back</span>
      </div>

      <PageTransition>
        <div className="care-card">
          <div className="image-container">
            <img src={plantData.image_url} alt={plantData.name} className="care-plant-image" />
          </div>
          
          <div className="plant-info-container">
            <h1 className="plant-name">{plantData.name}</h1>
            <p className="plant-description">{plantData.description}</p>

            <div className="care-tags">
              <div className="care-tag">
                <FaPaw size={28} />
                <div>Pet Friendly</div>
              </div>
              <div className="care-tag">
                <IoWaterOutline size={28} />
                <div>Every {careData.watering_frequency_days} days</div>
              </div>
              <div className="care-tag">
                <PiSunLight size={28} weight="bold" />
                <div>{careData.sunlight} Hours</div>
              </div>
              <div className="care-tag">
                <TbTemperature size={28} />
                <div>{careData.temperature_range_celsius}°</div>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </div>
  );
};

export default CareInstructions;