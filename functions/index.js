const {getAuth} = require("firebase-admin/auth");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
// const functions = require("firebase-functions");

admin.initializeApp();
const db = admin.firestore();

// ========== USER FUNCTIONS ==========

// Create user document manually (called from client after registration)
exports.createUserDocument = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const uid = request.auth.uid;

  try {
    // Check if user document already exists
    const existingDoc = await db.collection("users").doc(uid).get();
    if (existingDoc.exists) {
      console.log(`User document already exists for ${uid}`);
      return {success: true, alreadyExists: true};
    }

    // Get user info from Auth
    const userRecord = await admin.auth().getUser(uid);

    const userDoc = {
      email: userRecord.email,
      registrationDate: admin.firestore.FieldValue.serverTimestamp(),
      notificationsEnable: 0,
      locationEnable: 0,
      userLocation: null,
      cameraUseEnable: 0,
      profileCompleted: false,
    };

    await db.collection("users").doc(uid).set(userDoc);
    console.log(`User document created for ${uid}`);
    return {success: true};
  } catch (error) {
    console.error("Error creating user document:", error);
    throw new HttpsError("internal", "Failed to create user document");
  }
});

// Update user profile with firstName/lastName
exports.updateUserProfile = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const {firstName, lastName} = request.data;
  const uid = request.auth.uid;

  try {
    await db.collection("users").doc(uid).update({
      firstName: firstName,
      lastName: lastName,
      profileCompleted: true,
    });

    console.log(`Profile updated for user: ${uid}`);
    return {success: true};
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw new HttpsError("internal", "Failed to update user profile");
  }
});

// ========== NOTIFICATION FUNCTIONS ==========

// Mark single notification as read
exports.markNotificationAsRead = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const {notificationId} = request.data;
  const userId = request.auth.uid;

  try {
    await db.collection("notifications").doc(notificationId).update({
      isRead: true,
      readAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Notification ${notificationId} marked as read for user ` +
        `${userId}`);
    return {success: true};
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw new HttpsError("internal", "Failed to mark notification as read");
  }
});

// Mark all notifications as read for a user
exports.markAllNotificationsAsRead = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const userId = request.auth.uid;

  try {
    const notificationsQuery = await db.collection("notifications")
        .where("user_id", "==", userId)
        .get();

    const batch = db.batch();
    notificationsQuery.docs.forEach((doc) => {
      batch.update(doc.ref, {
        isRead: true,
        readAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    console.log(`All notifications marked as read for user ${userId}`);
    const updateCount = notificationsQuery.docs.length;
    return {success: true, updated: updateCount};
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw new HttpsError("internal", "Failed to mark notifications as read");
  }
});

// ========== SCAN FUNCTIONS ==========

// Create a new scan document
exports.createScan = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const {prediction, latencyMs} = request.data;
  const userId = request.auth.uid;

  try {
    const scanDoc = {
      user_id: userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      prediction: {
        name: prediction.name,
        confidence: prediction.confidence,
      },
      latency_ms: latencyMs,
      feedback: null,
    };

    const docRef = await db.collection("scans").add(scanDoc);
    console.log(`Scan created: ${docRef.id} for user ${userId}`);
    return {success: true, scanId: docRef.id};
  } catch (error) {
    console.error("Error creating scan:", error);
    throw new HttpsError("internal", "Failed to create scan");
  }
});

// Update scan feedback
exports.updateScanFeedback = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const {scanId, feedback} = request.data;
  const userId = request.auth.uid;

  if (!["good", "bad"].includes(feedback)) {
    throw new HttpsError("invalid-argument", "Feedback must be good or bad");
  }

  try {
    const scanDoc = await db.collection("scans").doc(scanId).get();
    if (!scanDoc.exists) {
      throw new HttpsError("not-found", "Scan not found");
    }

    if (scanDoc.data().user_id !== userId) {
      throw new HttpsError("permission-denied",
          "Cannot update scan belonging to another user");
    }

    await db.collection("scans").doc(scanId).update({
      feedback: feedback,
      feedbackAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Scan ${scanId} feedback updated to: ${feedback}`);
    return {success: true};
  } catch (error) {
    console.error("Error updating scan feedback:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to update scan feedback");
  }
});

// ========== USER PLANTS FUNCTIONS ==========

// Add plant to user's collection
exports.addPlantToUserCollection = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const {plantId} = request.data;
  const userId = request.auth.uid;

  if (!plantId) {
    throw new HttpsError("invalid-argument", "plantId is required");
  }

  try {
    const userPlantsRef = db.collection("user_plants").doc(`user_${userId}`);
    const userPlantsDoc = await userPlantsRef.get();

    if (userPlantsDoc.exists) {
      const currentPlants = userPlantsDoc.data().plants || [];
      if (!currentPlants.includes(plantId)) {
        await userPlantsRef.update({
          plants: admin.firestore.FieldValue.arrayUnion(plantId),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        console.log(`Plant ${plantId} already in collection for ` +
            `user ${userId}`);
        return {success: true, alreadyExists: true};
      }
    } else {
      await userPlantsRef.set({
        plants: [plantId],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    console.log(`Plant ${plantId} added to collection for user ${userId}`);
    return {success: true};
  } catch (error) {
    console.error("Error adding plant to collection:", error);
    throw new HttpsError("internal", "Failed to add plant to collection");
  }
});

// Remove plant from user's collection
exports.removePlantFromUserCollection = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const {plantId} = request.data;
  const userId = request.auth.uid;

  if (!plantId) {
    throw new HttpsError("invalid-argument", "plantId is required");
  }

  try {
    const userPlantsRef = db.collection("user_plants").doc(`user_${userId}`);
    const userPlantsDoc = await userPlantsRef.get();

    if (userPlantsDoc.exists()) {
      await userPlantsRef.update({
        plants: admin.firestore.FieldValue.arrayRemove(plantId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Plant ${plantId} removed from collection for ` +
          `user ${userId}`);
      return {success: true};
    } else {
      throw new HttpsError("not-found", "User plants collection not found");
    }
  } catch (error) {
    console.error("Error removing plant from collection:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to remove plant from collection");
  }
});

// ========== USER PREFERENCES FUNCTION ==========

// Update user preferences (location, camera, notifications, etc.)
exports.updateUserPreferences = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const uid = request.auth.uid;
  const updates = request.data;

  // Define allowed preference keys and their validation rules
  const allowedPreferences = {
    locationEnable: {
      type: "number",
      values: [0, 1],
      requiresField: "userLocation",
    },
    userLocation: {
      type: ["string", "null"],
      dependsOn: "locationEnable",
    },
    cameraUseEnable: {
      type: "number",
      values: [0, 1],
    },
    notificationsEnable: {
      type: "number",
      values: [0, 1],
    },
    profilePictureBase64: {
      type: ["string", "null"],
    },
  };

  // Validate that we only have allowed preferences
  const updateKeys = Object.keys(updates);
  for (const key of updateKeys) {
    if (!allowedPreferences[key]) {
      throw new HttpsError("invalid-argument",
          `Invalid preference key: ${key}`);
    }
  }

  // Validate each preference
  for (const [key, value] of Object.entries(updates)) {
    const rules = allowedPreferences[key];

    // Type validation
    if (Array.isArray(rules.type)) {
      const validTypes = rules.type.map((t) => t === "null" ?
          null : typeof value);
      const actualType = value === null ? null : typeof value;
      if (!validTypes.includes(actualType)) {
        throw new HttpsError("invalid-argument",
            `${key} must be one of types: ${rules.type.join(", ")}`);
      }
    } else {
      if (rules.type === "null" && value !== null) {
        throw new HttpsError("invalid-argument", `${key} must be null`);
      } else if (rules.type !== "null" && typeof value !== rules.type) {
        throw new HttpsError("invalid-argument",
            `${key} must be of type ${rules.type}`);
      }
    }

    // Value validation
    if (rules.values && !rules.values.includes(value)) {
      throw new HttpsError("invalid-argument",
          `${key} must be one of: ${rules.values.join(", ")}`);
    }
  }

  // Special validation for location-related fields
  if ("locationEnable" in updates && "userLocation" in updates) {
    const locationEnable = updates.locationEnable;
    const userLocation = updates.userLocation;

    if (locationEnable === 1) {
      if (!userLocation || typeof userLocation !== "string" ||
            userLocation.trim() === "") {
        throw new HttpsError("invalid-argument",
            "userLocation is required when locationEnable is 1");
      }
    } else if (locationEnable === 0) {
      if (userLocation !== null && userLocation !== undefined) {
        throw new HttpsError("invalid-argument",
            "userLocation must be null when locationEnable is 0");
      }
    }
  }

  try {
    // Prepare update data
    const updateData = {
      ...updates,
    };

    await db.collection("users").doc(uid).update(updateData);

    console.log(`Preferences updated for user ${uid}:`,
        Object.keys(updates).join(", "));
    return {success: true, updated: Object.keys(updates)};
  } catch (error) {
    console.error("Error updating user preferences:", error);
    throw new HttpsError("internal", "Failed to update user preferences");
  }
});

// Delete user account and all associated data
exports.deleteUserAccount = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const uid = request.auth.uid;
  const {currentPassword} = request.data;

  if (!currentPassword) {
    throw new HttpsError("invalid-argument", "Current password is required");
  }

  try {
    // Delete user data from Firestore
    const batch = db.batch();
    // Delete user document
    const userRef = db.collection("users").doc(uid);
    batch.delete(userRef);
    // Delete user's scans
    const scansSnapshot = await db.collection("scans")
        .where("user_id", "==", uid).get();
    scansSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    // Delete user's notifications
    const notificationsSnapshot = await db.collection("notifications")
        .where("user_id", "==", uid).get();
    notificationsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    // Delete user's plant collection
    const userPlantsRef = db.collection("user_plants").doc(`user_${uid}`);
    batch.delete(userPlantsRef);
    // Commit the batch
    await batch.commit();
    // Delete the user from Firebase Auth
    await getAuth().deleteUser(uid);
    console.log(`User account ${uid} deleted successfully`);
    return {success: true};
  } catch (error) {
    console.error("Error deleting user account:", error);
    throw new HttpsError("internal", "Failed to delete user account");
  }
});
