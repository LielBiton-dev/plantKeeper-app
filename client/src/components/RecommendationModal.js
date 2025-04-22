import React, { useState, useEffect, useRef, useCallback } from 'react';
import './RecommendationModal.css';
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

const RecommendationModal = ({ isOpen, onClose, mode = 'new' }) => {
  const [recommendation, setRecommendation] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState({
    firstName: '',
    userLocation: null,
    userPlants: []
  });
  const typingRef = useRef(null);
  
  // Function to clean Gemini's text output
  const cleanFormattingSymbols = (text) => {
    // Remove markdown formatting like asterisks, underscores, etc.
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1'); // Remove ** bold markers
    text = text.replace(/\*([^*]+)\*/g, '$1');     // Remove * italic markers
    text = text.replace(/__([^_]+)__/g, '$1');     // Remove __ bold markers
    text = text.replace(/_([^_]+)_/g, '$1');       // Remove _ italic markers
    text = text.replace(/\s{2,}/g, ' ');           // Fix any double spaces that might result from removing markers
    
    return text;
  };

  const getTitle = () => {
    return mode === 'new' ? 'Plant Recommendation' : 'Plant Care Tips';
  };
  
 // Function to fetch recommendations from Gemini API - wrapped in useCallback
  const fetchRecommendation = useCallback(async (firstName, userLocation, userPlants) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const API_KEY = 'AIzaSyCFyfQznIP42pcTLZ_Tvj4nHf7xdPvcBho';
      const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
      let prompt = '';

      if (mode === 'new') {
        prompt = `Recommend a houseplant for ${firstName || 'a beginner gardener'}.`;
        
        if (userLocation) {
          prompt += ` They live in ${userLocation}, so consider plants that would thrive in this climate.`;
        }

        if (userPlants && userPlants.length > 0) {
          const plantList = userPlants.map(plant => plant.replace(/_/g, ' ')).join(', ');
          prompt += ` They already have the following plants: ${plantList}. Suggest something different that would complement their collection.`;
        } else {
          prompt += ` Suggest a plant that's excellent for beginners.`;
        }

        prompt += ` Include the plant name, a brief description, care tips (water, light, soil, pet friendly), and why it would be a good choice. You can bold the user name and important details. With each iteration, try to vary the types of plants you offer, there are lots of optional houseplants.`;
      } 
      else if (mode === 'care') {
        // New prompt for care tips
        prompt = `${firstName || 'The user'} would like care tips for their existing plants.`;
        
        if (userPlants && userPlants.length > 0) {
          const plantList = userPlants.map(plant => plant.replace(/_/g, ' ')).join(', ');
          prompt += ` They have the following plants: ${plantList}.`;
          
          // Choose one plant to focus on for this tip
          const randomPlant = userPlants[Math.floor(Math.random() * userPlants.length)].replace(/_/g, ' ');
          prompt += ` Provide a specific care tip or trick to enhance the growth and appearance of their ${randomPlant}.`;
          
          if (userLocation) {
            prompt += ` Consider that they live in ${userLocation} when giving advice.`;
          }
          
          prompt += ` The tip should be something they might not know - a pro technique, seasonal adjustment, or enhancement that takes their plant care to the next level. You can bold the user name and important details. With each iteration, try to provide different tips for different plants in their collection.`;
        } else {
          prompt += ` They don't have any plants registered yet. Provide a general plant care tip that most indoor plant owners would find useful. You can bold the user name and important details. With each iteration, try to vary the tips so they receive different advice each time.`;
        }
      }

      prompt += ` IMPORTANT: Format your response as plain text ONLY. Do NOT use any Markdown formatting like asterisks (*), underscores (_), or hashtags (#). Do not use bullet points. Do not include headings. Use regular paragraph format with line breaks between paragraphs. Keep it under 100 words, concise and friendly, as if talking to a plant lover.`;
      
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
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 250,
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      let recommendationText = data.candidates[0].content.parts[0].text;
      recommendationText = cleanFormattingSymbols(recommendationText);
      
      setRecommendation(recommendationText);
      setDisplayedText('');
    } catch (err) {
      console.error('Error fetching recommendation:', err);
      setError('Failed to fetch plant recommendation. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [mode]);
  
  // Fetch user data and plants when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchUserData = async () => {
        try {
          const user = auth.currentUser;
          if (!user) return;
          const userDoc = await getDoc(doc(db, "users", user.uid));
          
          let firstName = "Plant Lover";
          let userLocation = null;
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            firstName = userData.firstName || "Plant Lover";
            if (userData.locationEnable === 1 && userData.userLocation) {
              userLocation = userData.userLocation;
            }
          }
          const userPlants = [];
          const userPlantDoc = await getDoc(doc(db, "user_plants", `user_${user.uid}`));
          
          if (userPlantDoc.exists() && userPlantDoc.data().plants) {
            userPlants.push(...userPlantDoc.data().plants);
          }
          
          setUserData({
            firstName,
            userLocation,
            userPlants
          });
          
          await fetchRecommendation(firstName, userLocation, userPlants);
          
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError('Failed to load your data. Please try again later.');
          setIsLoading(false);
        }
      };
      
      fetchUserData();
    }
    
    return () => {
      clearTimeout(typingRef.current);
    };
  }, [isOpen, fetchRecommendation]);  // Added fetchRecommendation to dependencies
  
  // Start typing animation
  useEffect(() => {
    if (isOpen && recommendation && displayedText.length < recommendation.length) {
      clearTimeout(typingRef.current);
      
      typingRef.current = setTimeout(() => {
        setDisplayedText(recommendation.substring(0, displayedText.length + 1));
      }, 20); // Slightly faster typing speed for better user experience
    }
  }, [isOpen, recommendation, displayedText]);
  
  // Generate a new recommendation with current user data
  const handleTryAnother = () => {
    fetchRecommendation(
      userData.firstName, 
      userData.userLocation, 
      userData.userPlants
    );
  };
  
  // Don't render anything if modal is closed
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        <h2>{getTitle()}</h2>
        
        <div className="recommendation-content">
          {isLoading && (
            <div className="loading">
              <svg className="loading-spinner" viewBox="0 0 50 50">
                <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
              </svg>
              <p>{mode === 'new' ? 'Finding the perfect plant for you...' : 'Crafting care tips for your plants...'}</p>
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
            <button className="modal-action-btn try-another" onClick={handleTryAnother}>
              {mode === 'new' ? 'Try Another Plant' : 'More Tips'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationModal;