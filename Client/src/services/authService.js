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
// GOOGLE AUTH PROVIDER
// =====================================================

const googleProvider =
    new GoogleAuthProvider();


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
            normalizeRole(role);

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


        const normalizedEmail =
            normalizeEmail(email);


        if (!normalizedEmail) {

            const error =
                new Error(
                    "Email address is required."
                );

            error.code =
                "auth/invalid-email";

            throw error;
        }


        // =================================================
        // CREATE AUTH ACCOUNT
        // =================================================

        const result =
            await createUserWithEmailAndPassword(
                auth,
                normalizedEmail,
                password
            );


        const firebaseUser =
            result.user;


        // =================================================
        // CREATE FIRESTORE USER
        // =================================================

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
                    String(name || "").trim(),

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
            "===================================="
        );

        console.log(
            "REGISTRATION SUCCESSFUL"
        );

        console.log(
            "UID:",
            firebaseUser.uid
        );

        console.log(
            "Email:",
            normalizedEmail
        );

        console.log(
            "Role:",
            normalizedRole
        );

        console.log(
            "===================================="
        );


        return {

            uid:
                firebaseUser.uid,

            name:
                String(name || "").trim(),

            email:
                normalizedEmail,

            role:
                normalizedRole

        };

    }

    catch (error) {

        console.error(
            "Register Error Code:",
            error?.code
        );

        console.error(
            "Register Error:",
            error?.message
        );

        throw error;
    }
}


// =====================================================
// FIND USER PROFILE BY EMAIL
// =====================================================

async function findUserByEmail(email) {

    const normalizedEmail =
        normalizeEmail(email);


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


    if (
        snapshot.empty
    ) {

        return null;
    }


    const firstDocument =
        snapshot.docs[0];


    return {

        id:
            firstDocument.id,

        data:
            firstDocument.data()

    };
}


// =====================================================
// GET VALID ROLE FROM USER DATA
// =====================================================

function getValidRole(userData) {

    const role =
        normalizeRole(
            userData?.role
        );


    if (
        VALID_ROLES.includes(role)
    ) {

        return role;
    }


    return "";
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
            normalizeEmail(email);


        console.log(
            "===================================="
        );

        console.log(
            "LOGIN STARTED"
        );

        console.log(
            "Email:",
            normalizedEmail
        );

        console.log(
            "===================================="
        );


        // =================================================
        // FIREBASE AUTHENTICATION
        // =================================================

        const result =
            await signInWithEmailAndPassword(
                auth,
                normalizedEmail,
                password
            );


        const firebaseUser =
            result.user;


        const uid =
            firebaseUser.uid;


        console.log(
            "===================================="
        );

        console.log(
            "AUTHENTICATION SUCCESS"
        );

        console.log(
            "Firebase UID:",
            uid
        );

        console.log(
            "Firebase Email:",
            firebaseUser.email
        );

        console.log(
            "===================================="
        );


        // =================================================
        // FIRST TRY users/{uid}
        // =================================================

        const userRef =
            doc(
                db,
                "users",
                uid
            );


        let userDoc =
            await getDoc(
                userRef
            );


        let userData =
            null;


        if (
            userDoc.exists()
        ) {

            userData =
                userDoc.data();

            console.log(
                "Found users/{uid} document."
            );

        }


        // =================================================
        // SEARCH BY EMAIL IF ROLE IS INVALID
        // =================================================

        let role =
            getValidRole(
                userData
            );


        if (
            !role
        ) {

            console.log(
                "UID document does not contain a valid role."
            );

            console.log(
                "Searching users collection by email..."
            );


            const emailUser =
                await findUserByEmail(
                    normalizedEmail
                );


            if (
                emailUser
            ) {

                userData =
                    emailUser.data;


                role =
                    getValidRole(
                        userData
                    );


                if (
                    role
                ) {

                    // =================================================
                    // REPAIR users/{AUTH UID}
                    // =================================================

                    await setDoc(

                        userRef,

                        {

                            uid:
                                uid,

                            name:
                                userData.name ||
                                firebaseUser.displayName ||
                                "",

                            email:
                                normalizedEmail,

                            role:
                                role,

                            repairedAt:
                                serverTimestamp()

                        },

                        {
                            merge: true
                        }
                    );


                    console.log(
                        "users/{AuthUID} document repaired."
                    );
                }
            }
        }


        // =================================================
        // INVALID ROLE
        // =================================================

        if (
            !VALID_ROLES.includes(role)
        ) {

            await signOut(auth);


            const roleError =
                new Error(
                    `Invalid user role: "${userData?.role}"`
                );


            roleError.code =
                "invalid-user-role";


            throw roleError;
        }


        // =================================================
        // LOGIN SUCCESS
        // =================================================

        console.log(
            "===================================="
        );

        console.log(
            "LOGIN COMPLETELY SUCCESSFUL"
        );

        console.log(
            "UID:",
            uid
        );

        console.log(
            "Name:",
            userData?.name || ""
        );

        console.log(
            "Email:",
            userData?.email ||
            firebaseUser.email ||
            ""
        );

        console.log(
            "Role:",
            role
        );

        console.log(
            "===================================="
        );


        return {

            uid:
                uid,

            name:
                userData?.name ||
                firebaseUser.displayName ||
                "",

            email:
                userData?.email ||
                firebaseUser.email ||
                "",

            role:
                role

        };

    }

    catch (error) {

        console.error(
            "===================================="
        );

        console.error(
            "LOGIN FAILED"
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
// SAFE ACCOUNT-LINKING BEHAVIOR
//
// Existing password account:
//     Email + Password
//             +
//          Google
//
// becomes one Firebase account.
//
// Google NEVER changes the existing password.
//
// If Firebase says the email already belongs to a
// password account, Login.jsx can retry using the
// existing password and this function can link Google.
// =====================================================

export async function loginWithGoogle(
    existingEmail = "",
    existingPassword = ""
) {

    try {

        console.log(
            "===================================="
        );

        console.log(
            "GOOGLE LOGIN STARTED"
        );

        console.log(
            "===================================="
        );


        let result;


        try {

            // =================================================
            // NORMAL GOOGLE LOGIN
            // =================================================

            result =
                await signInWithPopup(
                    auth,
                    googleProvider
                );

        }

        catch (googleError) {

            console.error(
                "Google popup authentication failed:",
                googleError?.code
            );


            // =================================================
            // EMAIL ALREADY EXISTS WITH ANOTHER PROVIDER
            // =================================================

            if (
                googleError?.code !==
                "auth/account-exists-with-different-credential"
            ) {

                throw googleError;
            }


            // =================================================
            // GET GOOGLE CREDENTIAL FROM ERROR
            // =================================================

            const googleCredential =
                GoogleAuthProvider
                    .credentialFromError(
                        googleError
                    );


            if (
                !googleCredential
            ) {

                const credentialError =
                    new Error(
                        "Unable to retrieve the Google credential. Please try again."
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


            // =================================================
            // WE REQUIRE THE EXISTING PASSWORD TO LINK
            //
            // IMPORTANT:
            // We NEVER know or retrieve the old password.
            //
            // The user must enter their own existing password.
            // =================================================

            if (
                !existingPassword
            ) {

                const passwordRequiredError =
                    new Error(
                        "This email already has a password account. Enter your existing password and click Google again to safely link Google to that account."
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

            const existingResult =
                await signInWithEmailAndPassword(
                    auth,
                    googleEmail,
                    existingPassword
                );


            const existingUser =
                existingResult.user;


            // =================================================
            // CHECK WHETHER GOOGLE IS ALREADY LINKED
            // =================================================

            const googleAlreadyLinked =
                existingUser.providerData.some(
                    (provider) =>
                        provider.provider ===
                        "google.com"
                );


            if (
                !googleAlreadyLinked
            ) {

                // =================================================
                // LINK GOOGLE TO EXISTING PASSWORD ACCOUNT
                // =================================================

                await linkWithCredential(
                    existingUser,
                    googleCredential
                );

                console.log(
                    "Google provider linked to existing password account."
                );

            }


            // =================================================
            // LOAD FIRESTORE PROFILE
            // =================================================

            const uid =
                existingUser.uid;


            const userRef =
                doc(
                    db,
                    "users",
                    uid
                );


            let userDoc =
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
            // FALLBACK: SEARCH BY EMAIL
            // =================================================

            if (
                !role
            ) {

                const emailUser =
                    await findUserByEmail(
                        googleEmail
                    );


                if (
                    emailUser
                ) {

                    userData =
                        emailUser.data;


                    role =
                        getValidRole(
                            userData
                        );


                    if (
                        role
                    ) {

                        await setDoc(

                            userRef,

                            {

                                uid:
                                    uid,

                                name:
                                    userData.name ||
                                    existingUser.displayName ||
                                    "",

                                email:
                                    googleEmail,

                                role:
                                    role,

                                repairedAt:
                                    serverTimestamp()

                            },

                            {
                                merge: true
                            }
                        );
                    }
                }
            }


            // =================================================
            // INVALID ROLE
            // =================================================

            if (
                !VALID_ROLES.includes(role)
            ) {

                await signOut(auth);


                const roleError =
                    new Error(
                        `Invalid user role: "${userData?.role}"`
                    );


                roleError.code =
                    "invalid-user-role";


                throw roleError;
            }


            return {

                uid:
                    uid,

                name:
                    userData?.name ||
                    existingUser.displayName ||
                    "",

                email:
                    userData?.email ||
                    googleEmail,

                role:
                    role,

                linkedGoogle:
                    true

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
            "Google authentication successful."
        );

        console.log(
            "Google UID:",
            uid
        );

        console.log(
            "Google Email:",
            normalizedEmail
        );


        // =================================================
        // CHECK users/{uid}
        // =================================================

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


        if (
            userDoc.exists()
        ) {

            const userData =
                userDoc.data();


            const role =
                getValidRole(
                    userData
                );


            if (
                !VALID_ROLES.includes(role)
            ) {

                await signOut(auth);


                const roleError =
                    new Error(
                        `Invalid user role: "${userData?.role}"`
                    );


                roleError.code =
                    "invalid-user-role";


                throw roleError;
            }


            return {

                uid:
                    uid,

                name:
                    userData.name ||
                    firebaseUser.displayName ||
                    "",

                email:
                    userData.email ||
                    normalizedEmail,

                role:
                    role

            };
        }


        // =================================================
        // SEARCH BY EMAIL
        // =================================================

        const emailUser =
            await findUserByEmail(
                normalizedEmail
            );


        if (
            emailUser
        ) {

            const existingData =
                emailUser.data;


            const existingRole =
                getValidRole(
                    existingData
                );


            if (
                !VALID_ROLES.includes(
                    existingRole
                )
            ) {

                await signOut(auth);


                const roleError =
                    new Error(
                        `Invalid user role: "${existingData?.role}"`
                    );


                roleError.code =
                    "invalid-user-role";


                throw roleError;
            }


            // =================================================
            // REPAIR UID DOCUMENT
            // =================================================

            await setDoc(

                userRef,

                {

                    uid:
                        uid,

                    name:
                        existingData.name ||
                        firebaseUser.displayName ||
                        "",

                    email:
                        normalizedEmail,

                    role:
                        existingRole,

                    provider:
                        "google",

                    repairedAt:
                        serverTimestamp()

                },

                {
                    merge: true
                }
            );


            return {

                uid:
                    uid,

                name:
                    existingData.name ||
                    firebaseUser.displayName ||
                    "",

                email:
                    existingData.email ||
                    normalizedEmail,

                role:
                    existingRole

            };
        }


        // =================================================
        // NEW GOOGLE USER
        // =================================================
        //
        // New Google accounts become students.
        //
        // Admin is NEVER automatically assigned.
        // =================================================

        const newUser = {

            uid:
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

            uid:
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
// FORGOT PASSWORD
// =====================================================

export async function resetPassword(
    email
) {

    try {

        const normalizedEmail =
            normalizeEmail(email);


        if (
            !normalizedEmail
        ) {

            const error =
                new Error(
                    "Please enter your email address."
                );

            error.code =
                "invalid-email";

            throw error;
        }


        await sendPasswordResetEmail(
            auth,
            normalizedEmail
        );


        console.log(
            "Password reset email sent:",
            normalizedEmail
        );


        return true;

    }

    catch (error) {

        console.error(
            "Password Reset Error Code:",
            error?.code
        );

        console.error(
            "Password Reset Error:",
            error?.message
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


    if (
        snapshot.empty
    ) {

        console.log(
            `No ${label} documents found.`
        );

        return;
    }


    console.log(
        `Found ${snapshot.size} ${label} document(s).`
    );


    for (
        const documentSnapshot
        of snapshot.docs
    ) {

        console.log(
            `Deleting ${label}: ${documentSnapshot.ref.path}`
        );


        await deleteDoc(
            documentSnapshot.ref
        );
    }


    console.log(
        `Deleted ${snapshot.size} ${label} document(s).`
    );
}


// =====================================================
// DELETE USER ACCOUNT
// =====================================================

export async function deleteAccount() {

    try {

        const firebaseUser =
            auth.currentUser;


        if (
            !firebaseUser
        ) {

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


        if (
            !userDoc.exists()
        ) {

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


        // Admin cannot use this function.

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

        if (
            role === "student"
        ) {

            const studentProfileRef =
                doc(
                    db,
                    "studentProfiles",
                    uid
                );


            const studentProfileDoc =
                await getDoc(
                    studentProfileRef
                );


            if (
                studentProfileDoc.exists()
            ) {

                await deleteDoc(
                    studentProfileRef
                );
            }


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

        if (
            role === "company"
        ) {

            const companyRef =
                doc(
                    db,
                    "companies",
                    uid
                );


            const companyDoc =
                await getDoc(
                    companyRef
                );


            if (
                companyDoc.exists()
            ) {

                await deleteDoc(
                    companyRef
                );
            }


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
        // DELETE USERS DOCUMENT
        // =================================================

        await deleteDoc(
            userRef
        );


        // =================================================
        // DELETE AUTH ACCOUNT
        // =================================================

        await deleteUser(
            firebaseUser
        );


        console.log(
            "Account deletion completed."
        );


        return true;

    }

    catch (error) {

        console.error(
            "Delete Account Error Code:",
            error?.code
        );

        console.error(
            "Delete Account Error:",
            error?.message
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