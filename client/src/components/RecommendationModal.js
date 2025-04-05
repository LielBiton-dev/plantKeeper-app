import React, { useState, useEffect, useRef } from 'react';
import './RecommendationModal.css';

const RecommendationModal = ({ isOpen, onClose }) => {
  const [recommendation, setRecommendation] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const typingRef = useRef(null);
  
  // Function to fetch recommendations from Gemini API
  const fetchRecommendation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Replace with your actual API key and endpoint
      const API_KEY = 'AIzaSyCFyfQznIP42pcTLZ_Tvj4nHf7xdPvcBho';
      const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
      
      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Recommend a houseplant for a beginner gardener. Include the plant name, a brief description, care tips (water, light, soil), and why it's a good choice for beginners. Keep it concise and friendly, as if talking to a plant lover."
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 100,
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      const recommendationText = data.candidates[0].content.parts[0].text;
      setRecommendation(recommendationText);
      
      // Reset displayed text for typing animation
      setDisplayedText('');
    } catch (err) {
      console.error('Error fetching recommendation:', err);
      setError('Failed to fetch plant recommendation. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Start typing animation
  useEffect(() => {
    if (isOpen && recommendation && displayedText.length < recommendation.length) {
      clearTimeout(typingRef.current);
      
      typingRef.current = setTimeout(() => {
        setDisplayedText(recommendation.substring(0, displayedText.length + 1));
      }, 20); // Slightly faster typing speed for better user experience
    }
  }, [isOpen, recommendation, displayedText]);
  
  // Fetch recommendation when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchRecommendation();
    }
    
    return () => {
      clearTimeout(typingRef.current);
    };
  }, [isOpen]);
  
  // Don't render anything if modal is closed
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        <h2>Plant Recommendation</h2>
        
        <div className="recommendation-content">
          {isLoading && (
            <div className="loading">
              <svg className="loading-spinner" viewBox="0 0 50 50">
                <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
              </svg>
              <p>Finding the perfect plant for you...</p>
            </div>
          )}
          {error && <div className="error">{error}</div>}
          {!isLoading && !error && (
            <div className="recommendation-text">
              {displayedText}
              {displayedText.length < recommendation.length && <span className="cursor">|</span>}
            </div>
          )}
        </div>
        
        {!isLoading && !error && displayedText.length === recommendation.length && (
          <div className="action-area">
            <button className="modal-action-btn try-another" onClick={fetchRecommendation}>
              Try Another
            </button>
            <button className="modal-action-btn add-to-collection">
              Add to My Collection
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationModal;