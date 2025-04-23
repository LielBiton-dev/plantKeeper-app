import React, { useState, useEffect } from "react";
import { TopNav, BotNav } from '../components/Nav';
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import PageTransition from "../components/PageTransition";
import "./Notifications.css";
import { IoFilterOutline } from "react-icons/io5";

const Notifications = () => {
  const [userName, setUserName] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPlants, setSelectedPlants] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData.firstName || "Plant Lover");
          } else {
            setUserName("Plant Lover");
          }
        } catch (error) {
          console.error("Failed to fetch user name:", error);
          setUserName("Plant Lover");
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'watering',
      plant: 'Monstera Deliciosa',
      message: 'Time to water your plant',
      timeAgo: '2 hours ago',
      isRead: false,
      icon: '💧'
    },
    {
      id: 2,
      type: 'fertilizer',
      plant: 'Snake Plant',
      message: 'Fertilizing reminder',
      timeAgo: '1 day ago',
      isRead: true,
      icon: '🌱'
    },
    {
      id: 3,
      type: 'repotting',
      plant: 'Fiddle Leaf Fig',
      message: 'Your plant needs a bigger pot',
      timeAgo: '3 days ago',
      isRead: false,
      icon: '🪴'
    },
    {
      id: 4,
      type: 'light',
      plant: 'Pothos',
      message: 'Consider moving to a brighter spot',
      timeAgo: '1 week ago',
      isRead: true,
      icon: '☀️'
    },
    {
      id: 5,
      type: 'tip',
      plant: null,
      message: 'New plant care guide available: Spring Care Tips',
      timeAgo: '2 weeks ago',
      isRead: true,
      icon: '📚'
    }
  ]);

  // Extract unique plant names and notification types for filter options
  const plantOptions = [...new Set(notifications.filter(n => n.plant).map(n => n.plant))];
  const typeOptions = [...new Set(notifications.map(n => n.type))];

  // Apply filters to notifications
  const applyFilters = () => {
    let results = [...notifications];
    
    if (selectedPlants.length > 0) {
      results = results.filter(notification => 
        notification.plant && selectedPlants.includes(notification.plant)
      );
    }
    
    if (selectedTypes.length > 0) {
      results = results.filter(notification => 
        selectedTypes.includes(notification.type)
      );
    }
    
    setFilteredNotifications(results);
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedPlants([]);
    setSelectedTypes([]);
    setFilteredNotifications([]);
  };

  // Toggle plant selection in filter without immediate filtering
  const togglePlantSelection = (plant) => {
    setSelectedPlants(prevSelected => 
      prevSelected.includes(plant)
        ? prevSelected.filter(p => p !== plant)
        : [...prevSelected, plant]
    );
  };

  // Toggle type selection in filter without immediate filtering
  const toggleTypeSelection = (type) => {
    setSelectedTypes(prevSelected => 
      prevSelected.includes(type)
        ? prevSelected.filter(t => t !== type)
        : [...prevSelected, type]
    );
  };

  // Display filtered notifications only if filters have been applied by clicking "Apply"
  const displayedNotifications = filteredNotifications.length > 0
    ? filteredNotifications
    : notifications;

  const markAsRead = (id) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, isRead: true } : notification
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
  };

  return (
    <div className="page-container bg-light">
      <TopNav userName={userName} />
      <PageTransition>
        <div className="content-container notification-content">
          <div className="notification-header-row">
            <h2 className="page-title">Notifications</h2>
          </div>

          <div className="notification-container">
            <div className="notification-actions">
              <button onClick={markAllAsRead} className="mark-all-button">
                Mark all as read
              </button>
              <button 
                className="notification-filter-toggle"
                onClick={() => setShowFilters(!showFilters)}
              >
                <span className="notification-filter-icon"> <IoFilterOutline size={22} /> </span>
              </button>
            </div>
            
            {showFilters && (
              <div className="notification-filter-panel">
                <div className="notification-filter-group">
                  <h3 className="notification-filter-title">Filter by Plant</h3>
                  <div className="notification-filter-options">
                    {plantOptions.map(plant => (
                      <label key={plant} className="notification-filter-option">
                        <input
                          type="checkbox"
                          checked={selectedPlants.includes(plant)}
                          onChange={() => togglePlantSelection(plant)}
                          className="notification-filter-checkbox"
                        />
                        <span className="notification-filter-label">{plant}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="notification-filter-group">
                  <h3 className="notification-filter-title">Filter by Type</h3>
                  <div className="notification-filter-options">
                    {typeOptions.map(type => (
                      <label key={type} className="notification-filter-option">
                        <input
                          type="checkbox"
                          checked={selectedTypes.includes(type)}
                          onChange={() => toggleTypeSelection(type)}
                          className="notification-filter-checkbox"
                        />
                        <span className="notification-filter-label">
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="notification-filter-actions">
                  <button className="notification-filter-apply" onClick={applyFilters}>
                    Apply
                  </button>
                  <button className="notification-filter-reset" onClick={resetFilters}>
                    Reset
                  </button>
                </div>
              </div>
            )}
            
            {filteredNotifications.length > 0 && (
              <div className="notification-filter-summary">
                Showing {filteredNotifications.length} of {notifications.length} notifications
              </div>
            )}
            
            {displayedNotifications.length > 0 ? (
              displayedNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-card ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    <span>{notification.icon}</span>
                  </div>

                  <div className="notification-content-inner">
                    <div className="notification-header-row">
                      <span className="notification-plant">
                        {notification.plant || 'PlantPal'}
                      </span>
                      <span className="notification-time">{notification.timeAgo}</span>
                    </div>

                    <p className="notification-message">{notification.message}</p>

                    {!notification.isRead && <div className="notification-dot" />}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">No matching notifications</h3>
                <p className="text-gray-500">Try adjusting your filters</p>
              </div>
            )}
          </div>
          <div className="bottom-spacing"></div>
        </div>
      </PageTransition>
      <BotNav />    
    </div>
  );
};

export default Notifications;