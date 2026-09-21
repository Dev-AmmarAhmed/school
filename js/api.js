import { db } from './firebaseconfig.js';
import { ref, get, set, update, child, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ============================================================================
// 1. SECURE DATABASE FETCHING (Prevents Read/Write Limit Exhaustion)
// ============================================================================
export async function safeDataFetch(refPath) {
  try {
    const snap = await get(child(ref(db), refPath));
    return snap.exists() ? snap.val() : null;
  } catch(err) {
    console.error(`Database fetch error on path ${refPath}:`, err);
    return null;
  }
}

// ============================================================================
// 2. ROLE VERIFICATION & SECURITY ROUTING
// ============================================================================
export async function verifyUserRole(username, expectedRole) {
  if (!username) {
    window.location.replace('../login.html');
    return null;
  }
  const userNode = await safeDataFetch(`users/${username}`);
  if (!userNode || userNode.role !== expectedRole) {
    window.location.replace('../login.html');
    return null;
  }
  return userNode;
}

// ============================================================================
// 3. ADVANCED NOTIFICATION ENGINE (With Unread Badge Logic)
// ============================================================================
export async function pushNotification(targetUserId, title, message, type) {
  const notifId = Date.now().toString();
  const notifObj = {
    id: notifId,
    title: title,
    message: message,
    type: type || "general",
    timestamp: new Date().toISOString(),
    read: false // Default false taaki frontend pe red badge aayega
  };
  await set(ref(db, `notifications/${targetUserId}/${notifId}`), notifObj);
}

// Ye listener 15 latest notifications fetch karega aur unread count return karega
export function listenForNotifications(userId, callback) {
  const notifRef = ref(db, `notifications/${userId}`);
  onValue(notifRef, (snap) => {
    if (snap.exists()) {
      let notifications = Object.values(snap.val());
      
      // Nayi notifications upar dikhane ke liye sort karein
      notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Sirf latest 15 notifications rakhni hain memory/UI bachaane ke liye
      const latest15 = notifications.slice(0, 15);
      
      // Unread count calculate karein red badge ke liye
      const unreadCount = latest15.filter(n => n.read === false).length;
      
      callback(latest15, unreadCount); 
    } else {
      callback([], 0);
    }
  });
}

// Bell icon dabane par saari unread notifications ko 'read' mark karega
export async function markNotificationsAsRead(userId) {
  const snap = await safeDataFetch(`notifications/${userId}`);
  if (snap) {
    const updates = {};
    Object.keys(snap).forEach(notifId => {
      if (snap[notifId].read === false) {
        updates[`notifications/${userId}/${notifId}/read`] = true;
      }
    });
    if (Object.keys(updates).length > 0) {
      await update(ref(db), updates);
    }
  }
}

// ============================================================================
// 4. TEACHER IN / OUT LOGGING SYSTEM (Double-Tap Protected)
// ============================================================================
export async function logTeacherTime(username, type) {
  const today = new Date();
  const dateKey = `${today.getFullYear()}_${(today.getMonth() + 1).toString().padStart(2, '0')}_${today.getDate().toString().padStart(2, '0')}`;
  const timestamp = today.getTime(); 
  
  const logPath = `teacher_logs/${dateKey}/${username}/${type.toLowerCase()}`;
  
  // Realtime verification: Prevent multiple logs
  const existingLog = await safeDataFetch(logPath);
  if (existingLog) {
    return { success: false, message: `System Verified: You have already logged ${type} for today.` };
  }

  await set(ref(db, logPath), timestamp);
  
  // Admin ko realtime notification push karna
  const teacherData = await safeDataFetch(`teachers/${username}`);
  const tName = teacherData ? teacherData.name : username;
  const actionText = type.toUpperCase() === 'IN' ? 'is at school' : 'is leaving school';
  
  await pushNotification("admin", "Muster Update", `${tName} ${actionText} (Logged at ${today.toLocaleTimeString('en-IN')})`, "teacher_log");
  
  return { success: true, time: timestamp };
}

// ============================================================================
// 5. SECURE DAILY REWARD CLAIM ENGINE (With Notification)
// ============================================================================
export async function processDailyClaim(userId, role, pointsToAward) {
  const today = new Date();
  const todayKey = `${today.getFullYear()}_${today.getMonth() + 1}_${today.getDate()}`;
  const claimPath = role === "teacher" ? `teacher_daily_claims/${userId}/${todayKey}` : `daily_claims/${userId}/${todayKey}`;
  
  // Direct Async Verification
  const existingClaim = await safeDataFetch(claimPath);
  if (existingClaim === true) {
    return { success: false, message: "Database Verified: You have already collected today's points!" };
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
  
  // App-level notification generate karein point add hone par
  await pushNotification(userId, "Points Awarded! ⭐", `You claimed +${pointsToAward} daily points.`, "points_added");
  
  return { success: true };
}
