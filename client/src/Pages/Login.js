import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (error) {
      alert("Invalid Credentials");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-form-container">
          <h2 className="auth-title">Login</h2>
          
          <form onSubmit={handleLogin} className="auth-form">
            <input
              type="email"
              placeholder="Email"
              className="auth-input"
              onChange={(e) => setEmail(e.target.value)}
              required
          />
            <input
              type="password"
              placeholder="Password"
              className="auth-input"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button 
              type="submit"
              className="auth-submit"
            >
              Login
            </button>
          </form>
          
          <div className="auth-link-container">
            <button
              onClick={() => navigate("/register")}
              className="auth-link"
            >
              Don't have an account? Sign Up
            </button>
          </div>
          
          <div className="auth-link-container">
            <button
              onClick={() => navigate("/welcome")}
              className="auth-link"
            >
              Back to welcome page
            </button>
          </div>
        </div>
      </div>
      <img 
        src="/LoginRegisterPageUpperHalfLeaf.png" 
        alt="Green Leaf" 
        className="auth-leaf-top"
      />
    </div>
  );
}