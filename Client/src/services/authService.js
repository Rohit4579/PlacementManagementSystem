// src/services/authService.js

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "firebase/auth";

import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "firebase/firestore";

import {
    auth,
    db
} from "../firebase/firebaseConfig";


// =====================================================
// REGISTER USER
// =====================================================

export async function registerUser(
    name,
    email,
    password,
    role
) {

    try {

        const normalizedRole =
            role?.toLowerCase();

        // Only students and companies
        // can register themselves.

        if (
            normalizedRole !== "student" &&
            normalizedRole !== "company"
        ) {

            throw new Error(
                "Invalid registration role."
            );

        }


        const normalizedEmail =
            email.trim().toLowerCase();


        // Create Firebase Authentication account

        const result =
            await createUserWithEmailAndPassword(
                auth,
                normalizedEmail,
                password
            );


        const firebaseUser =
            result.user;


        // Create Firestore user document

        await setDoc(

            doc(
                db,
                "users",
                firebaseUser.uid
            ),

            {

                uid:
                    firebaseUser.uid,

                name:
                    name.trim(),

                email:
                    normalizedEmail,

                role:
                    normalizedRole,

                createdAt:
                    serverTimestamp()

            }

        );


        return {

            uid:
                firebaseUser.uid,

            name:
                name.trim(),

            email:
                normalizedEmail,

            role:
                normalizedRole

        };

    }

    catch (error) {

        console.error(
            "Register Error:",
            error
        );

        throw error;

    }

}


// =====================================================
// LOGIN USER
// =====================================================

export async function loginUser(
    email,
    password
) {

    try {

        const normalizedEmail =
            email.trim().toLowerCase();


        console.log(
            "Attempting Firebase login:",
            normalizedEmail
        );


        // ---------------------------------------------
        // Firebase Authentication
        // ---------------------------------------------

        const result =
            await signInWithEmailAndPassword(

                auth,

                normalizedEmail,

                password

            );


        const firebaseUser =
            result.user;


        console.log(
            "Firebase login successful:",
            firebaseUser.uid
        );


        // ---------------------------------------------
        // Get Firestore user
        // ---------------------------------------------

        const userRef =
            doc(

                db,

                "users",

                firebaseUser.uid

            );


        const userDoc =
            await getDoc(userRef);


        if (!userDoc.exists()) {

            await signOut(auth);

            throw new Error(
                "Your Firebase account exists, but your user profile does not exist in Firestore."
            );

        }


        const userData =
            userDoc.data();


        const role =
            userData.role?.toLowerCase();


        // ---------------------------------------------
        // Validate role
        // ---------------------------------------------

        if (
            role !== "student" &&
            role !== "company" &&
            role !== "admin"
        ) {

            await signOut(auth);

            throw new Error(
                "Invalid user role."
            );

        }


        return {

            uid:
                firebaseUser.uid,

            name:
                userData.name || "",

            email:
                userData.email ||
                firebaseUser.email ||
                "",

            role:
                role

        };

    }

    catch (error) {

        console.error(
            "Login Error Code:",
            error.code
        );

        console.error(
            "Login Error:",
            error.message
        );

        throw error;

    }

}


// =====================================================
// LOGOUT
// =====================================================

export async function logoutUser() {

    await signOut(auth);

}