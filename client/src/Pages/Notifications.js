import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import "./Notifications.css";

const Notifications = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");


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
    } , []);

  const handleCollection = () => navigate("/collection");
  const handleScan = () => navigate("/scan");
  const handleProfile = () => navigate("/profile");
  const handleNotifications  = () => navigate("/tasks");
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/welcome");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

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

  const markAsRead = (id) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, isRead: true } : notification
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
  };


  return (
    <div className="notification-page">
      {/* Top navigation bar */}
      <div className="top-nav">
        <div className="top-nav-logo">
          <img src="logo_no_background.png" alt="Plant Logo" />
        </div>
        <div className="top-nav-user">
          <span>Hi, {userName} | </span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
      
      <div className="notification-content">
        <div className="notification-header-row">
          <h2 className="notification-title">Notifications</h2>
          <button onClick={markAllAsRead} className="mark-all-button">
            Mark all as read
          </button>
        </div>

        <div className="notification-container">
          {notifications.map(notification => (
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
          ))}
        </div>
      </div>

      {notifications.length === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🔔</div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">No notifications</h3>
              <p className="text-gray-500">You're all caught up!</p>
            </div>
          )}

 
      
      {/* Bottom navigation bar */}
      <div className="bottom-nav">
        {/* Home button */}
        <button onClick={() => navigate("/")} className="nav-btn active">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "0.25rem" }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </button>
        
        {/* Bookmarks button */}
        <button onClick={handleCollection} className="nav-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>

        {/* Scan button */}
        <button onClick={handleScan} className="nav-btn scan-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
            <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
            <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
            <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
          </svg>
        </button>
        
        {/* Notifications button */}
        <button onClick={handleNotifications} className="nav-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </button>
        
        {/* Profile button */}
        <button onClick={handleProfile} className="nav-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Notifications;
