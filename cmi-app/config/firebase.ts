// config/firebase.ts - Safer configuration
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAbWRtpnsdDWVOEYjIAHVzDD3I9RbUDzwk",
  authDomain: "sunmi-c3225.firebaseapp.com",
  projectId: "sunmi-c3225",
  storageBucket: "sunmi-c3225.firebasestorage.app",
  messagingSenderId: "65349522250",
  appId: "1:65349522250:web:f2da38f919adc876f627b3",
  measurementId: "G-ELGLNPQZ9Q"
};

// Initialize Firebase with error handling
let app;
let db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('🔥 Firebase initialized successfully!');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  // Create a fallback to prevent crashes
  db = null;
}

export { db };
export default app;