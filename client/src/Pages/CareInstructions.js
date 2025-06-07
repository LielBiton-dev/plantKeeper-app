import React, { useEffect, useState } from "react";
import { FaPaw } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import PageTransition from "../components/PageTransition";
import { IoIosArrowBack } from "react-icons/io";
import { IoWaterOutline } from "react-icons/io5";
import { PiSunLight } from "react-icons/pi";
import { TbTemperature } from "react-icons/tb";
import "./CareInstructions.css";

const CareInstructions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const type = location.state?.type;
  const [plantData, setPlantData] = useState(null);
  const [careData, setCareData] = useState(null);

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


  const getLevelNumber = (level) => {
    switch ((level || "").toLowerCase()) {
      case "easy":
        return 1;
      case "medium":
        return 2;
      case "hard":
        return 3;
      default:
        return 0;
    }
  };
  
  if (!plantData || !careData) return <div className="loading">Loading...</div>;

  return (
    <div className="page-container bg-light">
      <div className="back-button back-btn-care" onClick={() => navigate("/collection")}>
        <IoIosArrowBack size={20} />
        <span>Back</span>
      </div>

      <PageTransition>
        <div className="care-card">
          <div className="image-container">
            <img src={plantData.image_url} alt={plantData.name} className="care-plant-image" />
            <div className="care-level-indicator">
              <div className="dots">
                {[...Array(3)].map((_, i) => (
                  <span
                    key={i}
                    className={`dot ${i < getLevelNumber(careData.care_level) ? 'filled' : ''}`}
                  ></span>
                ))}
              </div>
              <div className="care-level-text">
                {careData.care_level}
              </div>
            </div>
          </div>
          
          <div className="plant-info-container">
            <div className="plant-name-row">
              <h1 className="plant-name">{plantData.name}</h1>
              <div className="journal-link" onClick={() =>  navigate("/journal", {
                  state: {
                    plantId: type.toLowerCase(),
                    plantName: plantData.name
                  }
                })}>
                  → View Plant Journal
              </div>
            </div>
            <p className="plant-description">{plantData.description}</p>

            <div className="care-tags">
              <div className="care-tag">
                {plantData.pet_friendly ? (
                  <FaPaw />
                ) : (
                  <img 
                    src="/not_pet_friendly.png" 
                    alt="Not pet friendly" 
                    style={{ width: '30px', height: '26px', marginBottom: '10px' }}
                  />
                )}
                <div>{plantData.pet_friendly ? 'Pet Friendly' : 'Not Pet Friendly'}</div>
              </div>
              <div className="care-tag">
                <IoWaterOutline />
                <div>Every {careData.watering_frequency_days} days</div>
              </div>
              <div className="care-tag">
                <PiSunLight weight="bold" />
                <div>{careData.sunlight} Hours</div>
              </div>
              <div className="care-tag">
                <TbTemperature />
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