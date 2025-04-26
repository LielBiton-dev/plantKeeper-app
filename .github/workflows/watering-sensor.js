const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

// Parse Firebase credentials from GitHub secrets
const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);

// Initialize Firebase
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Get today's date in YYYY-MM-DD
function getTodayDate() {
  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate()
  };
}

(async () => {
  const today = getTodayDate();

  const userPlantSnapshot = await db.collection('user_plant').get();

  for (const userDoc of userPlantSnapshot.docs) {
    const userId = userDoc.id.replace('user_', '');
    const plantIds = userDoc.data().plants;

    for (const plantId of plantIds) {
      const plantDoc = await db.collection('plants').doc(plantId).get();
      if (!plantDoc.exists) continue;

      const careId = plantDoc.data().care_id;
      const careDoc = await db.collection('care_instructions').doc(careId).get();
      if (!careDoc.exists) continue;

      const wateringFrequency = careDoc.data().watering_frequency_days;
      const notificationsRef = db.collection('notifications');

      // Check existing watering notifications
      const existing = await notificationsRef
        .where('user_id', '==', userId)
        .where('plant_id', '==', plantId)
        .where('type', '==', 'watering')
        .orderBy('scheduled_date', 'desc')
        .limit(1)
        .get();

      let nextDate = new Date();
      if (!existing.empty) {
        const last = existing.docs[0].data().scheduled_date;
        const lastDate = new Date(`${last.year}-${last.month}-${last.day}`);
        nextDate = new Date(lastDate.getTime() + wateringFrequency * 86400000);
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

        console.log(`Created watering task for user ${userId}, plant ${plantId}`);
      }
    }
  }
})();
