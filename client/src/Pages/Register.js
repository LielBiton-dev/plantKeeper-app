import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { User, userConverter } from "../firebase/user"; // Import the User model

export default function Register() {
  // Enhanced state management with all required fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // First, create the authentication user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      console.log("The user auth id: " + uid);
      
      // Then create a new User instance using our model
      const newUser = new User(
        uid,                // Use the Firebase Auth UID as our user ID
        firstName,
        lastName,
        email,
        new Date(),         // Current timestamp for registration date
        1                   // Enable notifications by default
      );
      
      // Save the user to Firestore using the converter
      const userRef = doc(db, "users", uid).withConverter(userConverter);
      await setDoc(userRef, newUser);
      
      // Redirect to login page after successful registration
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-form-container">
          <h2 className="auth-title">Sign Up</h2>
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}
          
          <form onSubmit={handleRegister} className="auth-form">
            <input
              type="text"
              placeholder="First Name"
              className="auth-input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Last Name"
              className="auth-input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              className="auth-input"              
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="auth-input"              
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button 
              type="submit"
              disabled={loading}
              style={{
                width: "100%", 
                backgroundColor: loading ? "#999" : "#333", 
                color: "white", 
                padding: "0.75rem",
                boxSizing: "border-box", 
                borderRadius: "0.375rem", 
                fontWeight: 500, 
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>
          
          <div className="auth-link-container">
            <button
              onClick={() => navigate("/login")}
              className="auth-link"            
              >
              Already have an account? Login
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