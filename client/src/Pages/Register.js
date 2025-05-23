import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, functions } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Focus states for floating labels
  const [isFocusedFirstName, setIsFocusedFirstName] = useState(false);
  const [isFocusedLastName, setIsFocusedLastName] = useState(false);
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // 1. Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("User created:", userCredential.user.uid);
      
      // 2. Create user document
      const createUserDocument = httpsCallable(functions, 'createUserDocument');
      await createUserDocument();
      
      // 3. Update user profile with firstName/lastName
      const updateUserProfile = httpsCallable(functions, 'updateUserProfile');
      await updateUserProfile({
        firstName: firstName,
        lastName: lastName
      });
      
      console.log("Registration completed successfully");
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div
      className="login-page-container"
      style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/login_back2.jpg)` }}
    >
      <form onSubmit={handleRegister}>
        <h1>Sign Up</h1>
        
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}
        
        <div className="floating-label-group">
          <input
            type="text"
            id="firstName"
            className="glass-input"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            onFocus={() => setIsFocusedFirstName(true)}
            onBlur={() => setIsFocusedFirstName(false)}
            placeholder={isFocusedFirstName ? "" : "Enter your First Name"}
            required
          />
          <label 
            htmlFor="firstName" 
            className={`floating-label ${isFocusedFirstName || firstName ? 'active' : ''}`}
          >
            First Name
          </label>
        </div>
        
        <div className="floating-label-group">
          <input
            type="text"
            id="lastName"
            className="glass-input"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            onFocus={() => setIsFocusedLastName(true)}
            onBlur={() => setIsFocusedLastName(false)}
            placeholder={isFocusedLastName ? "" : "Enter your Last Name"}
            required
          />
          <label 
            htmlFor="lastName" 
            className={`floating-label ${isFocusedLastName || lastName ? 'active' : ''}`}
          >
            Last Name
          </label>
        </div>
        
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
          {loading ? "Creating Account..." : "Sign Up"}
        </button>
        
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="auth-link"
        >
          Already have an account? Login
        </button>
      </form>
    </div>
  );
}