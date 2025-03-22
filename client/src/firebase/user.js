 class User {
    constructor(uid = null, firstName = "", lastName = "", email = "", 
                registrationDate = new Date(), notificationEnable = 1) {
      // Basic properties
      this.uid = uid;                           // Serial number (document ID in Firestore)
      this.firstName = firstName;               // User's first name
      this.lastName = lastName;                 // User's last name
      this.email = email;                       // User's email address
      
      // Registration information
      this.registrationDate = registrationDate; // When the user registered (timestamp)
      
      // Preferences
      this.notificationEnable = notificationEnable; // Notification toggle (0 = off, 1 = on)
    }
  
    // Helper methods
    getFullName() {
      return `${this.firstName} ${this.lastName}`.trim();
    }
  
    // Toggle notifications status
    toggleNotifications() {
      this.notificationEnable = this.notificationEnable === 1 ? 0 : 1;
      return this.notificationEnable;
    }
  
    // Get notification status as boolean for easier use in UI
    areNotificationsEnabled() {
      return this.notificationEnable === 1;
    }
    
    // Create a plain object representing this user (useful for React state)
    toObject() {
      return {
        uid: this.uid,
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        registrationDate: this.registrationDate,
        notificationEnable: this.notificationEnable
      };
    }
  
    // For debugging and logging
    toString() {
      return `User(${this.uid}): ${this.getFullName()} <${this.email}>`;
    }
  }
  
  // Firestore data converter for User objects
  const userConverter = {
    // Convert a User instance to a Firestore document
    toFirestore: (user) => {
      // Create a clean copy of the user data
      const data = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        notificationEnable: user.notificationEnable
      };
  
      // Only add registrationDate for new documents
      if (!user.uid) {
        data.registrationDate = new Date();
      }
  
      return data;
    },
  
    // Convert a Firestore document to a User instance
    fromFirestore: (snapshot, options) => {
      const data = snapshot.data(options);
      
      // Convert Firestore Timestamp to JavaScript Date if necessary
      const registrationDate = data.registrationDate instanceof Date ? 
                        data.registrationDate : 
                        new Date(data.registrationDate.seconds * 1000);
      
      return new User(
        snapshot.id,            // Using document ID as the uid
        data.firstName,
        data.lastName,
        data.email,
        registrationDate,
        data.notificationEnable
      );
    }
  };
  
  export { User, userConverter };