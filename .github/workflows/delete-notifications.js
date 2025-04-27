const admin = require('firebase-admin');

// Decode the credentials from FIREBASE_CREDENTIALS_BASE64
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_CREDENTIALS_BASE64, 'base64').toString('utf8')
);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

(async () => {
  try {
    console.log('🚀 Starting notifications deletion...');

    const notificationsSnapshot = await db.collection('notifications').get();
    console.log(`🔎 Found ${notificationsSnapshot.size} notifications.`);

    if (notificationsSnapshot.empty) {
      console.log('✅ No notifications to delete.');
      process.exit(0);
    }

    const batchSize = 500; // Firestore limits batch writes to 500 operations
    let batch = db.batch();
    let counter = 0;

    for (const doc of notificationsSnapshot.docs) {
      batch.delete(doc.ref);
      counter++;

      // Commit every 500 deletes
      if (counter % batchSize === 0) {
        await batch.commit();
        console.log(`🔥 Deleted ${counter} notifications so far...`);
        batch = db.batch();
      }
    }

    // Commit any remaining deletes
    if (counter % batchSize !== 0) {
      await batch.commit();
      console.log(`🔥 Deleted remaining ${counter % batchSize} notifications.`);
    }

    console.log('🧹 All notifications deleted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting notifications:', error);
    process.exit(1);
  }
})();
