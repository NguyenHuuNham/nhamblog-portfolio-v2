// =============================================
// firebase-config.js
// ĐỂ BẬT BACKEND THẬT: Điền Firebase config của bạn vào đây
// Hướng dẫn: https://console.firebase.google.com → Project Settings → Your apps → Web app
// =============================================

const FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
};

// =============================================
// Chế độ hoạt động:
//   FIREBASE_ENABLED = true  → Dùng Firebase (real backend, data shared cho tất cả)
//   FIREBASE_ENABLED = false → Dùng localStorage (local only, không share)
// Tự động detect dựa vào config ở trên
// =============================================
const FIREBASE_ENABLED = (
  FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY" &&
  FIREBASE_CONFIG.projectId !== "YOUR_PROJECT_ID"
);

let _db = null;
let _storage = null;

if (FIREBASE_ENABLED) {
  try {
    if (!firebase.apps || firebase.apps.length === 0) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    _db      = firebase.firestore();
    _storage = firebase.storage();
    console.log('✅ Firebase connected:', FIREBASE_CONFIG.projectId);
  } catch (e) {
    console.error('❌ Firebase init failed:', e);
  }
} else {
  console.warn('⚠️ Firebase chưa được cấu hình → đang dùng localStorage offline mode');
}
