import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

import {
  syncedFirebaseConfig,
  syncedGoogleAuthConfig,
} from '../generated/firebase-config';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? syncedFirebaseConfig.apiKey,
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? syncedFirebaseConfig.authDomain,
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? syncedFirebaseConfig.projectId,
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    syncedFirebaseConfig.storageBucket,
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
    syncedFirebaseConfig.messagingSenderId,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? syncedFirebaseConfig.appId,
};

export const googleAuthConfig = {
  webClientId:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
    syncedGoogleAuthConfig.webClientId,
  androidClientId:
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ??
    syncedGoogleAuthConfig.androidClientId,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = (() => {
  const instance = getAuth(app);
  if (Platform.OS === 'web') {
    setPersistence(instance, browserLocalPersistence).catch(() => undefined);
  }
  return instance;
})();

const firestore = getFirestore(app);
const storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { app, auth, firestore, storage, googleProvider };
