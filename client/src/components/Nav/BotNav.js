import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoHomeOutline, IoPersonOutline, IoScan } from "react-icons/io5";
import { MdOutlineBookmarks } from "react-icons/md";
import { IoMdNotificationsOutline } from "react-icons/io";
import './BotNav.css';

const BotNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;

  return (
    <div className="navigation-container">
      <nav className="bottom-nav-new">
        <div className="nav-items">
          <button 
            onClick={() => navigate("/")} 
            className={`nav-item ${isActive("/") ? "active" : ""}`}
            aria-label="Home"
          >
            <div className="icon-container">
              <IoHomeOutline size={24} />
            </div>
            {isActive("/") && <span>Home</span>}
          </button>
          
          <button 
            onClick={() => navigate("/collection")} 
            className={`nav-item ${isActive("/collection") ? "active" : ""}`}
            aria-label="Collection"
          >
            <div className="icon-container">
              <MdOutlineBookmarks size={24} />
            </div>
            {isActive("/collection") && <span>Collection</span>}
          </button>
          
          {/* Center button with circle design */}
          <div className="center-button-container">
            <button 
              onClick={() => navigate("/allow-camera")} 
              className={`center-button ${isActive("/allow-camera") ? "active" : ""}`}
              aria-label="Scan"
            >
              <IoScan size={28} />
              {isActive("/allow-camera") && <span className="center-label">Scan</span>}
            </button>
          </div>
          
          <button 
            onClick={() => navigate("/notifications")} 
            className={`nav-item ${isActive("/notifications") ? "active" : ""}`}
            aria-label="Alerts"
          >
            <div className="icon-container">
              <IoMdNotificationsOutline size={24} />
            </div>
            {isActive("/notifications") && <span>Alerts</span>}
          </button>
          
          <button 
            onClick={() => navigate("/profile")} 
            className={`nav-item ${isActive("/profile") ? "active" : ""}`}
            aria-label="Profile"
          >
            <div className="icon-container">
              <IoPersonOutline size={24} />
            </div>
            {isActive("/profile") && <span>Profile</span>}
          </button>
        </div>
      </nav>
    </div>
  );
};

export default BotNav;