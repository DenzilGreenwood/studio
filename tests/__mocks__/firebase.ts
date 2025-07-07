// tests/__mocks__/firebase.ts

// Mock all Firebase functions and objects
const mockFn = () => jest.fn();

export const db = {};

export const doc = mockFn();
export const setDoc = mockFn();
export const getDoc = mockFn();
export const updateDoc = mockFn();
export const addDoc = mockFn();
export const deleteDoc = mockFn();
export const collection = mockFn();
export const query = mockFn();
export const where = mockFn();
export const orderBy = mockFn();
export const limit = mockFn();
export const getDocs = mockFn();
export const writeBatch = mockFn();
export const serverTimestamp = mockFn();
export const collectionGroup = mockFn();

export class Timestamp {
  static fromDate = mockFn();
  static now = mockFn();
  toDate = mockFn();
}

// Firebase Auth mocks
export const auth = {
  currentUser: null,
  signInWithEmailAndPassword: mockFn(),
  createUserWithEmailAndPassword: mockFn(),
  signOut: mockFn(),
  onAuthStateChanged: mockFn(),
};

export const signInWithEmailAndPassword = mockFn();
export const createUserWithEmailAndPassword = mockFn();
export const signOut = mockFn();
export const onAuthStateChanged = mockFn();
