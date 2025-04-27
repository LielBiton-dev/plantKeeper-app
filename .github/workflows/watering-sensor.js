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

// Helper: create a simple date number for comparison (YYYYMMDD)
function toComparableNumber(dateObj) {
  return dateObj.year * 10000 + dateObj.month * 100 + dateObj.day;
}

(async () => {
  try {
    console.log('🚀 Starting watering sensor debug...');

    const today = getTodayDate();
    const todayNumber = toComparableNumber(today);
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

        // Check if there are future notifications
        const futureSnapshot = await notificationsRef
          .where('user_id', '==', userId)
          .where('plant_id', '==', plantId)
          .where('type', '==', 'watering')
          .get();

        let futureExists = false;
        for (const doc of futureSnapshot.docs) {
          const scheduled = doc.data().scheduled_date;
          if (toComparableNumber(scheduled) > todayNumber) {
            futureExists = true;
            break;
          }
        }

        if (futureExists) {
          console.log(`⏩ Future watering already scheduled for ${plantId}. Skipping.`);
          continue; // skip to next plant
        }

        console.log(`🛠 No future watering found. Scheduling new notifications.`);

        // No future notification -> Schedule for next 7 days
        let newScheduledDate = new Date(today.year, today.month - 1, today.day);

        while (newScheduledDate <= addDays(new Date(today.year, today.month - 1, today.day), 7)) {
          const formattedDate = toDateObj(newScheduledDate);

          await notificationsRef.add({
            type: 'watering',
            user_id: userId,
            plant_id: plantId,
            scheduled_date: formattedDate,
            isRead: false,
          });

          console.log(`✅ Scheduled watering for user ${userId}, plant ${plantId} on ${formattedDate.year}-${formattedDate.month}-${formattedDate.day}`);

          newScheduledDate = addDays(newScheduledDate, wateringFrequency);
        }
      }
    }

    console.log('🌱 Watering tasks generation complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running watering sensor:', error);
    process.exit(1);
  }
})();
