import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-check.js";

const firebaseConfig = {
  apiKey: "AIzaSyBHpbgoGs7HFQ3-1tBn9BpGT4YYDaKkZB8",
  authDomain: "mm-islamic-erp.firebaseapp.com",
  databaseURL: "https://mm-islamic-erp-default-rtdb.firebaseio.com",
  projectId: "mm-islamic-erp",
  storageBucket: "mm-islamic-erp.firebasestorage.app",
  messagingSenderId: "547338314533",
  appId: "1:547338314533:web:3973c2b36ef8b3b01170cc"
};

// 1. Initialize Firebase App
const app = initializeApp(firebaseConfig);

// 2. Initialize Firebase App Check with your ReCaptcha Site Key
try {
  if (typeof initializeAppCheck === 'function') {
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider('6LefZbUtAAAAADOa8KBfn1qywMly7Ky2-UlX6zxW'),
      isTokenAutoRefreshEnabled: true
    });
  }
} catch (err) {
  console.warn("App Check initialization error:", err);
}

// 3. Export Database instance
export const db = getDatabase(app);
