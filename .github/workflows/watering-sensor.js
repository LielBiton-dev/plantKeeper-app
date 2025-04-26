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

// Helper: today's date
function getTodayDate() {
  const today = new Date();
  return { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
}

// Helper: add days to a Date
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Helper: convert Date -> {year, month, day}
function toDateObj(date) {
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}

(async () => {
  try {
    const today = new Date();
    const oneWeekLater = addDays(today, 7);

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

        let lastWaterDate = today;

        if (!existing.empty) {
          const last = existing.docs[0].data().scheduled_date;
          lastWaterDate = new Date(last.year, last.month - 1, last.day);
        } else {
          console.log(`🌱 No previous watering found for ${plantId}, starting from today.`);
        }

        let nextDate = lastWaterDate;

        while (nextDate <= oneWeekLater) {
          const newScheduledDate = toDateObj(nextDate);

          await notificationsRef.add({
            type: 'watering',
            user_id: userId,
            plant_id: plantId,
            scheduled_date: newScheduledDate,
          });

          console.log(`✅ Scheduled watering for user ${userId}, plant ${plantId} on ${newScheduledDate.year}-${newScheduledDate.month}-${newScheduledDate.day}`);

          nextDate = addDays(nextDate, wateringFrequency);
        }
      }
    }

    console.log('🌟 Watering tasks generated for the next week!');
  } catch (error) {
    console.error('❌ Error running watering sensor:', error);
    process.exit(1);
  }
})();
