import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD6n4KhTcEI3QIC87B8QMt2r-iscg1tCZY",
  authDomain: "cercle-c3fb2.firebaseapp.com",
  databaseURL: "https://cercle-c3fb2-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "cercle-c3fb2",
  storageBucket: "cercle-c3fb2.firebasestorage.app",
  messagingSenderId: "956698468753",
  appId: "1:956698468753:web:f8e49cff6a02e0224c7a30"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();