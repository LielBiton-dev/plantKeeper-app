import { useNavigate } from "react-router-dom";

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div style={{minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f5f0e6", position: "relative", overflow: "hidden"}}>
      {/* Content container */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "0 1.5rem", zIndex: 10, marginTop: "15vh" }}>
        <div style={{width: "100%", maxWidth: "20rem", textAlign: "center"}}>
          <h1 style={{fontSize: "1.875rem", marginBottom: "2.5rem", color: "#333", fontFamily: "serif"}}>Welcome to PlantKeeper!</h1>
          
          <div style={{display: "flex", flexDirection: "column"}}>
            <button 
              onClick={() => navigate("/login")}
              style={{width: "100%", backgroundColor: "#333", color: "white", padding: "0.75rem", cursor: "pointer", borderRadius: "0.375rem", fontWeight: 500, marginBottom: "1rem"}}
            >
              Login
            </button>
            
            <button 
              onClick={() => navigate("/register")}
              style={{width: "100%", backgroundColor: "#333", color: "white", padding: "0.75rem", cursor: "pointer", borderRadius: "0.375rem", fontWeight: 500}}
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
      {/* Image at the bottom */}
      <img 
      src="/welcome_big_green_leaf.png" 
      alt="Green Leaf" 
      style={{
        width: "350px",  // Adjust width
        height: "350px", // Adjust height
        objectFit: "cover", // Keep original proportions
        position: "absolute",
        bottom: "-140px", // Move slightly up from bottom
        left: "50%", // Center it horizontally
        transform: "translateX(-50%)" // Ensure perfect centering
      }} 
    />
    </div>
  );
}