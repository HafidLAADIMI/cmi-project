import {
    initializeFirestore,
    memoryLocalCache,

} from 'firebase/firestore';
import {getAuth} from 'firebase/auth';
import {getStorage} from 'firebase/storage';
import {initializeApp} from 'firebase/app';

const firebaseConfig = {

  apiKey: "AIzaSyA0HdeDYIv38UHICf7tsFaXWtFNG_5WUSE",

  authDomain: "afood-a8ea4.firebaseapp.com",

  projectId: "afood-a8ea4",

  storageBucket: "afood-a8ea4.firebasestorage.app",

  messagingSenderId: "555100471697",

  appId: "1:555100471697:web:c259b06146389fa9901a30",

  measurementId: "G-8W46V6QGQV"

};




export const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
    localCache: memoryLocalCache(),
});
export const auth = getAuth(app);
export const storage = getStorage(app);