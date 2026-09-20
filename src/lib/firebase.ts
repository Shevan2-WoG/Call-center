import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const customDbId =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

function createFirestore() {
  try {
    return initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
      },
      customDbId
    );
  } catch {
    return customDbId ? getFirestore(app, customDbId) : getFirestore(app);
  }
}

export const db = createFirestore();
export const auth = getAuth(app);

// Test connection on boot to ensure backend connectivity
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline status:', error.message);
    }
  }
}

testConnection();

export {
  collection,
  doc,
  getDocs,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  Timestamp,
};
