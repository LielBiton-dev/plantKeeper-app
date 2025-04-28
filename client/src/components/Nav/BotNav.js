import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LuScanSearch } from "react-icons/lu";
import { MdHomeFilled } from "react-icons/md";
import { IoMdPerson, IoIosNotifications, IoIosHeart} from "react-icons/io";
import './BotNav.css';

const BotNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;

  const handleChange = (path) => {
    navigate(path);
  };

  const paths = {
    home: "/",
    collection: "/collection",
    scan: "/allow-camera",
    notifications: "/notifications",
    profile: "/profile"
  };

  return (
    <nav className="navbar">
      <div className="tabs">
        <input 
          id="tab-home" 
          type="radio" 
          name="nav-group" 
          checked={isActive(paths.home)} 
          onChange={() => handleChange(paths.home)}
        />
        <input 
          id="tab-collection" 
          type="radio" 
          name="nav-group" 
          checked={isActive(paths.collection)} 
          onChange={() => handleChange(paths.collection)}
        />
        <input 
          id="tab-scan" 
          type="radio" 
          name="nav-group" 
          checked={isActive(paths.scan)} 
          onChange={() => handleChange(paths.scan)}
        />
        <input 
          id="tab-notifications" 
          type="radio" 
          name="nav-group" 
          checked={isActive(paths.notifications)} 
          onChange={() => handleChange(paths.notifications)}
        />
        <input 
          id="tab-profile" 
          type="radio" 
          name="nav-group" 
          checked={isActive(paths.profile)} 
          onChange={() => handleChange(paths.profile)}
        />
        
        <div className="buttons">
          <label htmlFor="tab-home">
            <MdHomeFilled size={26}/>
          </label>
          <label htmlFor="tab-collection">
            <IoIosHeart size={25}/>
          </label>
          <label htmlFor="tab-scan">
            <LuScanSearch size={28} />
          </label>
          <label htmlFor="tab-notifications">
            <IoIosNotifications size={28} />
          </label>
          <label htmlFor="tab-profile">
            <IoMdPerson size={24} />
          </label>
          <div className="underline"></div>
        </div>
      </div>
    </nav>
  );
};

export default BotNav;