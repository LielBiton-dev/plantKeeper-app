import { useState, useEffect } from "react";
import { TopNav, BotNav } from '../components/Nav';
import { onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "../firebase/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import PageTransition from "../components/PageTransition";
import { IoFilterOutline } from "react-icons/io5";
import { IoChevronDown } from "react-icons/io5";
import "./Notifications.css";

const Notifications = () => {
  const [userName, setUserName] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPlants, setSelectedPlants] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [plantDropdownOpen, setPlantDropdownOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch user name
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData.firstName || "Plant Lover");
          } else {
            setUserName("Plant Lover");
          }
  
          // Fetch user notifications
          const notificationsRef = collection(db, "notifications");
          const q = query(notificationsRef, where("user_id", "==", user.uid));
          const querySnapshot = await getDocs(q);
  
          // Fetch plant names to map plant_id -> display name
          const plantsSnapshot = await getDocs(collection(db, "plants"));
          const plantNameMap = {};
          plantsSnapshot.forEach((doc) => {
            plantNameMap[doc.id] = doc.data().name || doc.id; 
            // If plant doc has "name" field, use it. Otherwise fallback to ID.
          });
  
          const fetchedNotifications = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const prettyPlantName = data.plant_id ? (plantNameMap[data.plant_id] || data.plant_id) : null;
  
            return {
              id: doc.id,
              type: data.type,
              plant: prettyPlantName || "Unknown Plant",
              scheduledDate: data.scheduled_date,
              isRead: data.isRead || false,
              icon: getIconByType(data.type),
              message: generateMessage(data.type, prettyPlantName),
              timeAgo: calculateTimeAgo(data.scheduled_date)
            };
          });
  
          // 🔥 Filter only notifications from today and sort
          const today = new Date();
          today.setHours(0, 0, 0, 0);
  
          const sortedNotifications = fetchedNotifications
            .filter(n => {
              const date = new Date(n.scheduledDate.year, n.scheduledDate.month - 1, n.scheduledDate.day);
              date.setHours(0, 0, 0, 0);
              return date >= today;
            })
            .sort((a, b) => {
              const aDate = new Date(a.scheduledDate.year, a.scheduledDate.month - 1, a.scheduledDate.day);
              const bDate = new Date(b.scheduledDate.year, b.scheduledDate.month - 1, b.scheduledDate.day);
              return aDate - bDate;
            });
  
          setNotifications(sortedNotifications);
  
        } catch (error) {
          console.error("Failed to fetch notifications:", error);
          setUserName("Plant Lover");
        }
      }
    });
  
    return () => unsubscribe();
  }, []);

  // Helper: get icon based on type
  const getIconByType = (type) => {
    switch (type) {
      case "watering":
        return "💧";
      case "fertilizer":
        return "🌱";
      case "repotting":
        return "🪴";
      case "light":
        return "☀️";
      case "tip":
        return "📚";
      default:
        return "🔔";
    }
  };

  // Helper: create a message based on type
  const generateMessage = (type, plantId) => {
    switch (type) {
      case "watering":
        return `Time to water your ${plantId}`;
      case "fertilizer":
        return `Fertilize your ${plantId}`;
      case "repotting":
        return `${plantId} needs a bigger pot`;
      case "light":
        return `Move ${plantId} to a brighter spot`;
      case "tip":
        return `Check the latest plant care tips!`;
      default:
        return `New notification`;
    }
  };

  // Helper: calculate time ago or in future
  const calculateTimeAgo = (scheduledDate) => {
    if (!scheduledDate) return "Unknown time";
  
    const { year, month, day } = scheduledDate;
    const scheduled = new Date(year, month - 1, day);
    const now = new Date();
  
    scheduled.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
  
    const diffTime = scheduled.getTime() - now.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays > 1) return `In ${diffDays} days`;
    if (diffDays === -1) return "1 day ago";
    if (diffDays > -7) return `${Math.abs(diffDays)} days ago`;
    return `${Math.abs(Math.floor(diffDays / 7))} week${Math.abs(Math.floor(diffDays / 7)) > 1 ? "s" : ""} ago`;
  };

  // Extract unique plant names and notification types for filters
  const plantOptions = [...new Set(notifications.filter(n => n.plant).map(n => n.plant))];
  const typeOptions = [...new Set(notifications.map(n => n.type))];

  // Apply filters
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

  const resetFilters = () => {
    setSelectedPlants([]);
    setSelectedTypes([]);
    setFilteredNotifications([]);
  };

  const togglePlantSelection = (plant) => {
    setSelectedPlants(prev => 
      prev.includes(plant) ? prev.filter(p => p !== plant) : [...prev, plant]
    );
  };

  const toggleTypeSelection = (type) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const displayedNotifications = filteredNotifications.length > 0
    ? filteredNotifications
    : notifications;

  const markAsRead = async (id) => {
    try {
      // Call Cloud Function instead of direct Firestore update
      const markNotificationAsRead = httpsCallable(functions, 'markNotificationAsRead');
      await markNotificationAsRead({ notificationId: id });

      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === id ? { ...notification, isRead: true } : notification
        )
      );

      setFilteredNotifications(prevFiltered => 
        prevFiltered.map(notification => 
          notification.id === id ? { ...notification, isRead: true } : notification
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const markAllNotificationsAsRead = httpsCallable(functions, 'markAllNotificationsAsRead');
      await markAllNotificationsAsRead();

      setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
      setFilteredNotifications(filteredNotifications.map(notification => ({ ...notification, isRead: true })));
    } catch (error) {
      console.error("❌ Failed to mark all notifications as read:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (plantDropdownOpen || typeDropdownOpen) {
        if (!event.target.closest('.filter-dropdown')) {
          setPlantDropdownOpen(false);
          setTypeDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [plantDropdownOpen, typeDropdownOpen]);

  return (
    <div className="page-container bg-light">
      <TopNav userName={userName} />
      <PageTransition>
        <div className="content-container notification-content">
          <h2 className="page-title">Notifications</h2>
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
                {/* Plant Filter Dropdown */}
                <div className="notification-filter-group">
                  <h3 className="notification-filter-title">Filter by Plant</h3>
                  <div className="filter-dropdown">
                    <button 
                      className={`filter-dropdown-toggle ${plantDropdownOpen ? 'open' : ''}`}
                      onClick={() => setPlantDropdownOpen(!plantDropdownOpen)}
                    >
                      <span>
                        {selectedPlants.length === 0 
                          ? 'Select plants' 
                          : `${selectedPlants.length} plant${selectedPlants.length > 1 ? 's' : ''} selected`}
                      </span>
                      <IoChevronDown />
                    </button>
                    
                    {plantDropdownOpen && (
                      <div className="filter-dropdown-menu">
                        {plantOptions.map(plant => (
                          <label key={plant} className="filter-dropdown-item">
                            <input
                              type="checkbox"
                              checked={selectedPlants.includes(plant)}
                              onChange={() => togglePlantSelection(plant)}
                              className="filter-dropdown-checkbox"
                            />
                            <span className="filter-dropdown-label">{plant}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Type Filter Dropdown */}
                <div className="notification-filter-group">
                  <h3 className="notification-filter-title">Filter by Type</h3>
                  <div className="filter-dropdown">
                    <button 
                      className={`filter-dropdown-toggle ${typeDropdownOpen ? 'open' : ''}`}
                      onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                    >
                      <span>
                        {selectedTypes.length === 0 
                          ? 'Select types' 
                          : `${selectedTypes.length} type${selectedTypes.length > 1 ? 's' : ''} selected`}
                      </span>
                      <IoChevronDown />
                    </button>
                    
                    {typeDropdownOpen && (
                      <div className="filter-dropdown-menu">
                        {typeOptions.map(type => (
                          <label key={type} className="filter-dropdown-item">
                            <input
                              type="checkbox"
                              checked={selectedTypes.includes(type)}
                              onChange={() => toggleTypeSelection(type)}
                              className="filter-dropdown-checkbox"
                            />
                            <span className="filter-dropdown-label">
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
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
