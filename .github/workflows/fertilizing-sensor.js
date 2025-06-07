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
  const now = new Date(); // now is already UTC-based internally
  return {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1, // Months are 0-based in JS
    day: now.getUTCDate()
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
    console.log('🚀 Starting fertilizing sensor...');

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

        const fertilizingFrequency = careDoc.data().fertilizing_frequency_days;
        if (!fertilizingFrequency) {
          console.log(`❌ No fertilizing frequency set for care ${careId}.`);
          continue;
        }

        console.log(`✅ Fertilizing every ${fertilizingFrequency} days.`);

        const notificationsRef = db.collection('notifications');

        // Check if there are any future notifications for this plant
        const futureSnapshot = await notificationsRef
          .where('user_id', '==', userId)
          .where('plant_id', '==', plantId)
          .where('type', '==', 'fertilizing')
          .get();

        let futureExists = false;
        futureSnapshot.forEach(doc => {
          const scheduled = doc.data().scheduled_date;
          if (toComparableNumber(scheduled) >= todayNumber) {
            futureExists = true;
          }
        });

        if (futureExists) {
          console.log(`⏩ Future fertilizing already scheduled for ${plantId}. Skipping.`);
          continue;
        }

        console.log(`🛠 No future fertilizing. Calculating new fertilizing schedule.`);

        // Find the last fertilizing event (even if it was in the past)
        const lastSnapshot = await notificationsRef
          .where('user_id', '==', userId)
          .where('plant_id', '==', plantId)
          .where('type', '==', 'fertilizing')
          .orderBy('scheduled_date.year', 'desc')
          .orderBy('scheduled_date.month', 'desc')
          .orderBy('scheduled_date.day', 'desc')
          .limit(1)
          .get();

        let startingDate = null;

        if (!lastSnapshot.empty) {
          const last = lastSnapshot.docs[0].data().scheduled_date;
          startingDate = addDays(new Date(last.year, last.month - 1, last.day), fertilizingFrequency);
          console.log(`🕰 Last fertilizing found. Next fertilizing starts at ${startingDate.toDateString()}`);
        } else {
          startingDate = new Date(today.year, today.month - 1, today.day);
          console.log(`🌱 No previous fertilizing. Starting from today: ${startingDate.toDateString()}`);
        }

        // Schedule next 3 fertilizing notifications
        let newScheduledDate = new Date(startingDate);

        for (let i = 0; i < 3; i++) {
          const formattedDate = toDateObj(newScheduledDate);

          await notificationsRef.add({
            type: 'fertilizing',
            user_id: userId,
            plant_id: plantId,
            scheduled_date: formattedDate,
            isRead: false,
          });

          console.log(`✅ Scheduled fertilizing #${i + 1} for ${plantId} on ${formattedDate.year}-${formattedDate.month}-${formattedDate.day}`);

          newScheduledDate = addDays(newScheduledDate, fertilizingFrequency);
        }
      }
    }

    console.log('🌱 Fertilizing notifications creation complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
