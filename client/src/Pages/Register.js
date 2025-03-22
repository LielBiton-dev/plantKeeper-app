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
    <div style={{minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f5f0e6", position: "relative", overflow: "hidden"}}>
      {/* Content container */}
      <div style={{flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 1.5rem", zIndex: 10}}>
        <div style={{width: "100%", maxWidth: "20rem", textAlign: "center"}}>
          <h2 style={{fontSize: "1.875rem", marginBottom: "2rem", color: "#333", fontFamily: "serif"}}>Sign Up</h2>
          
          {error && (
            <div style={{
              padding: "0.75rem", 
              marginBottom: "1rem", 
              backgroundColor: "#fdecea", 
              color: "#b71c1c", 
              borderRadius: "0.375rem",
              fontSize: "0.875rem"
            }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleRegister} style={{display: "flex", flexDirection: "column", gap: "1rem"}}>
            <input
              type="text"
              placeholder="First Name"
              style={{width: "100%", padding: "0.75rem", border: "1px solid #ccc", borderRadius: "0.375rem", backgroundColor: "white"}}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Last Name"
              style={{width: "100%", padding: "0.75rem", border: "1px solid #ccc", borderRadius: "0.375rem", backgroundColor: "white"}}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              style={{width: "100%", padding: "0.75rem", border: "1px solid #ccc", borderRadius: "0.375rem", backgroundColor: "white"}}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              style={{width: "100%", padding: "0.75rem", border: "1px solid #ccc", borderRadius: "0.375rem", backgroundColor: "white"}}
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
                borderRadius: "0.375rem", 
                fontWeight: 500, 
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>
          
          <div style={{textAlign: "center", marginTop: "1.5rem"}}>
            <button
              onClick={() => navigate("/login")}
              style={{color: "#333", cursor: "pointer", background: "none", border: "none", textDecoration: "underline"}}
            >
              Already have an account? Login
            </button>
          </div>
          
          <div style={{textAlign: "center", marginTop: "1rem"}}>
            <button
              onClick={() => navigate("/welcome")}
              style={{color: "#333", cursor: "pointer", background: "none", border: "none", fontSize: "0.875rem", textDecoration: "underline"}}
            >
              Back to welcome page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}