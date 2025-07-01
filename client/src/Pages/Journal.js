import React, { useState, useEffect, useRef, useCallback } from "react";
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
  const [loading, setLoading] = useState(true);

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

  const goToNext = useCallback(() => {
    if (currentIndex < plantImages.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, plantImages.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

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
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch images:", err);
        setLoading(false);
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
  }, [currentIndex, goToPrevious, goToNext]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatMonthYear = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    year: '2-digit',
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

      {loading ? (
      <div className="content-container loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">Loading journal...</p>
      </div>
    ) : plantImages.length > 0 ? (
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
                    <div
                      className="side-image-container left-image"
                      onClick={goToPrevious}          /* ← click on left image to go back */
                      style={{ cursor: "pointer" }}   /* make it clear it's clickable */
                    >
                      <img
                        src={plantImages[currentIndex - 1].uri}
                        alt={`${plantName} growth on ${plantImages[currentIndex - 1].date}`}
                        //alt={`Plant photo from ${plantImages[currentIndex - 1].date}`}
                        className="side-image"
                        loading="lazy"
                      />
                    </div>
                  )}
                
                {/* Current Image (Center) */}
                <div className="center-image-container">
                <img
                    src={plantImages[currentIndex].uri}
                    alt={`${plantName} growth on ${plantImages[currentIndex].date}`}
                    //alt={`Plant photo from ${plantImages[currentIndex].date}`}
                    className="center-image"
                    loading="lazy"
                />
                <div className="image-overlay">
                    <div className="date-badge">
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
                    <div
                      className="side-image-container right-image"
                      onClick={goToNext}              /* ← click on right image to advance */
                      style={{ cursor: "pointer" }}
                    >
                      <img
                        src={plantImages[currentIndex + 1].uri}
                        alt={`${plantName} growth on ${plantImages[currentIndex + 1].date}`}
                        //alt={`Plant photo from ${plantImages[currentIndex + 1].date}`}
                        className="side-image"
                        loading="lazy"
                      />
                    </div>
                  )}

                </div>

                {/* Timeline Dots */}
                <div className="timeline-container">
                  {plantImages.map((img, index) => (
                    <div key={index} className="timeline-entry">
                      <div className={`timeline-dot ${index === currentIndex ? 'active' : ''}`}/>
                      <span className="timeline-label">{formatMonthYear(img.date)}</span>
                      {index !== plantImages.length - 1 && <div className="timeline-line" />}
                    </div>
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
                onClick={() => fileInputRef.current.click()}
            >
                Add Your First Photo
            </button>
            </div>
        )}
        </div>
  );
};

export default Journal;
