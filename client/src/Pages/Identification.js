import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "../firebase/firebase";
import { IoIosArrowBack } from "react-icons/io";
import PageTransition from "../components/PageTransition";
import axios from "axios";
import "./Identification.css";

let currentScanId = null; // Track scan document for feedback

const IdentificationResults = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const file = location.state?.file;

    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confidence, setConfidence] = useState(0);
    const [feedbackGiven, setFeedbackGiven] = useState(false);
    const [addingToCollection, setAddingToCollection] = useState(false);
    const [addedToCollection, setAddedToCollection] = useState(false);

    const hasPredicted = useRef(false); // ✅ Fix double call issue

    // Function to navigate back with error state
    const handleNoPlantIdentified = useCallback(() => {
        // Navigate back to scan page with error state
        navigate("/scan", { 
            state: { 
                showError: true, 
                errorMessage: "No plant identified. Try again" 
            } 
        });
    }, [navigate]);

    const handleFeedback = async (isGood) => {
        setFeedbackGiven(true);
        console.log(`User feedback: ${isGood ? 'Good' : 'Bad'} identification`);

        if (!currentScanId) {
            console.error("No scan ID found to update feedback.");
            return;
        }

        try {
            const updateScanFeedback = httpsCallable(functions, 'updateScanFeedback');
            await updateScanFeedback({
            scanId: currentScanId,
            feedback: isGood ? "good" : "bad"
            });
            console.log("Feedback saved to scan.");
        } catch (error) {
            console.error("Error updating feedback:", error);
        }
    };

    const handleAddToCollection = async () => {
        setAddingToCollection(true);
        try {
            const user = auth.currentUser;
            if (!user) {
                console.error("User not authenticated");
                return;
            }

            const addPlantToUserCollection = httpsCallable(functions, 'addPlantToUserCollection');
            await addPlantToUserCollection({ plantId: cleanPlantId });

            console.log("Plant added to collection:", cleanPlantId);
            setAddedToCollection(true);
        } catch (error) {
            console.error("Error adding plant to collection:", error);
        } finally {
            setAddingToCollection(false);
        }
    };

    useEffect(() => {
        if (!file || hasPredicted.current) return; // ✅ prevent second call

        console.log("Calling /predict for file:", file.name);

        const sendFileToModel = async () => {
            const startTime = Date.now();

            try {
                const formData = new FormData();
                formData.append("file", file);

                const response = await axios.post(
                    "https://coralengel-plant-recognition-api.hf.space/predict",
                    formData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                );

                const endTime = Date.now();
                const elapsed = endTime - startTime;

                const rawResults = response.data.results;
                const parsed = typeof rawResults === "string" ? JSON.parse(rawResults) : rawResults;

                // Check if no plant was identified
                if (!parsed[0]?.name) {
                    setLoading(false);
                    handleNoPlantIdentified();
                    return;
                }
                
                setPrediction(parsed[0]);
                await logScan(parsed[0], elapsed);

            } catch (error) {
                console.error("Prediction failed:", error);
                setPrediction({ error: "Failed to classify the image." });
            } finally {
                setLoading(false);
            }
        };

        sendFileToModel();
        hasPredicted.current = true; // ✅ lock after first call
    }, [file, handleNoPlantIdentified]);

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

    const logScan = async (predictionResult, latencyMs) => {
        try {
            const user = auth.currentUser;
            if (!user) {
            console.error("No authenticated user for scan log");
            return;
            }

            const createScan = httpsCallable(functions, 'createScan');
            const result = await createScan({
            prediction: {
                name: predictionResult.name,
                confidence: predictionResult.confidence,
            },
            latencyMs: latencyMs
            });

            currentScanId = result.data.scanId;
            console.log("Scan logged:", currentScanId);
        } catch (error) {
            console.error("Error logging scan:", error);
        }
    };

    if (loading) return <div className="loading">🌿 Analyzing image...</div>;
    if (prediction?.error) return <div className="error">{prediction.error}</div>;
    //if (!prediction?.name) return <div className="error">No plant identified.</div>;

    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (confidence / 100) * circumference;
    const cleanPlantId = prediction?.name?.split("(")[0].trim().toLowerCase().replace(/\s+/g, "_");
    const mainName = prediction?.name?.split("(")[0].trim();

    return (
        <div className="identification-page">
            <div className="back-button" onClick={() => navigate("/scan")}>
                <IoIosArrowBack size={20} />
                <span>Back</span>
            </div>
            <PageTransition>
                <div className="identification-content">
                    <div className="greeting">
                        <p>Your plant is</p>
                        <h2 id="main">{mainName}</h2>
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
                                <div className="action-buttons">
                                    <button
                                        className="care-tips-btn"
                                        onClick={() => navigate("/care-instructions", { state: { type: cleanPlantId } })}
                                    >
                                        🌿 Get Care Tips
                                    </button>
                                    <button
                                        className="care-tips-btn"
                                        onClick={handleAddToCollection}
                                        disabled={addingToCollection || addedToCollection}
                                    >
                                        {addingToCollection ? "Adding..." :
                                            addedToCollection ? "Added ✓" : "🪴 Add to Collection"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </PageTransition>
        </div>
    );
};

export default IdentificationResults;
