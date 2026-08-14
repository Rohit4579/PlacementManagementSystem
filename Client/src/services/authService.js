// src/services/authService.js

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    deleteUser,
    sendPasswordResetEmail,
    linkWithCredential,
    GoogleAuthProvider
} from "firebase/auth";

import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs,
    deleteDoc
} from "firebase/firestore";

import {
    auth,
    db
} from "../firebase/firebaseConfig";


// =====================================================
// GOOGLE PROVIDER
// =====================================================

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
    prompt: "select_account"
});


// =====================================================
// VALID ROLES
// =====================================================

const VALID_ROLES = [
    "student",
    "company",
    "admin"
];


// =====================================================
// NORMALIZE ROLE
// =====================================================

function normalizeRole(role) {

    if (
        role === null ||
        role === undefined
    ) {
        return "";
    }

    return String(role)
        .trim()
        .toLowerCase();
}


// =====================================================
// NORMALIZE EMAIL
// =====================================================

function normalizeEmail(email) {

    return String(email || "")
        .trim()
        .toLowerCase();
}


// =====================================================
// GET VALID ROLE
// =====================================================

function getValidRole(userData) {

    const role = normalizeRole(
        userData?.role
    );

    return VALID_ROLES.includes(role)
        ? role
        : "";
}


// =====================================================
// FIND FIRESTORE USER BY EMAIL
// =====================================================

async function findUserByEmail(email) {

    const normalizedEmail =
        normalizeEmail(email);

    if (!normalizedEmail) {
        return null;
    }

    const usersRef =
        collection(
            db,
            "users"
        );

    const usersQuery =
        query(
            usersRef,
            where(
                "email",
                "==",
                normalizedEmail
            )
        );

    const snapshot =
        await getDocs(
            usersQuery
        );

    if (snapshot.empty) {
        return null;
    }

    const firstDocument =
        snapshot.docs[0];

    return {
        id: firstDocument.id,
        data: firstDocument.data()
    };
}


// =====================================================
// GET USER PROFILE FROM FIRESTORE
// =====================================================
//
// IMPORTANT:
// This function is used both by Login.jsx and
// authService functions to restore the user's role.
//
// =====================================================

export async function getAuthenticatedUserProfile(
    firebaseUser = auth.currentUser
) {

    if (!firebaseUser) {
        return null;
    }

    const uid =
        firebaseUser.uid;

    const email =
        normalizeEmail(
            firebaseUser.email
        );

    const userRef =
        doc(
            db,
            "users",
            uid
        );

    const userDoc =
        await getDoc(
            userRef
        );

    let userData =
        userDoc.exists()
            ? userDoc.data()
            : null;

    let role =
        getValidRole(
            userData
        );


    // =================================================
    // NORMAL UID DOCUMENT FOUND
    // =================================================

    if (role) {

        return {

            uid,

            name:
                userData?.name ||
                firebaseUser.displayName ||
                "",

            email:
                userData?.email ||
                email,

            role

        };
    }


    // =================================================
    // FALLBACK: SEARCH USER BY EMAIL
    // =================================================

    if (email) {

        const emailUser =
            await findUserByEmail(
                email
            );

        if (emailUser) {

            const emailData =
                emailUser.data;

            role =
                getValidRole(
                    emailData
                );

            if (role) {

                // Repair users/{auth.uid}
                await setDoc(

                    userRef,

                    {

                        uid,

                        name:
                            emailData?.name ||
                            firebaseUser.displayName ||
                            "",

                        email,

                        role,

                        repairedAt:
                            serverTimestamp()

                    },

                    {
                        merge: true
                    }
                );

                return {

                    uid,

                    name:
                        emailData?.name ||
                        firebaseUser.displayName ||
                        "",

                    email:
                        emailData?.email ||
                        email,

                    role

                };
            }
        }
    }


    // =================================================
    // NO VALID PROFILE
    // =================================================

    return null;
}


// =====================================================
// REGISTER USER
// =====================================================

export async function registerUser(
    name,
    email,
    password,
    role
) {

    const normalizedRole =
        normalizeRole(role);

    const normalizedEmail =
        normalizeEmail(email);


    if (
        normalizedRole !== "student" &&
        normalizedRole !== "company"
    ) {

        const error =
            new Error(
                "Invalid registration role."
            );

        error.code =
            "invalid-registration-role";

        throw error;
    }


    if (!normalizedEmail) {

        const error =
            new Error(
                "Email address is required."
            );

        error.code =
            "auth/invalid-email";

        throw error;
    }


    try {

        const result =
            await createUserWithEmailAndPassword(
                auth,
                normalizedEmail,
                password
            );

        const firebaseUser =
            result.user;


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
                    String(
                        name || ""
                    ).trim(),

                email:
                    normalizedEmail,

                role:
                    normalizedRole,

                provider:
                    "password",

                createdAt:
                    serverTimestamp()

            }
        );


        console.log(
            "Registration successful:",
            firebaseUser.uid
        );


        return {

            uid:
                firebaseUser.uid,

            name:
                String(
                    name || ""
                ).trim(),

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
// LOGIN WITH EMAIL + PASSWORD
// =====================================================

export async function loginUser(
    email,
    password
) {

    const normalizedEmail =
        normalizeEmail(email);

    try {

        console.log(
            "Email login started:",
            normalizedEmail
        );


        const result =
            await signInWithEmailAndPassword(
                auth,
                normalizedEmail,
                password
            );


        const firebaseUser =
            result.user;


        const profile =
            await getAuthenticatedUserProfile(
                firebaseUser
            );


        // =================================================
        // AUTH ACCOUNT EXISTS BUT PROFILE DOES NOT
        // =================================================

        if (!profile) {

            await signOut(auth);

            const profileError =
                new Error(
                    "Your authentication account exists, but your user profile could not be found. Please contact the administrator."
                );

            profileError.code =
                "user-profile-not-found";

            throw profileError;
        }


        console.log(
            "Email login successful:",
            profile
        );


        return profile;

    }
    catch (error) {

        console.error(
            "===================================="
        );

        console.error(
            "EMAIL LOGIN FAILED"
        );

        console.error(
            "Error code:",
            error?.code
        );

        console.error(
            "Error message:",
            error?.message
        );

        console.error(
            "===================================="
        );

        throw error;
    }
}


// =====================================================
// GOOGLE LOGIN
// =====================================================
//
// Behavior:
//
// 1. Existing Google account
//      -> login normally.
//
// 2. Existing password account with same email
//      -> Firebase reports account-exists-with-different-credential.
//      -> User must provide existing password.
//      -> Password account is authenticated.
//      -> Google credential is linked.
//
// 3. New Google account
//      -> creates a new student account.
//
// IMPORTANT:
// Google NEVER changes the existing password.
//
// =====================================================

export async function loginWithGoogle(
    existingEmail = "",
    existingPassword = ""
) {

    try {

        console.log(
            "Google login started."
        );


        let result;


        // =================================================
        // TRY NORMAL GOOGLE LOGIN
        // =================================================

        try {

            result =
                await signInWithPopup(
                    auth,
                    googleProvider
                );

        }
        catch (googleError) {

            console.error(
                "Google popup error:",
                googleError?.code
            );


            // =================================================
            // DIFFERENT PROVIDER
            // =================================================

            if (
                googleError?.code !==
                "auth/account-exists-with-different-credential"
            ) {

                throw googleError;
            }


            const googleCredential =
                GoogleAuthProvider.credentialFromError(
                    googleError
                );


            if (!googleCredential) {

                const credentialError =
                    new Error(
                        "Unable to retrieve the Google credential."
                    );

                credentialError.code =
                    "google-credential-unavailable";

                throw credentialError;
            }


            const googleEmail =
                normalizeEmail(
                    googleError?.customData?.email ||
                    existingEmail
                );


            if (!googleEmail) {

                const emailError =
                    new Error(
                        "Please enter the Google account email."
                    );

                emailError.code =
                    "auth/invalid-email";

                throw emailError;
            }


            // =================================================
            // EXISTING PASSWORD REQUIRED
            // =================================================

            if (!existingPassword) {

                const passwordRequiredError =
                    new Error(
                        "This email already has a password account. Enter your existing password and click Continue with Google again to safely link Google."
                    );

                passwordRequiredError.code =
                    "auth/password-required-for-linking";

                passwordRequiredError.email =
                    googleEmail;

                passwordRequiredError.googleCredential =
                    googleCredential;

                throw passwordRequiredError;
            }


            // =================================================
            // SIGN INTO EXISTING PASSWORD ACCOUNT
            // =================================================

            let existingResult;

            try {

                existingResult =
                    await signInWithEmailAndPassword(
                        auth,
                        googleEmail,
                        existingPassword
                    );

            }
            catch (passwordError) {

                console.error(
                    "Existing password verification failed:",
                    passwordError?.code
                );

                throw passwordError;
            }


            const existingUser =
                existingResult.user;


            // =================================================
            // CHECK GOOGLE PROVIDER
            // =================================================

            const googleAlreadyLinked =
                existingUser.providerData.some(
                    provider =>
                        provider.provider ===
                        "google.com"
                );


            if (!googleAlreadyLinked) {

                await linkWithCredential(
                    existingUser,
                    googleCredential
                );

                console.log(
                    "Google successfully linked."
                );

            }


            // =================================================
            // LOAD PROFILE
            // =================================================

            const profile =
                await getAuthenticatedUserProfile(
                    existingUser
                );


            if (!profile) {

                await signOut(auth);

                const profileError =
                    new Error(
                        "Your account was authenticated, but the user profile could not be found."
                    );

                profileError.code =
                    "user-profile-not-found";

                throw profileError;
            }


            return {

                ...profile,

                linkedGoogle:
                    !googleAlreadyLinked

            };
        }


        // =================================================
        // NORMAL GOOGLE LOGIN SUCCESS
        // =================================================

        const firebaseUser =
            result.user;

        const uid =
            firebaseUser.uid;

        const normalizedEmail =
            normalizeEmail(
                firebaseUser.email
            );


        console.log(
            "Google authentication successful:",
            normalizedEmail
        );


        // =================================================
        // CHECK EXISTING UID PROFILE
        // =================================================

        const existingProfile =
            await getAuthenticatedUserProfile(
                firebaseUser
            );


        if (existingProfile) {

            return existingProfile;
        }


        // =================================================
        // NEW GOOGLE ACCOUNT
        // =================================================

        const userRef =
            doc(
                db,
                "users",
                uid
            );


        const newUser = {

            uid,

            name:
                firebaseUser.displayName ||
                "",

            email:
                normalizedEmail,

            role:
                "student",

            provider:
                "google",

            createdAt:
                serverTimestamp()

        };


        await setDoc(
            userRef,
            newUser
        );


        console.log(
            "New Google user created as student."
        );


        return {

            uid,

            name:
                firebaseUser.displayName ||
                "",

            email:
                normalizedEmail,

            role:
                "student"

        };

    }
    catch (error) {

        console.error(
            "===================================="
        );

        console.error(
            "GOOGLE LOGIN FAILED"
        );

        console.error(
            "Error code:",
            error?.code
        );

        console.error(
            "Error message:",
            error?.message
        );

        console.error(
            "===================================="
        );

        throw error;
    }
}


// =====================================================
// RESET PASSWORD
// =====================================================

export async function resetPassword(
    email
) {

    const normalizedEmail =
        normalizeEmail(email);


    if (!normalizedEmail) {

        const error =
            new Error(
                "Please enter your email address."
            );

        error.code =
            "auth/invalid-email";

        throw error;
    }


    try {

        await sendPasswordResetEmail(
            auth,
            normalizedEmail
        );

        return true;

    }
    catch (error) {

        console.error(
            "Password reset error:",
            error
        );

        throw error;
    }
}


// =====================================================
// DELETE QUERY DOCUMENTS
// =====================================================

async function deleteQueryDocuments(
    queryRef,
    label
) {

    const snapshot =
        await getDocs(
            queryRef
        );


    for (
        const documentSnapshot
        of snapshot.docs
    ) {

        console.log(
            `Deleting ${label}:`,
            documentSnapshot.ref.path
        );

        await deleteDoc(
            documentSnapshot.ref
        );
    }
}


// =====================================================
// DELETE USER ACCOUNT
// =====================================================

export async function deleteAccount() {

    try {

        const firebaseUser =
            auth.currentUser;


        if (!firebaseUser) {

            throw new Error(
                "No authenticated user found."
            );
        }


        const uid =
            firebaseUser.uid;


        const userRef =
            doc(
                db,
                "users",
                uid
            );


        const userDoc =
            await getDoc(
                userRef
            );


        if (!userDoc.exists()) {

            throw new Error(
                "User profile does not exist in Firestore."
            );
        }


        const userData =
            userDoc.data();

        const role =
            normalizeRole(
                userData.role
            );


        if (
            role !== "student" &&
            role !== "company"
        ) {

            throw new Error(
                "Only student and company accounts can be deleted from the application."
            );
        }


        // =================================================
        // STUDENT
        // =================================================

        if (role === "student") {

            await deleteDoc(
                doc(
                    db,
                    "studentProfiles",
                    uid
                )
            ).catch(() => {});


            await deleteQueryDocuments(

                query(
                    collection(
                        db,
                        "studentProfiles"
                    ),
                    where(
                        "uid",
                        "==",
                        uid
                    )
                ),

                "student profile"
            );


            await deleteQueryDocuments(

                query(
                    collection(
                        db,
                        "applications"
                    ),
                    where(
                        "studentId",
                        "==",
                        uid
                    )
                ),

                "student application"
            );


            await deleteQueryDocuments(

                query(
                    collection(
                        db,
                        "notifications"
                    ),
                    where(
                        "userId",
                        "==",
                        uid
                    )
                ),

                "student notification"
            );
        }


        // =================================================
        // COMPANY
        // =================================================

        if (role === "company") {

            await deleteDoc(
                doc(
                    db,
                    "companies",
                    uid
                )
            ).catch(() => {});


            await deleteQueryDocuments(

                query(
                    collection(
                        db,
                        "companies"
                    ),
                    where(
                        "uid",
                        "==",
                        uid
                    )
                ),

                "company profile"
            );


            await deleteQueryDocuments(

                query(
                    collection(
                        db,
                        "jobs"
                    ),
                    where(
                        "companyId",
                        "==",
                        uid
                    )
                ),

                "company job"
            );


            await deleteQueryDocuments(

                query(
                    collection(
                        db,
                        "applications"
                    ),
                    where(
                        "companyId",
                        "==",
                        uid
                    )
                ),

                "company application"
            );


            await deleteQueryDocuments(

                query(
                    collection(
                        db,
                        "notifications"
                    ),
                    where(
                        "userId",
                        "==",
                        uid
                    )
                ),

                "company notification"
            );
        }


        // =================================================
        // USERS DOCUMENT
        // =================================================

        await deleteDoc(
            userRef
        );


        // =================================================
        // FIREBASE AUTH ACCOUNT
        // =================================================

        await deleteUser(
            firebaseUser
        );


        return true;

    }
    catch (error) {

        console.error(
            "Delete Account Error:",
            error
        );


        if (
            error?.code ===
            "auth/requires-recent-login"
        ) {

            const recentLoginError =
                new Error(
                    "For security, please log in again and then delete your account."
                );

            recentLoginError.code =
                "auth/requires-recent-login";

            throw recentLoginError;
        }


        throw error;
    }
}


// =====================================================
// LOGOUT
// =====================================================

export async function logoutUser() {

    try {

        await signOut(
            auth
        );

    }
    catch (error) {

        console.error(
            "Logout Error:",
            error
        );

        throw error;
    }
}