import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyCACMW-47lC2vyObe2ucfBj3xQeWK0bXEk",
  authDomain: "amarbasha-5272c.firebaseapp.com",
  projectId: "amarbasha-5272c",
  storageBucket: "amarbasha-5272c.firebasestorage.app",
  messagingSenderId: "394776630188",
  appId: "1:394776630188:web:8fb7b44a323fc5cc986009",
  measurementId: "G-YQJQ4ZC48Q"
};

export const firebaseApp = initializeApp(firebaseConfig);
export { firebaseConfig };
