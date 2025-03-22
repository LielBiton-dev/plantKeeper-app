import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const Home = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userLocation, setUserLocation] = useState("");
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    //const auth = getAuth();
    //const db = getFirestore();
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get user profile from Firestore
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData.displayName || user.displayName || "Plant Lover");
            setUserLocation(userData.location || "Unknown Location");
          } else {
            setUserName(user.displayName || "Plant Lover");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        // User not logged in, redirect to welcome
        navigate("/welcome");
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);

  const handleScan = () => {
    navigate("/scan");
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  const handleRecommendations = () => {
    navigate("/recommendations");
  };

  return (
    <div style={{
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      backgroundColor: "#f5f0e6", 
      position: "relative", 
      overflow: "hidden"
    }}>
      {/* Content container */}
      <div style={{
        flex: 1, 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "flex-start", 
        padding: "2rem 1.5rem 5rem 1.5rem", 
        zIndex: 10
      }}>
        <div style={{
          width: "100%", 
          maxWidth: "30rem", 
          textAlign: "center",
          marginTop: "2rem"
        }}>
          {loading ? (
            <p style={{ color: "#333" }}>Loading your garden profile...</p>
          ) : (
            <>
              <h1 style={{ 
                fontSize: "2rem", 
                marginBottom: "1rem", 
                color: "#2e7d32", 
                fontFamily: "serif" 
              }}>
                Hello, {userName}!
              </h1>
              
              <p style={{ 
                fontSize: "1.25rem",
                color: "#333", 
                marginBottom: "0.5rem" 
              }}>
                Your plants are thriving today.
              </p>
              
              <p style={{ 
                color: "#666", 
                marginBottom: "2rem",
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "0.5rem" }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {userLocation}
              </p>
              
              <div style={{ marginTop: "4rem" }}>
                <button
                  onClick={handleRecommendations}
                  style={{
                    backgroundColor: "#2e7d32", 
                    color: "white", 
                    padding: "0.85rem 1.75rem", 
                    borderRadius: "2rem", 
                    fontWeight: 600, 
                    cursor: "pointer",
                    border: "none",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    fontSize: "1.1rem"
                  }}
                >
                  Get Recommendations
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Bottom navigation bar */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "space-around",
        backgroundColor: "white",
        padding: "0.75rem 0",
        boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
        zIndex: 20
      }}>
        {/* Home button */}
        <button
          onClick={() => navigate("/")}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#2e7d32",
            fontSize: "0.75rem",
            fontWeight: "bold"
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "0.25rem" }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          Home
        </button>
        
        {/* Scan button */}
        <button
          onClick={handleScan}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#666",
            fontSize: "0.75rem"
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "0.25rem" }}>
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
          Scan Plants
        </button>
        
        {/* Profile button */}
        <button
          onClick={handleProfile}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#666",
            fontSize: "0.75rem"
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "0.25rem" }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Profile
        </button>
      </div>
    </div>
  );
};

export default Home;