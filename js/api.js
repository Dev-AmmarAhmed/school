import { db } from './firebaseconfig.js';
import { ref, get, set, update, remove, child, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

export async function safeDataFetch(refPath) {
  try {
    const snap = await get(child(ref(db), refPath));
    return snap.exists() ? snap.val() : null;
  } catch(err) {
    console.error(`Database fetch error on path ${refPath}:`, err);
    return null;
  }
}

export async function verifyUserRole(username, expectedRole) {
  if (!username) { window.location.replace('../login.html'); return null; }
  const userNode = await safeDataFetch(`users/${username}`);
  if (!userNode || userNode.role !== expectedRole) {
    window.location.replace('../login.html'); return null;
  }
  return userNode;
}

// NOTIFICATION SYSTEM WITH UNREAD COUNT
export async function pushNotification(targetUserId, title, message, type) {
  const notifId = Date.now().toString();
  const notifObj = { id: notifId, title: title, message: message, type: type, timestamp: new Date().toISOString(), read: false };
  await set(ref(db, `notifications/${targetUserId}/${notifId}`), notifObj);
}

export function listenForNotifications(userId, callback) {
  const notifRef = ref(db, `notifications/${userId}`);
  onValue(notifRef, (snap) => {
    if (snap.exists()) {
      let notifications = Object.values(snap.val());
      notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      let unreadCount = notifications.filter(n => n.read === false).length;
      callback(notifications.slice(0, 15), unreadCount); 
    } else {
      callback([], 0);
    }
  });
}

export async function markNotificationsAsRead(userId, notifications) {
  const updates = {};
  notifications.forEach(n => {
    if (n.read === false) updates[`notifications/${userId}/${n.id}/read`] = true;
  });
  if (Object.keys(updates).length > 0) await update(ref(db), updates);
}

// IN/OUT LOGGING
export async function logTeacherTime(username, type) {
  const today = new Date();
  const dateKey = `${today.getFullYear()}_${(today.getMonth() + 1).toString().padStart(2, '0')}_${today.getDate().toString().padStart(2, '0')}`;
  const timestamp = today.getTime(); 
  const logPath = `teacher_logs/${dateKey}/${username}/${type.toLowerCase()}`;
  
  const existingLog = await safeDataFetch(logPath);
  if (existingLog) return { success: false, message: `System Verified: You have already logged ${type} for today.` };

  await set(ref(db, logPath), timestamp);
  const teacherData = await safeDataFetch(`teachers/${username}`);
  const tName = teacherData ? teacherData.name : username;
  const actionText = type.toUpperCase() === 'IN' ? 'is at school' : 'is leaving school';
  await pushNotification("admin", "Muster Update", `${tName} ${actionText} (Logged at ${today.toLocaleTimeString()})`, "teacher_log");
  
  return { success: true, time: timestamp };
}

// DAILY CLAIMS
export async function processDailyClaim(userId, role, pointsToAward) {
  const todayKey = `${new Date().getFullYear()}_${new Date().getMonth() + 1}_${new Date().getDate()}`;
  const claimPath = role === "teacher" ? `teacher_daily_claims/${userId}/${todayKey}` : `daily_claims/${userId}/${todayKey}`;
  
  const existingClaim = await safeDataFetch(claimPath);
  if (existingClaim === true) return { success: false, message: "Database Verified: You have already collected today's point!" };

  const updates = {}; updates[claimPath] = true;
  if (role === "teacher") {
    const teacher = await safeDataFetch(`teachers/${userId}`);
    updates[`teachers/${userId}/points`] = (teacher.points || 0) + pointsToAward;
  } else {
    const student = await safeDataFetch(`students/${userId}`);
    updates[`students/${userId}/points`] = (student.points || 0) + pointsToAward;
  }

  await update(ref(db), updates);
  await pushNotification(userId, "Points Added!", `You claimed +${pointsToAward} daily points.`, "points_added");
  return { success: true };
}
