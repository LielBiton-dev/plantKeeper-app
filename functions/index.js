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
      notificationEnable: 1,
      locationEnable: 0,
      userLocation: null,
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
