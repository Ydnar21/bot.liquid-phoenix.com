import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// @ts-ignore
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
const dbId = (!firebaseConfig.firestoreDatabaseId || firebaseConfig.firestoreDatabaseId === "(default)" || firebaseConfig.firestoreDatabaseId === "default")
  ? undefined
  : firebaseConfig.firestoreDatabaseId;
export let db = dbId ? getFirestore(app, dbId) : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export function switchToDefaultClientDb() {
  console.log("Client database fallback check triggered, keeping configured database: ", firebaseConfig.firestoreDatabaseId);
}

export { signInWithPopup, signOut };
