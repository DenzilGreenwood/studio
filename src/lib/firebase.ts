// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, deleteUser } from 'firebase/auth'; // Added deleteUser
import { 
  getFirestore, 
  type Firestore,
  collection,
  collectionGroup, // Added collectionGroup
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc, // Ensured deleteDoc is here
  serverTimestamp,
  query,
  orderBy,
  where,
  Timestamp,
  writeBatch, // Ensured writeBatch is here
  limit,
  onSnapshot,
  connectFirestoreEmulator,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';

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
let auth: Auth;
let db: Firestore;
let functions: Functions;
// let storage: FirebaseStorage;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

auth = getAuth(app);
db = getFirestore(app);
functions = getFunctions(app);

// If you want to use emulators in development, uncomment this and configure ports in firebase.json
// if (process.env.NODE_ENV === 'development') {
//   try {
//     connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
//     connectFirestoreEmulator(db, 'localhost', 8080);
//     connectFunctionsEmulator(functions, 'localhost', 5001);
//     // connectStorageEmulator(storage, 'localhost', 9199);
//     console.log("Firebase Emulators connected.");
//   } catch (error) {
//     console.error("Error connecting to Firebase Emulators:", error);
//   }
// }


// storage = getStorage(app);

export { 
  app, 
  auth, 
  db, 
  functions,
  collection,
  collectionGroup, // Added collectionGroup to exports
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
  deleteUser // Export deleteUser
  /*, storage */ 
};
