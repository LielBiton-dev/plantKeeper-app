import { useNavigate } from "react-router-dom";

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-welcome-container">
        <div className="auth-form-container">
          <h1 className="auth-title">Welcome to PlantKeeper!</h1>
          
          <div className="auth-buttons">
            <button 
              onClick={() => navigate("/login")}
              className="auth-action-button"
            >
              Login
            </button>
            
            <button 
              onClick={() => navigate("/register")}
              className="auth-action-button"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
      <img 
        src="/WelcomePageButtomLeaf.png" 
        alt="Green Leaf" 
        className="auth-leaf-bottom"
      />
    </div>)
}

