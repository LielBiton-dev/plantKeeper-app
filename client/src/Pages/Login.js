// Login.js
import { useState } from "react";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);
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
  
  const handleGoogleSignIn = async (e) => {
    e.preventDefault();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (error) {
      console.error("Google sign in error:", error);
      alert("Google sign in failed. Please try again.");
    }
  };

  return (
    <div
      className="login-page-container"
      style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/login_back2.jpg)` }}
    >
      <form onSubmit={handleLogin}>
        <h1>Login</h1>
        
        <div className="floating-label-group">
          <input
            type="email"
            id="email"
            className="glass-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setIsFocusedEmail(true)}
            onBlur={() => setIsFocusedEmail(false)}
            placeholder={isFocusedEmail ? "" : "Enter your Email"}
            required
          />
          <label 
            htmlFor="email" 
            className={`floating-label ${isFocusedEmail || email ? 'active' : ''}`}
          >
            Email
          </label>
        </div>
        
        <div className="floating-label-group">
          <input
            type="password"
            id="password"
            className="glass-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setIsFocusedPassword(true)}
            onBlur={() => setIsFocusedPassword(false)}
            placeholder={isFocusedPassword ? "" : "Enter your Password"}
            required
          />
          <label 
            htmlFor="password" 
            className={`floating-label ${isFocusedPassword || password ? 'active' : ''}`}
          >
            Password
          </label>
        </div>
        
        <button type="submit" className="login_button">Login</button>
        
        <div className="divider">
          <span>or</span>
        </div>
        
        <button 
          type="button" 
          onClick={handleGoogleSignIn} 
          className="google-signin-button"
        >
          <img 
            src={`${process.env.PUBLIC_URL}/google-icon.png`} 
            alt="Google" 
            className="google-icon" 
          />
          Sign in with Google
        </button>
        
        <button
          type="button"
          onClick={() => navigate("/register")}
          className="auth-link"
        >
          Don't have an account? Sign Up
        </button>
      </form>
    </div>
  );
}