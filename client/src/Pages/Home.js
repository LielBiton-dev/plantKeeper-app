import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div style={{minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "blue", position: "relative", overflow: "hidden"}}>
      {/* Content container */}
      <div style={{flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 1.5rem", zIndex: 10}}>
        <div style={{width: "100%", maxWidth: "30rem", textAlign: "center"}}>
          <h1 style={{fontSize: "2.25rem", marginBottom: "1.5rem", color: "white", fontFamily: "serif"}}>Welcome to the Home Page</h1>
          
          <p style={{color: "white", marginBottom: "2rem"}}>You've successfully logged in!</p>
          
          <button
            onClick={() => navigate("/welcome")}
            style={{
              backgroundColor: "#333", 
              color: "white", 
              padding: "0.75rem 1.5rem", 
              borderRadius: "0.375rem", 
              fontWeight: 500, 
              cursor: "pointer",
              border: "none"
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;