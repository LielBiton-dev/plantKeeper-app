import React, { useState, useEffect, useRef } from "react";
import "./Journal.css";
import { IoIosArrowBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { FiCamera } from "react-icons/fi";
import { ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";
import { useLocation } from "react-router-dom";
import { storage } from "../firebase/firebase";
import { getAuth } from "firebase/auth";

const Journal = () => {
  const navigate = useNavigate();
  const [showEmptyAlt, setShowEmptyAlt] = useState(false);

  const location = useLocation();
  const plantId = location.state?.plantId;
  const plantName = location.state?.plantName;
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleImageUpload = async (file) => {
    if (!file) return;
  
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      alert("You must be signed in to upload.");
      return;
    }
  
    const userId = user.uid;
    const date = new Date().toISOString().split("T")[0]; // yyyy-mm-dd
    const filePath = `${userId}/${plantId}/${date}_${file.name}`;
  
    try {
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      console.log("Uploaded image:", url);
      alert("Upload successful!");
      // Optionally update state or DB here
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed.");
    }
  };

  const [plantImages, setPlantImages] = useState([]);

  const goToNext = () => {
    if (currentIndex < plantImages.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToIndex = (index) => {
    setCurrentIndex(index);
  };

  // Handle touch events for swipe
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  useEffect(() => {
    const fetchPlantImages = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user || !plantId) return;
  
      const folderRef = ref(storage, `${user.uid}/${plantId}`);
      try {
        const res = await listAll(folderRef);
        const imageData = await Promise.all(
          res.items.map(async (itemRef) => {
            const url = await getDownloadURL(itemRef);
            const name = itemRef.name; // e.g., 2025-05-23_Peace_lily.jpg
            const date = name.split("_")[0]; // "2025-05-23"
            return {
              uri: url,
              date: date,
              caption: '', // Optionally pull from metadata
            };
          })
        );
        setPlantImages(imageData);
      } catch (err) {
        console.error("Failed to fetch images:", err);
      }
    };
  
    fetchPlantImages();
  }, [plantId]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };


  return (
    <div className="page-container">
      <div className="journal-header">
        <div className="back-button back-btn-journal" onClick={() => navigate(-1)}>
          <IoIosArrowBack size={20} />
        </div>
        <div className="journal-title">{plantName} Journal</div>
          <div className="add-button-container">
            <button className="add-button">+</button>
            <div className="add-options">
              <div onClick={() => cameraInputRef.current.click()}>📷 Take Photo</div>
              <div onClick={() => fileInputRef.current.click()}>🖼 Upload from Device</div>
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={(e) => handleImageUpload(e.target.files[0])}
          />

          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={cameraInputRef}
            style={{ display: "none" }}
            onChange={(e) => handleImageUpload(e.target.files[0])}
          />
        </div>

      {plantImages.length > 0 ? (
        <div className="alternative-empty-container">
          <div className="content-container carousel-container">

            {/* Image Carousel */}
            <div 
                className="image-carousel"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Previous Image (Left) */}
                {currentIndex > 0 && (
                <div className="side-image-container left-image">
                    <img
                    src={plantImages[currentIndex - 1].uri}
                    alt={`Plant photo from ${plantImages[currentIndex - 1].date}`}
                    className="side-image"
                    loading="lazy"
                    />
                </div>
                )}
                
                {/* Current Image (Center) */}
                <div className="center-image-container">
                <img
                    src={plantImages[currentIndex].uri}
                    alt={`Plant photo from ${plantImages[currentIndex].date}`}
                    className="center-image"
                    loading="lazy"
                />
                <div className="image-overlay">
                    <div className="date-text">
                    {formatDate(plantImages[currentIndex].date)}
                    </div>
                    {plantImages[currentIndex].caption && (
                    <div className="caption-text">
                        {plantImages[currentIndex].caption}
                    </div>
                    )}
                </div>
                </div>

                {/* Next Image (Right) */}
                {currentIndex < plantImages.length - 1 && (
                <div className="side-image-container right-image">
                    <img
                    src={plantImages[currentIndex + 1].uri}
                    alt={`Plant photo from ${plantImages[currentIndex + 1].date}`}
                    className="side-image"
                    loading="lazy"
                    />
                </div>
                )}

                {/* Navigation Buttons */}
                {currentIndex > 0 && (
                <button
                    className="nav-button left-nav-button"
                    onClick={goToPrevious}
                    aria-label="Previous image"
                >
                    ←
                </button>
                )}

                {currentIndex < plantImages.length - 1 && (
                <button
                    className="nav-button right-nav-button"
                    onClick={goToNext}
                    aria-label="Next image"
                >
                    →
                </button>
                )}
                </div>

                {/* Timeline Dots */}
                <div className="timeline-container">
                    {plantImages.map((_, index) => (
                    <button
                        key={index}
                        className={`timeline-dot ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => goToIndex(index)}
                        aria-label={`Go to image ${index + 1}`}
                    />
                    ))}
                </div>
            </div>
        </div>
        ) : (
            <div className="content-container">
            <div className="journal-camera-icon">
                <FiCamera size={48} />
            </div>
            <h2 className="empty-title">No photos yet</h2>
            <p className="empty-description">
                Start documenting your Plant's growth journey
            </p>
            <button
                className="add-photo-button"
                onClick={() => alert("Add First Photo")}
            >
                Add First Photo
            </button>
            </div>
        )}
        </div>
  );
};

export default Journal;
