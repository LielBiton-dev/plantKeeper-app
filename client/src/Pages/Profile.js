import React, { useState, useEffect, useRef } from "react";
import { TopNav, BotNav } from '../components/Nav';
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth, db, functions } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import PageTransition from "../components/PageTransition";
import { IoCamera } from "react-icons/io5";
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
  const [profilePic, setProfilePic] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  
  // Accordion state
  const [openSection, setOpenSection] = useState(null);
  // General function to update user preferences
  const updateUserPreferences = async (preferences) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No user is currently signed in");
    }
    
    const updatePrefs = httpsCallable(functions, 'updateUserPreferences');
    const result = await updatePrefs(preferences);
    return result.data;
  };

  const updateUserProfile = async (profileData) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No user is currently signed in");
    }
    
    const updateProfile = httpsCallable(functions, 'updateUserProfile');
    const result = await updateProfile(profileData);
    return result.data;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          setLoading(true);
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser(userData);
            
            // Set profile picture if it exists
            if (userData.profilePictureBase64) {
              setProfilePic(userData.profilePictureBase64);
            }
            
            // Set form data from user data
            setFormData({
              firstName: userData.firstName || "",
              lastName: userData.lastName || "",
              email: userData.email || currentUser.email || "",
              notificationsEnabled: userData.notificationsEnable === 1,
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

  const handlePictureClick = () => {
    fileInputRef.current.click();
  };

  const resizeImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          
          const MAX_SIZE = 300;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const base64Image = canvas.toDataURL('image/jpeg', 0.7);
          resolve(base64Image);
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        img.src = event.target.result;
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  };
  

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      setError("Please select an image file");
      return;
    }
    
    setUploading(true);
    setError(null);
    
    try {
      const resizedImage = await resizeImage(file);
      
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Not authenticated");
      
      // Use Cloud Function for profile picture
      await updateUserPreferences({
        profilePictureBase64: resizedImage
      });
      
      setProfilePic(resizedImage);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error uploading picture:", error);
      setError("Failed to upload profile picture");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Not authenticated");
      
      // Update preferences using updateUserPreferences
      await updateUserPreferences({
        notificationsEnable: formData.notificationsEnabled ? 1 : 0,
        locationEnable: formData.locationEnabled ? 1 : 0
      });
      
      // Update name fields using updateUserProfile
      await updateUserProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      
      setSuccess(true);
      setOpenSection(null);
      
      // Update local user state to reflect changes
      setUser({
        ...user,
        firstName: formData.firstName,
        lastName: formData.lastName,
        notificationsEnable: formData.notificationsEnabled ? 1 : 0,
        locationEnable: formData.locationEnabled ? 1 : 0
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Not authenticated");

      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordData.currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, passwordData.newPassword);
      
      setSuccess("Password updated successfully!");
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error("Error updating password:", error);
      if (error.code === 'auth/wrong-password') {
        setError("Current password is incorrect");
      } else if (error.code === 'auth/weak-password') {
        setError("New password is too weak");
      } else {
        setError("Failed to update password");
      }
    }
  };

  // Delete account function
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      setError("Please type 'DELETE' to confirm");
      return;
    }

    try {
      const deleteAccount = httpsCallable(functions, 'deleteUserAccount');
      await deleteAccount({ currentPassword: passwordData.currentPassword });
      
      // Sign out and redirect
      await auth.signOut();
      navigate("/welcome");
    } catch (error) {
      console.error("Error deleting account:", error);
      setError("Failed to delete account");
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
          <div className="profile-initials" onClick={handlePictureClick}>
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="profile-picture" />
              ) : (
                <>
                  {formData.firstName ? formData.firstName.charAt(0).toUpperCase() : ""}
                  {formData.lastName ? formData.lastName.charAt(0).toUpperCase() : ""}
                </>
              )}
              
              <div className="camera-icon">
                <IoCamera size={14} />
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                className="profile-picture-input"
                accept="image/*"
                onChange={handleFileChange}
              />
              
              {uploading && (
                <div className="uploading-overlay">
                  <div className="uploading-spinner"></div>
                </div>
              )}
            </div>
            <h1 className="profile-name">{formData.firstName || ""} {formData.lastName || ""}</h1>
            <p className="profile-account-type">Personal Account</p>
          </div>
          
          {/* Admin Panel Button */}
          {user?.isAdmin && (
            <div className="admin-panel-button">
              <button onClick={() => navigate("/dashboard")}>
                Admin Panel
              </button>
            </div>
          )}

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
                    
                    <div className="setting-item clickable" onClick={() => setShowPasswordModal(true)}>
                      <div className="setting-icon password-icon">
                        <IoLockClosedOutline />
                      </div>
                      <div className="setting-details">
                        <div className="setting-label">Change Password</div>
                        <div className="setting-description">Update your security</div>
                      </div>
                    </div>
                    
                    <div className="setting-item clickable delete-item" onClick={() => setShowDeleteModal(true)}>
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
          {showPasswordModal && (
            <div className="profile-modal-overlay" onClick={() => setShowPasswordModal(false)}>
              <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>Change Password</h3>
                <input
                  className="profile-modal-input"
                  type="password"
                  placeholder="Current Password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                />
                <input
                  className="profile-modal-input"
                  type="password"
                  placeholder="New Password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                />
                <input
                  className="profile-modal-input"
                  type="password"
                  placeholder="Confirm New Password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                />
                <div className="profile-modal-buttons">
                  <button className="profile-modal-button profile-modal-button-cancel" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                  <button className="profile-modal-button profile-modal-button-primary" onClick={handleChangePassword}>Update Password</button>
                </div>
              </div>
            </div>
          )}

          {showDeleteModal && (
            <div className="profile-modal-overlay" onClick={() => setShowDeleteModal(false)}>
              <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>Delete Account</h3>
                <p>This action cannot be undone. All your data will be permanently deleted.</p>
                <input
                  className="profile-modal-input"
                  type="password"
                  placeholder="Current Password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                />
                <input
                  className="profile-modal-input"
                  type="text"
                  placeholder="Type 'DELETE' to confirm"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                />
                <div className="profile-modal-buttons">
                  <button className="profile-modal-button profile-modal-button-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                  <button className="profile-modal-button profile-modal-button-delete" onClick={handleDeleteAccount}>Delete Account</button>
                </div>
              </div>
            </div>
          )}
          
          {/* Extra space to prevent content from being hidden by bottom nav */}
          <div className="bottom-spacing"></div>
        </main>
      </PageTransition>
      
      <BotNav />
    </div>
  );
};

export default Profile;