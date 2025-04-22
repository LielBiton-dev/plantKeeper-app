import React, { useState, useEffect } from "react";
import { TopNav, BotNav } from '../components/Nav';
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import PageTransition from "../components/PageTransition";
import { IoPersonOutline, IoMailOutline, IoNotificationsOutline, IoLocationOutline, IoLockClosedOutline, IoTrashOutline } from "react-icons/io5";
import { MdEdit } from "react-icons/md";
import "./Profile.css";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
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
    e.preventDefault();
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
      setEditing(false);
      
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

  if (loading) {
    return (
      <div className="page-container bg-light">
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
    <div className="page-container bg-light">
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
            <div className="profile-avatar">
              {formData.firstName ? formData.firstName.charAt(0).toUpperCase() : "U"}
              {formData.lastName ? formData.lastName.charAt(0).toUpperCase() : ""}
            </div>
            <div className="profile-name">
              <h3>{formData.firstName} {formData.lastName}</h3>
              <p>{formData.email}</p>
              
              {!editing && (
                <button 
                  className="profile-edit-btn" 
                  onClick={() => setEditing(true)}
                >
                  <MdEdit size={18} /> Edit Profile
                </button>
              )}
            </div>
          </div>
          
          {!editing ? (
            <>
              <h2 className="section-heading">Personal Information</h2>
              <div className="profile-info">
                <div className="profile-info-row">
                  <div className="profile-info-icon">
                    <IoPersonOutline size={22} />
                  </div>
                  <div className="profile-info-details">
                    <span className="profile-info-label">Name</span>
                    <span className="profile-info-value">{formData.firstName} {formData.lastName}</span>
                  </div>
                </div>
                
                <div className="profile-info-row">
                  <div className="profile-info-icon">
                    <IoMailOutline size={22} />
                  </div>
                  <div className="profile-info-details">
                    <span className="profile-info-label">Email</span>
                    <span className="profile-info-value">{formData.email}</span>
                  </div>
                </div>
                
                <div className="profile-info-row">
                  <div className="profile-info-icon">
                    <IoNotificationsOutline size={22} />
                  </div>
                  <div className="profile-info-details">
                    <span className="profile-info-label">Notifications</span>
                    <span className="profile-info-value status-indicator">
                      <span className={`status-dot ${formData.notificationsEnabled ? 'active' : 'inactive'}`}></span>
                      {formData.notificationsEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
                
                <div className="profile-info-row">
                  <div className="profile-info-icon">
                    <IoLocationOutline size={22} />
                  </div>
                  <div className="profile-info-details">
                    <span className="profile-info-label">Location Services</span>
                    <span className="profile-info-value status-indicator">
                      <span className={`status-dot ${formData.locationEnabled ? 'active' : 'inactive'}`}></span>
                      {formData.locationEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>
              
              <h2 className="section-heading">Account Settings</h2>
              <div className="account-actions">
                <div className="action-buttons">
                  <button className="action-btn">
                    <div className="action-icon">
                      <IoLockClosedOutline size={24} />
                    </div>
                    Change Password
                    <div className="action-subtitle">Update your security</div>
                  </button>
                  <button className="action-btn" style={{backgroundColor: "#b71c1c"}}>
                    <div className="action-icon">
                      <IoTrashOutline size={24} />
                    </div>
                    Delete Account
                    <div className="action-subtitle">Remove all your data</div>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="profile-form">
              <h2 className="section-heading">Edit Profile</h2>
              
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="auth-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="auth-input"
                  required
                />
              </div>
              
              <div className="form-group email-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  className="auth-input disabled"
                  disabled
                />
                <small>Email cannot be changed</small>
              </div>
              
              <h2 className="section-heading">Preferences</h2>
              
              <div className="toggle-group">
                <div className="toggle-label">
                  <IoNotificationsOutline size={20} />
                  <span>Enable Notifications</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    name="notificationsEnabled"
                    checked={formData.notificationsEnabled}
                    onChange={handleChange}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="toggle-group">
                <div className="toggle-label">
                  <IoLocationOutline size={20} />
                  <span>Enable Location Services</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    name="locationEnabled"
                    checked={formData.locationEnabled}
                    onChange={handleChange}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="save-btn"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </main>
      </PageTransition>
      
      <BotNav />
    </div>
  );
};

export default Profile;