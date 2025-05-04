import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase";
import "./PlantScan.css";
import { IoIosArrowBack } from "react-icons/io";

const PlantScan = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [fileName, setFileName] = useState("");
  
  // Check if user is authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        console.log("No authenticated user, redirecting");
        navigate("/welcome");
      }
    });  
    return () => unsubscribe();
  }, [navigate]);

  // Handle file selection from device library
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Handle photo taken with camera
  const handleCameraCapture = (event) => {
    const file = event.target.files[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Process the selected/captured file
  const processSelectedFile = (file) => {
    // Create a preview URL
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setFileName(file.name);
    
    // Here you would send the file to your API
    console.log("File selected:", file.name);
    
    // Example: navigate to results after processing
    navigate("/identification", { state: { file }});
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };
  
  const handleTakePhoto = () => {
    cameraInputRef.current.click();
  };

  const handleTakeAnotherPhoto = () => {
    setSelectedImage(null);
    setFileName("");
    cameraInputRef.current.click();
  };

  return (
    <div className="scan-container">
      <div 
        className="back-button" 
        onClick={() => navigate("/")}
        style={{ color: "white" }}
      >
        <IoIosArrowBack size={20} color="white" />
        <span>Back</span>
      </div>
      <div className="scan-content">
        <div className="scan-instruction">
          <h2>Get ready to scan your image</h2>
        </div>
        
        <div className="image-preview-container">
          <div className="image-preview">
            {selectedImage ? (
              <img 
                src={selectedImage}
                alt="Selected plant" 
                className="default-image" 
              />
            ) : (
              <img 
                src="/ScanScreen.png"
                alt="Sample plant" 
                className="default-image" 
              />
            )}
          </div>
        </div>

        <div className="scan-actions">
          {/* Hidden file inputs */}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            ref={fileInputRef}
            style={{ display: "none" }}
          />
          
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            ref={cameraInputRef}
            style={{ display: "none" }}
          />
          
          {selectedImage ? (
            <>
              <div className="file-selected">
                <span>{fileName}</span>
              </div>
              
              <button 
                className="scan-btn upload-btn"
                onClick={() => console.log("Process image and navigate to results")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Upload image
              </button>
              
              <button 
                className="scan-btn photo-btn"
                onClick={handleTakeAnotherPhoto}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                Take another photo
              </button>
            </>
          ) : (
            <>
              <button 
                className="scan-btn upload-btn"
                onClick={handleUploadClick}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Upload from library
              </button>
              
              <button 
                className="scan-btn photo-btn"
                onClick={handleTakePhoto}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                Take a photo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlantScan;