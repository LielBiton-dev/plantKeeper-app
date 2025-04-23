import React, { useState, useEffect } from "react";
import { TopNav, BotNav } from '../components/Nav';
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import PageTransition from "../components/PageTransition";
import { 
  IoPersonOutline,
  IoNotificationsOutline, 
  IoLocationOutline, 
  IoLockClosedOutline, 
  IoTrashOutline,
  IoSettingsOutline,
  IoChevronForwardOutline,
  IoChevronDownOutline
} from "react-icons/io5";
import "./Profile.css";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    notificationsEnabled: false,
    locationEnabled: false
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Accordion state
  const [openSection, setOpenSection] = useState(null);

  // Fetch user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          setLoading(true);
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser(userData);
            
            // Set form data from user data
            setFormData({
              firstName: userData.firstName || "",
              lastName: userData.lastName || "",
              email: userData.email || currentUser.email || "",
              notificationsEnabled: userData.notificationsEnabled === 1,
              locationEnabled: userData.locationEnable === 1
            });
          } else {
            setError("User profile not found");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setError("Failed to load profile data");
        } finally {
          setLoading(false);
        }
      } else {
        navigate("/welcome");
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Not authenticated");
      
      const userRef = doc(db, "users", currentUser.uid);
      
      await updateDoc(userRef, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        notificationsEnabled: formData.notificationsEnabled ? 1 : 0,
        locationEnable: formData.locationEnabled ? 1 : 0
      });
      
      setSuccess(true);
      setOpenSection(null);
      
      // Update local user state to reflect changes
      setUser({
        ...user,
        firstName: formData.firstName,
        lastName: formData.lastName,
        notificationsEnabled: formData.notificationsEnabled ? 1 : 0,
        locationEnable: formData.locationEnabled ? 1 : 0
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section) => {
    if (openSection === section) {
      setOpenSection(null);
    } else {
      setOpenSection(section);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <TopNav userName={formData.firstName || "User"} />
        <div className="content-container">
          <div className="loading-animation">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading your profile...</p>
          </div>
        </div>
        <BotNav />
      </div>
    );
  }

  return (
    <div className="page-container profile-page">
      <TopNav userName={formData.firstName || "User"} />
      
      <PageTransition>
        <main className="content-container profile-content">
          
          {success && (
            <div className="success-message">
              Profile updated successfully!
            </div>
          )}
          
          {error && (
            <div className="error-text">
              {error}
            </div>
          )}
          
          <div className="profile-header">
              <div className="profile-initials">
                  {formData.firstName ? formData.firstName.charAt(0).toUpperCase() : ""}
                  {formData.lastName ? formData.lastName.charAt(0).toUpperCase() : ""}
                </div>
            <h1 className="profile-name">{formData.firstName || ""} {formData.lastName || ""}</h1>
            <p className="profile-account-type">Personal Account</p>
          </div>
          
          {/* Accordion Menu */}
          <div className="profile-menu">
            {/* My Account Section */}
            <div className="menu-item">
              <button 
                className="menu-button" 
                onClick={() => toggleSection('myAccount')}
              >
                <div className="menu-icon">
                  <IoPersonOutline />
                </div>
                <span className="menu-title">My account</span>
                <div className="menu-arrow">
                  {openSection === 'myAccount' ? <IoChevronDownOutline /> : <IoChevronForwardOutline />}
                </div>
              </button>
              
              {openSection === 'myAccount' && (
                <div className="menu-content">
                  <div className="account-form">
                    <div className="form-field">
                      <div className="field-label">First Name</div>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="field-input"
                      />
                    </div>
                    
                    <div className="form-field">
                      <div className="field-label">Last Name</div>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="field-input"
                      />
                    </div>
                    
                    <div className="form-field">
                      <div className="field-label">Email</div>
                      <div className="email-field">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          className="field-input disabled"
                          disabled
                        />
                        <div className="field-note">Email cannot be changed</div>
                      </div>
                    </div>
                    
                    <div className="form-actions">
                      <button
                        className="save-button"
                        onClick={handleSubmit}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Settings Section */}
            <div className="menu-item">
              <button 
                className="menu-button" 
                onClick={() => toggleSection('settings')}
              >
                <div className="menu-icon settings-icon">
                  <IoSettingsOutline />
                </div>
                <span className="menu-title">Settings</span>
                <div className="menu-arrow">
                  {openSection === 'settings' ? <IoChevronDownOutline /> : <IoChevronForwardOutline />}
                </div>
              </button>
              
              {openSection === 'settings' && (
                <div className="menu-content">
                  <div className="settings-content">
                    <div className="setting-item">
                      <div className="setting-icon notification-icon">
                        <IoNotificationsOutline />
                      </div>
                      <span className="setting-label">Enable Notifications</span>
                      <label className="switch">
                        <input
                          type="checkbox"
                          name="notificationsEnabled"
                          checked={formData.notificationsEnabled}
                          onChange={handleChange}
                        />
                        <span className="slider round"></span>
                      </label>
                    </div>
                    
                    <div className="setting-item">
                      <div className="setting-icon location-icon">
                        <IoLocationOutline />
                      </div>
                      <span className="setting-label">Enable Location Services</span>
                      <label className="switch">
                        <input
                          type="checkbox"
                          name="locationEnabled"
                          checked={formData.locationEnabled}
                          onChange={handleChange}
                        />
                        <span className="slider round"></span>
                      </label>
                    </div>
                    
                    <div className="setting-item clickable">
                      <div className="setting-icon password-icon">
                        <IoLockClosedOutline />
                      </div>
                      <div className="setting-details">
                        <div className="setting-label">Change Password</div>
                        <div className="setting-description">Update your security</div>
                      </div>
                    </div>
                    
                    <div className="setting-item clickable delete-item">
                      <div className="setting-icon delete-icon">
                        <IoTrashOutline />
                      </div>
                      <div className="setting-details">
                        <div className="setting-label">Delete Account</div>
                        <div className="setting-description">Remove all your data</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Extra space to prevent content from being hidden by bottom nav */}
          <div className="bottom-spacing"></div>
        </main>
      </PageTransition>
      
      <BotNav />
    </div>
  );
};

export default Profile;