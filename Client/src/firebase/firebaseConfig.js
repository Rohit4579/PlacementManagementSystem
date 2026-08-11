// src/firebase/firebaseConfig.js

import { initializeApp } from "firebase/app";

import {
    getAuth
} from "firebase/auth";

import {
    getFirestore
} from "firebase/firestore";

import {
    getStorage
} from "firebase/storage";


// =====================================================
// FIREBASE CONFIGURATION
// Project: placement-management-sys-814f1
// =====================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyCcGHZCt1UFGLl1DVP4ZX1J_z_KxrInqQk",

    authDomain:
        "placement-management-sys-814f1.firebaseapp.com",

    databaseURL:
        "https://placement-management-sys-814f1-default-rtdb.asia-southeast1.firebasedatabase.app",

    projectId:
        "placement-management-sys-814f1",

    storageBucket:
        "placement-management-sys-814f1.firebasestorage.app",

    messagingSenderId:
        "91483705231",

    appId:
        "1:91483705231:web:4093b2656affeba43ac5fa",

    measurementId:
        "G-J44KZZ5FMG"

};


// =====================================================
// INITIALIZE FIREBASE
// =====================================================

const app = initializeApp(firebaseConfig);


// =====================================================
// FIREBASE SERVICES
// =====================================================

export const auth = getAuth(app);

export const db = getFirestore(app);

export const storage = getStorage(app);


// Export app if needed elsewhere

export default app;