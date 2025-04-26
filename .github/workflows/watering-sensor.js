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
    console.log('🚀 Starting watering sensor debug...');

    const today = getTodayDate();
    const userPlantSnapshot = await db.collection('user_plants').get();

    console.log(`🔎 Found ${userPlantSnapshot.size} users.`);

    for (const userDoc of userPlantSnapshot.docs) {
      const userId = userDoc.id.replace('user_', '');
      const plantIds = userDoc.data().plants || [];

      console.log(`👤 User: ${userId}, Plants: ${plantIds.join(', ') || 'None'}`);

      if (plantIds.length === 0) continue;

      for (const plantId of plantIds) {
        console.log(`🌿 Checking plant: ${plantId}`);

        const plantDoc = await db.collection('plants').doc(plantId).get();
        if (!plantDoc.exists) {
          console.log(`❌ Plant ${plantId} not found in 'plants' collection.`);
          continue;
        }

        const careId = plantDoc.data().care_id;
        if (!careId) {
          console.log(`❌ Plant ${plantId} has no care_id.`);
          continue;
        }

        const careDoc = await db.collection('care_instructions').doc(careId).get();
        if (!careDoc.exists) {
          console.log(`❌ Care profile ${careId} not found.`);
          continue;
        }

        const wateringFrequency = careDoc.data().watering_frequency_days;
        if (!wateringFrequency) {
          console.log(`❌ Care profile ${careId} has no watering frequency.`);
          continue;
        }

        console.log(`✅ Watering frequency for ${plantId} is every ${wateringFrequency} days.`);

        const notificationsRef = db.collection('notifications');

        // Find latest watering
        const existing = await notificationsRef
          .where('user_id', '==', userId)
          .where('plant_id', '==', plantId)
          .where('type', '==', 'watering')
          .orderBy('scheduled_date.year', 'desc')
          .orderBy('scheduled_date.month', 'desc')
          .orderBy('scheduled_date.day', 'desc')
          .limit(1)
          .get();

        let lastDate = null;
        if (!existing.empty) {
          const last = existing.docs[0].data().scheduled_date;
          lastDate = new Date(last.year, last.month - 1, last.day);
          console.log(`🕰 Last watering was on ${lastDate.toDateString()}`);
        } else {
          console.log(`🌱 No previous watering found for ${plantId}, starting from today.`);
          lastDate = new Date(today.year, today.month - 1, today.day);
        }

        // Schedule for next 7 days based on wateringFrequency
        let newScheduledDate = new Date(lastDate);

        while (newScheduledDate <= new Date(today.year, today.month - 1, today.day + 7)) {
          const formattedDate = {
            year: newScheduledDate.getFullYear(),
            month: newScheduledDate.getMonth() + 1,
            day: newScheduledDate.getDate()
          };

          await notificationsRef.add({
            type: 'watering',
            user_id: userId,
            plant_id: plantId,
            scheduled_date: formattedDate,
          });

          console.log(`✅ Scheduled watering for user ${userId}, plant ${plantId} on ${formattedDate.year}-${formattedDate.month}-${formattedDate.day}`);

          newScheduledDate.setDate(newScheduledDate.getDate() + wateringFrequency);
        }
      }
    }

    console.log('🌱 Watering tasks generation complete!');
  } catch (error) {
    console.error('❌ Error running watering sensor:', error);
    process.exit(1);
  }
})();
