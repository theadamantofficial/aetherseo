"use client";

import { getApps, getApp, initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { GoogleAuthProvider, OAuthProvider, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBi5Q4MIrSCb76-OD1l7La7epoFHZCnBQ4",
  authDomain: "rankly-9de82.firebaseapp.com",
  projectId: "rankly-9de82",
  storageBucket: "rankly-9de82.firebasestorage.app",
  messagingSenderId: "847740086035",
  appId: "1:847740086035:web:5811177bfaaa6b619ddce6",
  measurementId: "G-RP8XKV7BEX",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const analyticsPromise =
  typeof window !== "undefined"
    ? isSupported().then((supported) => (supported ? getAnalytics(app) : null))
    : Promise.resolve(null);

export const auth = getAuth(app);
export const firestore = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider("apple.com");

appleProvider.addScope("email");
appleProvider.addScope("name");
