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
    <div style={{minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f5f0e6", position: "relative", overflow: "hidden"}}>
      {/* Content container */}
      <div style={{flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 1.5rem", zIndex: 10}}>
        <div style={{width: "100%", maxWidth: "20rem", textAlign: "center"}}>
          <h2 style={{fontSize: "1.875rem", marginBottom: "2rem", color: "#333", fontFamily: "serif"}}>Login</h2>
          
          <form onSubmit={handleLogin} style={{display: "flex", flexDirection: "column", gap: "1rem"}}>
            <input
              type="email"
              placeholder="Email"
              style={{width: "100%", padding: "0.75rem", border: "1px solid #ccc", borderRadius: "0.375rem", backgroundColor: "white"}}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              style={{width: "100%", padding: "0.75rem", border: "1px solid #ccc", borderRadius: "0.375rem", backgroundColor: "white"}}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button 
              type="submit"
              style={{width: "100%", backgroundColor: "#333", color: "white", padding: "0.75rem", borderRadius: "0.375rem", fontWeight: 500, cursor: "pointer"}}
            >
              Login
            </button>
          </form>
          
          <div style={{textAlign: "center", marginTop: "1.5rem"}}>
            <button
              onClick={() => navigate("/register")}
              style={{color: "#333", cursor: "pointer", background: "none", border: "none", textDecoration: "underline"}}
            >
              Don't have an account? Sign Up
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
//color: "rgba(37, 36, 36, 0.7)"