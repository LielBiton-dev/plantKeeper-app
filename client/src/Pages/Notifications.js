import React, { useState, useEffect } from "react";
import { TopNav, BotNav } from '../components/Nav';
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import PageTransition from "../components/PageTransition";
import "./Notifications.css";

const Notifications = () => {
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
    <div className="page-container bg-light">
      <TopNav userName={userName} />
      <PageTransition>
      <div className="content-container notification-content">
        <div className="notification-header-row">
          <h2 className="page-title">Notifications</h2>
        </div>

        <div className="notification-container">
          <button onClick={markAllAsRead} className="mark-all-button">
              Mark all as read
          </button>
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

      </PageTransition>
      <BotNav />    
    </div>
  );
};

export default Notifications;
