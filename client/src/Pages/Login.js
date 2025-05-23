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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); 
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);  
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (error) {
      console.error("Google sign in error:", error);
      setError("Google sign in failed. Please try again."); 
    } finally {
      setLoading(false);
    }
  };

  // Check if we're in development mode
  const isEmulator = process.env.NODE_ENV === 'development';

  return (
    <div
      className="login-page-container"
      style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/login_back2.jpg)` }}
    >
      <form onSubmit={handleLogin}>
        <h1>Login</h1>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}
        
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
        
        <button 
          type="submit" 
          className="login_button"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Login"}
        </button>
        
        {/* Only show Google sign-in in production or add a note in development */}
        {!isEmulator ? (
          <>
            <div className="divider">
              <span>or</span>
            </div>
            
            <button 
              type="button" 
              onClick={handleGoogleSignIn} 
              className="google-signin-button"
              disabled={loading}
            >
              <img 
                src={`${process.env.PUBLIC_URL}/google-icon.png`} 
                alt="Google" 
                className="google-icon" 
              />
              {loading ? "Signing in..." : "Sign in with Google"}
            </button>
          </>
        ) : (
          <div className="emulator-note">
            <p style={{ fontSize: '0.9em', color: '#ffffff', textAlign: 'center', marginTop: '1rem' }}>
              Google sign-in disabled in development mode
            </p>
          </div>
        )}
        
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