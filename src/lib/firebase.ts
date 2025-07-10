// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth'; // Added connectAuthEmulator
import { 
  getFirestore, 
  type Firestore,
  collection,
  collectionGroup,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
  Timestamp,
  writeBatch,
  limit,
  onSnapshot,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';


const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp;


// let storage: FirebaseStorage;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);


// Connect to emulators in development
/*
if (process.env.NODE_ENV === 'development') {
  try {
    // Make sure emulators are running before connecting
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log("Firebase Emulators connected.");
  } catch (error) {
    console.error("Error connecting to Firebase Emulators:", error);
  }
}
*/

// storage = getStorage(app);

export { 
  app, 
  auth, 
  db, 
  functions,
  httpsCallable,
  collection,
  collectionGroup,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
  Timestamp,
  writeBatch,
  limit,
  onSnapshot,
  enableNetwork,
  disableNetwork,
  /*, storage */ 
};
