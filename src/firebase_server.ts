import admin from "firebase-admin";
import fs from "fs";
import path from "path";

interface FirebaseConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId: string;
  storageBucket: string;
  messagingSenderId: string;
  measurementId?: string;
}

let firebaseConfig: FirebaseConfig;
try {
  const configPath = path.resolve("./firebase-applet-config.json");
  const raw = fs.readFileSync(configPath, "utf-8");
  firebaseConfig = JSON.parse(raw);
} catch (err) {
  console.error("Failed to read firebase-applet-config.json for server:", err);
  // Fallback placeholder
  firebaseConfig = {
    projectId: "mock-project",
    appId: "",
    apiKey: "",
    authDomain: "",
    firestoreDatabaseId: "(default)",
    storageBucket: "",
    messagingSenderId: "",
  };
}

let adminDb: admin.firestore.Firestore;

try {
  let app: admin.app.App;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE) {
    // Active on Cloud Run
    app = admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
  } else {
    // Backup helper for local testing
    app = admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
  }
  // Connect to our styled custom database ID
  adminDb = (app as any).firestore(firebaseConfig.firestoreDatabaseId);
  console.log("Firebase Admin Firestore Initialized with DB:", firebaseConfig.firestoreDatabaseId);
} catch (error) {
  console.warn("Firebase Admin failed default initialization. Falling back to project ID:", error);
  try {
    const app = admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
    adminDb = (app as any).firestore(firebaseConfig.firestoreDatabaseId);
  } catch (err2) {
    console.error("Critical: Could not initialize Firebase Admin:", err2);
    // Mock db to prevent server crash
    adminDb = {} as admin.firestore.Firestore;
  }
}

export { adminDb };
