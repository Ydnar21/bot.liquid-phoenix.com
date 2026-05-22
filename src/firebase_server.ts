import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
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

function getDbInstance(app: admin.app.App, dbIdInput?: string) {
  const dbId = (!dbIdInput || dbIdInput === "(default)" || dbIdInput === "default")
    ? undefined
    : dbIdInput;
  return dbId ? getFirestore(app, dbId) : getFirestore(app);
}

let adminDb: admin.firestore.Firestore;

export function switchToDefaultDatabase() {
  console.log("Database fallback check triggered, keeping the configured custom database: ", firebaseConfig.firestoreDatabaseId);
}

try {
  let app: admin.app.App;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE) {
    // Active on Cloud Run
    app = admin.apps[0] || admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
  } else {
    // Backup helper for local testing
    app = admin.apps[0] || admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
  }
  // Connect to our styled custom database ID
  adminDb = getDbInstance(app, firebaseConfig.firestoreDatabaseId);
  console.log("Firebase Admin Firestore Initialized with DB:", firebaseConfig.firestoreDatabaseId);
} catch (error) {
  console.warn("Firebase Admin failed default initialization. Falling back to project ID:", error);
  try {
    const app = admin.apps[0] || admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
    adminDb = getDbInstance(app, firebaseConfig.firestoreDatabaseId);
  } catch (err2) {
    console.error("Critical: Could not initialize Firebase Admin:", err2);
    // Mock db to prevent server crash
    adminDb = {} as admin.firestore.Firestore;
  }
}

export function getAdminDb(): admin.firestore.Firestore {
  return adminDb;
}

export { adminDb };
