import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBHpbgoGs7HFQ3-1tBn9BpGT4YYDaKkZB8",
  authDomain: "mm-islamic-erp.firebaseapp.com",
  databaseURL: "https://mm-islamic-erp-default-rtdb.firebaseio.com",
  projectId: "mm-islamic-erp",
  storageBucket: "mm-islamic-erp.firebasestorage.app",
  messagingSenderId: "547338314533",
  appId: "1:547338314533:web:3973c2b36ef8b3b01170cc"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
