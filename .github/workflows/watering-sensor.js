const admin = require('firebase-admin');

// Decode the credentials from FIREBASE_CREDENTIALS_BASE64
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_CREDENTIALS_BASE64, 'base64').toString('utf8')
);

// Initialize Firebase Admin SDK properly
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

// Helper: Get today's date as { year, month, day }
function getTodayDate() {
  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  };
}

(async () => {
  try {
    const today = getTodayDate();
    const userPlantSnapshot = await db.collection('user_plant').get();

    for (const userDoc of userPlantSnapshot.docs) {
      const userId = userDoc.id.replace('user_', '');
      const plantIds = userDoc.data().plants || [];

      for (const plantId of plantIds) {
        const plantDoc = await db.collection('plants').doc(plantId).get();
        if (!plantDoc.exists) continue;

        const careId = plantDoc.data().care_id;
        const careDoc = await db.collection('care_instructions').doc(careId).get();
        if (!careDoc.exists) continue;

        const wateringFrequency = careDoc.data().watering_frequency_days;
        if (!wateringFrequency) continue;

        const notificationsRef = db.collection('notifications');

        // Find latest watering notification
        const existing = await notificationsRef
          .where('user_id', '==', userId)
          .where('plant_id', '==', plantId)
          .where('type', '==', 'watering')
          .orderBy('scheduled_date.year', 'desc')
          .orderBy('scheduled_date.month', 'desc')
          .orderBy('scheduled_date.day', 'desc')
          .limit(1)
          .get();

        let nextDate = new Date();
        if (!existing.empty) {
          const last = existing.docs[0].data().scheduled_date;
          const lastDate = new Date(last.year, last.month - 1, last.day);
          nextDate = new Date(lastDate.getTime() + wateringFrequency * 24 * 60 * 60 * 1000);
        }

        const now = new Date();
        if (now >= nextDate) {
          const newDate = getTodayDate();
          await notificationsRef.add({
            type: 'watering',
            user_id: userId,
            plant_id: plantId,
            scheduled_date: newDate,
          });

          console.log(`✅ Created watering task: user ${userId}, plant ${plantId}`);
        } else {
          console.log(`ℹ️ No watering needed today: user ${userId}, plant ${plantId}`);
        }
      }
    }

    console.log('🌱 Watering check complete!');
  } catch (error) {
    console.error('❌ Error running watering sensor:', error);
    process.exit(1);
  }
})();
