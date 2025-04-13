import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import PageTransition from "../components/PageTransition";
import axios from "axios";
import "./Identification.css";

const IdentificationResults = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const file = location.state?.file;    

    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("");
    const [confidence, setConfidence] = useState(0);
    const [feedbackGiven, setFeedbackGiven] = useState(false);

    const handleFeedback = (isGood) => {
        setFeedbackGiven(true);
        console.log(`User feedback: ${isGood ? 'Good' : 'Bad'} identification`);
        // Optionally send this to Firestore or analytics
      };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUserName(userData.firstName || "Plant Lover");
            } else {
                setUserName("Plant Lover");
            }
            } catch (error) {
            console.error("Failed to fetch user name:", error);
            setUserName("Plant Lover");
            }
        }
        });
        return () => unsubscribe();
    }, []);

  useEffect(() => {
    
    if (!file) return;

    const sendFileToModel = async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await axios.post(
          "https://coralengel-plant-recognition-api.hf.space/predict",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const rawResults = response.data.results;
        const parsed = typeof rawResults === "string" ? JSON.parse(rawResults) : rawResults;
        setPrediction(parsed[0]);
      } catch (error) {
        console.error("Prediction failed:", error);
        setPrediction({ error: "Failed to classify the image." });
      } finally {
        setLoading(false);
      }
    };

    sendFileToModel();
  }, [file]);
  
    useEffect(() => {
        if (!prediction?.confidence) return;
        const targetConfidence = Math.round(prediction.confidence * 100);
        const duration = 1500;
        const interval = 10;
        const steps = duration / interval;
        const increment = targetConfidence / steps;

        let current = 0;
        const timer = setInterval(() => {
        current += increment;
        if (current >= targetConfidence) {
            setConfidence(targetConfidence);
            clearInterval(timer);
        } else {
            setConfidence(current);
        }
        }, interval);

        return () => clearInterval(timer);
    }, [prediction]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/welcome");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  

  const handleCollection = () => navigate("/collection");
  const handleScan = () => navigate("/scan");
  const handleProfile = () => navigate("/profile");
  const handleNotifications  = () => navigate("/tasks");

  if (loading) return <div className="loading">🌿 Analyzing image...</div>;
  if (prediction?.error) return <div className="error">{prediction.error}</div>;
  if (!prediction?.name) return <div className="error">No plant identified.</div>;

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidence / 100) * circumference;
  const cleanPlantId = prediction.name.split("(")[0].trim().toLowerCase().replace(/\s+/g, "_");

  const mainName = prediction.name.split("(")[0].trim();
  const secondaryName = prediction.name.includes("(")
    ? prediction.name.split("(")[1].replace(")", "").trim()
    : null;

  return (
    <div className="identification-page">
      <header className="identification-header">
        <img src="/logo_no_background.png" alt="Logo" className="identification-logo" />
        <div className="top-nav-user">
            <span>Hi, {userName} | </span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
      </header>

      <PageTransition>
      <div className="identification-content">
        <div className="greeting">
            <p>Your plant is</p>
            <h2 id="main">{mainName}</h2>
            <p id="secondary">({secondaryName})</p>
        </div>
        <div className="identification-image-container">
            <svg className="progress-ring" viewBox="0 0 260 260">
            <circle cx="130" cy="130" r="120" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
                cx="130"
                cy="130"
                r="120"
                fill="none"
                stroke="#059669"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="circle-progress"
            />
            </svg>

            <div className="plant-image-circle">
                <img src={URL.createObjectURL(file)} alt="Uploaded Plant" className="plant-image" />
            </div>

            <div className="confidence-badge">
                <span className="confidence-value">{Math.round(confidence)}%</span>
                <span className="confidence-label">match</span>
            </div>
        </div>
        <div className="feedback-buttons">          
            {!feedbackGiven ? (
            <>
                <p className="text-center mb-2">Is this identification correct?</p>
                <div className="button-row fade-in">
                    <button className="good-btn" onClick={() => handleFeedback(true)}>✓ Good Match</button>
                    <button className="bad-btn" onClick={() => handleFeedback(false)}>✗ Not a Match</button>
                </div>
                </>
                ) : (
                <div className="fade-in care-transition">
                    <p className="text-emerald-700 font-medium mb-3">Thanks for your feedback!</p>
                    <button
                        className="care-tips-btn"
                        onClick={() => navigate("/care-instructions", { state: { type: cleanPlantId } })}
                    >
                        🌿 Get Care Tips
                    </button>
                </div>
                )}
        </div>
      </div>

      </PageTransition>      
      <div className="bottom-nav">
        <button onClick={() => navigate("/")} className="nav-btn active">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ marginBottom: "0.25rem" }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </button>

        <button onClick={handleCollection} className="nav-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>

        <button onClick={handleScan} className="nav-btn scan-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
          </svg>
        </button>

        <button onClick={handleNotifications} className="nav-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

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

export default IdentificationResults;