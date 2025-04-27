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
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return {
    year: local.getFullYear(),
    month: local.getMonth() + 1,
    day: local.getDate()
  };
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
    console.log('🚀 Starting watering sensor...');

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
          console.log(`❌ Plant ${plantId} not found.`);
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
          console.log(`❌ No watering frequency set for care ${careId}.`);
          continue;
        }

        console.log(`✅ Watering every ${wateringFrequency} days.`);

        const notificationsRef = db.collection('notifications');

        // Check if there are any future notifications for this plant
        const futureSnapshot = await notificationsRef
          .where('user_id', '==', userId)
          .where('plant_id', '==', plantId)
          .where('type', '==', 'watering')
          .get();

        let futureExists = false;
        futureSnapshot.forEach(doc => {
          const scheduled = doc.data().scheduled_date;
          if (toComparableNumber(scheduled) >= todayNumber) {
            futureExists = true;
          }
        });

        if (futureExists) {
          console.log(`⏩ Future watering already scheduled for ${plantId}. Skipping.`);
          continue;
        }

        console.log(`🛠 No future watering. Calculating new watering schedule.`);

        // Find the last watering event (even if it was in the past)
        const lastSnapshot = await notificationsRef
          .where('user_id', '==', userId)
          .where('plant_id', '==', plantId)
          .where('type', '==', 'watering')
          .orderBy('scheduled_date.year', 'desc')
          .orderBy('scheduled_date.month', 'desc')
          .orderBy('scheduled_date.day', 'desc')
          .limit(1)
          .get();

        let startingDate = null;

        if (!lastSnapshot.empty) {
          const last = lastSnapshot.docs[0].data().scheduled_date;
          startingDate = addDays(new Date(last.year, last.month - 1, last.day), wateringFrequency);
          console.log(`🕰 Last watering found. Next watering starts at ${startingDate.toDateString()}`);
        } else {
          startingDate = new Date(today.year, today.month - 1, today.day);
          console.log(`🌱 No previous watering. Starting from today: ${startingDate.toDateString()}`);
        }

        // Schedule next 3 watering notifications
        let newScheduledDate = new Date(startingDate);

        for (let i = 0; i < 3; i++) {
          const formattedDate = toDateObj(newScheduledDate);

          await notificationsRef.add({
            type: 'watering',
            user_id: userId,
            plant_id: plantId,
            scheduled_date: formattedDate,
            isRead: false,
          });

          console.log(`✅ Scheduled watering #${i + 1} for ${plantId} on ${formattedDate.year}-${formattedDate.month}-${formattedDate.day}`);

          newScheduledDate = addDays(newScheduledDate, wateringFrequency);
        }
      }
    }

    console.log('🌱 Watering notifications creation complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
