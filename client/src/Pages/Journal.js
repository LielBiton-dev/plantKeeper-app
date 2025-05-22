import React, { useState, useEffect } from "react";
import "./Journal.css";
import { IoIosArrowBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { FiCamera } from "react-icons/fi";

const Journal = ({ plantImages = [] }) => {
  const navigate = useNavigate();
  const [showEmptyAlt, setShowEmptyAlt] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

   // Sample data structure for your plant images
   const sampleImages = plantImages.length > 0 ? plantImages : [
    {
      id: 1,
      uri: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
      date: '2024-01-15',
      caption: 'First day - just planted!'
    },
    {
      id: 2,
      uri: 'https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=400&h=400&fit=crop',
      date: '2024-02-01',
      caption: 'First sprouts appearing'
    },
    {
      id: 3,
      uri: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
      date: '2024-02-15',
      caption: 'Growing strong'
    },
    {
      id: 4,
      uri: 'https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=400&h=400&fit=crop',
      date: '2024-03-01',
      caption: 'First leaves fully developed'
    },
    {
      id: 5,
      uri: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
      date: '2024-03-15',
      caption: 'Flowering stage'
    },
  ];

  const goToNext = () => {
    if (currentIndex < sampleImages.length - 1) {
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

  if (sampleImages.length === 0) {
    return (
      <div className="empty-container">
        <div className="empty-icon">📸</div>
        <h3 className="empty-text">No photos yet</h3>
        <p className="empty-subtext">
          Start documenting your plant's growth journey!
        </p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="journal-header">
        <div className="back-button" onClick={() => navigate(-1)}>
          <IoIosArrowBack size={20} />
        </div>
        <div className="journal-title">Monstera Journal</div>
        <div className="add-button" onClick={() => alert("Add photo clicked")}>
          +
        </div>
      </div>

      <div className="switch-container">
        <label className="switch">
          <input
            type="checkbox"
            checked={showEmptyAlt}
            onChange={() => setShowEmptyAlt((prev) => !prev)}
          />
          <span className="slider"></span>
        </label>
        <span className="switch-label">
          {showEmptyAlt ? "Empty View" : "Current View"}
        </span>
      </div>

      {showEmptyAlt ? (
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
                    src={sampleImages[currentIndex - 1].uri}
                    alt={`Plant photo from ${sampleImages[currentIndex - 1].date}`}
                    className="side-image"
                    loading="lazy"
                    />
                </div>
                )}
                
                {/* Current Image (Center) */}
                <div className="center-image-container">
                <img
                    src={sampleImages[currentIndex].uri}
                    alt={`Plant photo from ${sampleImages[currentIndex].date}`}
                    className="center-image"
                    loading="lazy"
                />
                <div className="image-overlay">
                    <div className="date-text">
                    {formatDate(sampleImages[currentIndex].date)}
                    </div>
                    {sampleImages[currentIndex].caption && (
                    <div className="caption-text">
                        {sampleImages[currentIndex].caption}
                    </div>
                    )}
                </div>
                </div>

                {/* Next Image (Right) */}
                {currentIndex < sampleImages.length - 1 && (
                <div className="side-image-container right-image">
                    <img
                    src={sampleImages[currentIndex + 1].uri}
                    alt={`Plant photo from ${sampleImages[currentIndex + 1].date}`}
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

                {currentIndex < sampleImages.length - 1 && (
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
                    {sampleImages.map((_, index) => (
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
                Start documenting your Monstera's growth journey
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
