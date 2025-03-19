import { useNavigate } from "react-router-dom";

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-[#1a1a1a] relative overflow-hidden">
      {/* Decorative elements using CSS instead of images */}
      <div className="absolute top-0 right-0 w-1/3 h-1/4 bg-green-600 opacity-20 rounded-bl-full z-0"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/3 bg-green-700 opacity-20 rounded-tr-full z-0"></div>
      
      {/* Additional decorative elements */}
      <div className="absolute top-20 right-20 w-16 h-16 bg-green-500 opacity-10 rounded-full z-0"></div>
      <div className="absolute bottom-20 left-20 w-24 h-24 bg-green-800 opacity-10 rounded-full z-0"></div>

      {/* Content container */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 z-10">
        <div className="w-full max-w-xs text-center">
          <h1 className="text-3xl font-serif mb-10 text-white">Choose your option</h1>
          
          <div className="space-y-4">
            <button 
              onClick={() => navigate("/login")}
              className="w-full bg-[#2d2d2d] text-white py-3 rounded-md font-medium hover:bg-black transition-colors"
            >
              Login
            </button>
            
            <button 
              onClick={() => navigate("/register")}
              className="w-full bg-[#2d2d2d] text-white py-3 rounded-md font-medium hover:bg-black transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}