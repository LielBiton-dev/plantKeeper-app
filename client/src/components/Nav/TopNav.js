import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebase';

// Changed from topNav to TopNav (capitalized)
const TopNav = ({ userName }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/welcome');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="top-nav">
      <div className="top-nav-logo">
        <img 
          src="/logo_no_background.png" 
          alt="Plant Logo" 
          style={{ width: '32px', height: '32px' }}  // Match the previous SVG size
        />
      </div>
      <div className="top-nav-user">
        <span>Hi, {userName} | </span>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default TopNav;