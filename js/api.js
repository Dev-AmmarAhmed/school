import { db } from './firebaseconfig.js';
import { ref, get, set, update, remove, child, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// --- CORE FETCH UTILS ---
export async function safeDataFetch(refPath) {
  try {
    const snap = await get(child(ref(db), refPath));
    return snap.exists() ? snap.val() : null;
  } catch(err) {
    console.error(`Database fetch error on path ${refPath}:`, err);
    return null;
  }
}

// --- AUTHENTICATION & SECURITY ---
export async function verifyUserRole(username, expectedRole) {
  const userNode = await safeDataFetch(`users/${username}`);
  if (!userNode || userNode.role !== expectedRole) {
    // If not verified, kick them back to login to prevent unauthorized access
    window.location.href = '/login.html';
    return null;
  }
  return userNode;
}

// --- NOTIFICATIONS SYSTEM ---
export async function pushNotification(userId, title, message, type) {
  const notifId = Date.now().toString();
  const notifObj = {
    id: notifId,
    title: title,
    message: message,
    type: type,
    timestamp: new Date().toISOString(),
    read: false
  };
  await set(ref(db, `notifications/${userId}/${notifId}`), notifObj);
}

export function listenForNotifications(userId, callback) {
  const notifRef = ref(db, `notifications/${userId}`);
  onValue(notifRef, (snap) => {
    if (snap.exists()) {
      // Process and sort top 15 latest notifications
      let notifications = Object.values(snap.val());
      notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      callback(notifications.slice(0, 15)); 
    }
  });
}

// --- SECURE CLAIM SYSTEM (Student & Teacher) ---
export async function processDailyClaim(userId, role, pointsToAward) {
  const todayKey = `${new Date().getFullYear()}_${new Date().getMonth() + 1}_${new Date().getDate()}`;
  const claimPath = role === "teacher" ? `teacher_daily_claims/${userId}/${todayKey}` : `daily_claims/${userId}/${todayKey}`;
  
  // Double verification on the database side before awarding points
  const existingClaim = await safeDataFetch(claimPath);
  if (existingClaim === true) {
    return { success: false, message: "Already claimed today." };
  }

  const updates = {};
  updates[claimPath] = true;
  
  if (role === "teacher") {
    const teacher = await safeDataFetch(`teachers/${userId}`);
    updates[`teachers/${userId}/points`] = (teacher.points || 0) + pointsToAward;
  } else {
    const student = await safeDataFetch(`students/${userId}`);
    updates[`students/${userId}/points`] = (student.points || 0) + pointsToAward;
  }

  await update(ref(db), updates);
  
  // Trigger notification for point addition
  await pushNotification(userId, "Points Awarded!", `You claimed +${pointsToAward} daily points.`, "points_added");
  return { success: true };
}

// --- TEACHER IN/OUT LOGGING ---
export async function logTeacherTime(username, type) {
  // type = 'IN' or 'OUT'
  const today = new Date();
  const dateKey = `${today.getFullYear()}_${(today.getMonth() + 1).toString().padStart(2, '0')}_${today.getDate().toString().padStart(2, '0')}`;
  const timestamp = today.toISOString();
  
  const logPath = `teacher_logs/${dateKey}/${username}/${type.toLowerCase()}`;
  
  // Verify if already logged to prevent double-tapping
  const existingLog = await safeDataFetch(logPath);
  if (existingLog) {
    return { success: false, message: `Already logged ${type} for today.` };
  }

  await set(ref(db, logPath), timestamp);
  
  // Notify Admin
  await pushNotification("admin", "Teacher Log", `Teacher ${username} logged ${type} at ${today.toLocaleTimeString()}`, "teacher_log");
  return { success: true, time: timestamp };
}
