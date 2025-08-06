// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "PLACEHOLDER_API_KEY",
  authDomain: "PLACEHOLDER_AUTH_DOMAIN",
  databaseURL: "https://zxcdreioof-default-rtdb.firebaseio.com/",
  projectId: "zxcdreioof",
  storageBucket: "PLACEHOLDER_STORAGE_BUCKET",
  messagingSenderId: "PLACEHOLDER_MESSAGING_SENDER_ID",
  appId: "PLACEHOLDER_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);