import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/login");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f0e6] relative overflow-hidden">
      {/* Green leaves decoration - top right and bottom left */}
      <div className="absolute top-0 right-0 w-1/3 h-1/4 overflow-hidden z-0">
        <img 
          src="/path-to-your-leaf-image.png" 
          alt="Decorative leaf" 
          className="w-full object-cover"
        />
      </div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/3 overflow-hidden z-0">
        <img 
          src="/path-to-your-leaf-image.png" 
          alt="Decorative leaf" 
          className="w-full object-cover"
        />
      </div>

      {/* Media controls - these would be just for design, non-functional */}
      <div className="absolute bottom-0 w-full flex justify-center items-center bg-black bg-opacity-20 py-3 z-10">
        <div className="flex space-x-6 text-white">
          <button className="focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button className="focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button className="focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button className="focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button className="focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.06-7.072M4.464 4.464a9 9 0 001.414 12.728" />
            </svg>
          </button>
        </div>
      </div>

      {/* Register form container */}
      <div className="flex-1 flex items-center justify-center px-6 z-10">
        <div className="w-full max-w-xs">
          <h2 className="text-3xl font-serif text-center mb-8">Sign Up</h2>
          
          <form onSubmit={handleRegister} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 border border-gray-300 rounded-md bg-white"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 border border-gray-300 rounded-md bg-white"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button 
              type="submit"
              className="w-full bg-[#2d2d2d] text-white py-3 rounded-md font-medium hover:bg-black transition-colors"
            >
              Sign Up
            </button>
          </form>
          
          <div className="text-center mt-6">
            <button
              onClick={() => navigate("/login")}
              className="text-gray-700 hover:text-black"
            >
              Already have an account? Login
            </button>
          </div>
          
          <div className="text-center mt-4">
            <button
              onClick={() => navigate("/welcome")}
              className="text-gray-600 hover:text-black text-sm"
            >
              Back to welcome page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}