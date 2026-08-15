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

const googleProvider =
    new GoogleAuthProvider();

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
// VALID ROLE
// =====================================================

function getValidRole(userData) {

    const role =
        normalizeRole(
            userData?.role
        );

    return VALID_ROLES.includes(role)
        ? role
        : "";
}


// =====================================================
// FIND USER BY EMAIL
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
// GET AUTHENTICATED USER PROFILE
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
    // NORMAL UID PROFILE
    // =================================================

    if (role) {

        return {

            uid,

            name:
                userData?.name ||
                firebaseUser.displayName ||
                "",

            email:
                normalizeEmail(
                    userData?.email ||
                    email
                ),

            role
        };
    }


    // =================================================
    // FALLBACK BY EMAIL
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

                await setDoc(

                    userRef,

                    {

                        uid,

                        name:
                            emailData?.name ||
                            firebaseUser.displayName ||
                            "",

                        email:
                            normalizeEmail(
                                emailData?.email ||
                                email
                            ),

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
                        normalizeEmail(
                            emailData?.email ||
                            email
                        ),

                    role

                };
            }
        }
    }


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
// LOGIN EMAIL + PASSWORD
// =====================================================

export async function loginUser(
    email,
    password
) {

    const normalizedEmail =
        normalizeEmail(email);


    try {

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


        if (!profile) {

            await signOut(
                auth
            );


            const profileError =
                new Error(
                    "Your authentication account exists, but your user profile could not be found."
                );


            profileError.code =
                "user-profile-not-found";


            throw profileError;
        }


        return profile;

    }
    catch (error) {

        console.error(
            "Email login failed:",
            error
        );

        throw error;
    }
}


// =====================================================
// GOOGLE LOGIN
// =====================================================

export async function loginWithGoogle(
    existingEmail = "",
    existingPassword = ""
) {

    let googleResult = null;


    try {

        console.log(
            "Google login started."
        );


        // =================================================
        // STEP 1
        // NORMAL GOOGLE POPUP
        // =================================================

        try {

            googleResult =
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
            // GOOGLE EMAIL ALREADY EXISTS WITH PASSWORD
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
                        "Please enter your Google account email."
                    );

                emailError.code =
                    "auth/invalid-email";

                throw emailError;
            }


            // =================================================
            // PASSWORD REQUIRED
            // =================================================

            if (!existingPassword) {

                const passwordRequiredError =
                    new Error(
                        "This email already has a password account."
                    );


                passwordRequiredError.code =
                    "auth/password-required-for-linking";


                passwordRequiredError.email =
                    googleEmail;


                /*
                 * Store credential temporarily on the error
                 * so debugging can identify the flow.
                 *
                 * Do not put credential into UI.
                 */

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
            // CHECK GOOGLE LINK
            // =================================================

            const googleAlreadyLinked =
                existingUser.providerData.some(
                    provider =>
                        provider.provider ===
                        "google.com"
                );


            // =================================================
            // LINK GOOGLE
            // =================================================

            if (!googleAlreadyLinked) {

                try {

                    await linkWithCredential(
                        existingUser,
                        googleCredential
                    );

                    console.log(
                        "Google successfully linked to existing account."
                    );

                }
                catch (linkError) {

                    console.error(
                        "Google linking failed:",
                        linkError
                    );


                    /*
                     * If Google was already linked between
                     * the popup attempt and this point, simply
                     * continue.
                     */

                    if (
                        linkError?.code !==
                        "auth/provider-already-linked"
                    ) {

                        throw linkError;
                    }
                }
            }


            // =================================================
            // LOAD FIRESTORE PROFILE
            // =================================================

            const profile =
                await getAuthenticatedUserProfile(
                    existingUser
                );


            if (!profile) {

                await signOut(
                    auth
                );


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
        // STEP 2
        // NORMAL GOOGLE LOGIN SUCCESS
        // =================================================

        const firebaseUser =
            googleResult.user;


        console.log(
            "Google authentication successful:",
            firebaseUser.email
        );


        // =================================================
        // STEP 3
        // CHECK EXISTING PROFILE
        // =================================================

        const existingProfile =
            await getAuthenticatedUserProfile(
                firebaseUser
            );


        if (existingProfile) {

            return existingProfile;
        }


        // =================================================
        // STEP 4
        // NEW GOOGLE USER
        // =================================================

        const uid =
            firebaseUser.uid;


        const normalizedEmail =
            normalizeEmail(
                firebaseUser.email
            );


        if (!normalizedEmail) {

            await signOut(
                auth
            );


            const emailError =
                new Error(
                    "Google did not provide an email address."
                );


            emailError.code =
                "auth/invalid-email";


            throw emailError;
        }


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

            /*
             * Google-only registrations are students.
             * Company/admin accounts should continue to
             * use their existing account/profile.
             */

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


        /*
         * Important cleanup:
         *
         * If authentication partially succeeded but the
         * profile process failed, don't leave the user in
         * a broken authenticated state.
         */

        if (
            error?.code ===
            "user-profile-not-found"
        ) {

            try {
                await signOut(auth);
            }
            catch (signOutError) {

                console.error(
                    "Google cleanup failed:",
                    signOutError
                );
            }
        }


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
// DELETE ACCOUNT
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

        if (
            role === "student"
        ) {

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

        if (
            role === "company"
        ) {

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
        // USERS
        // =================================================

        await deleteDoc(
            userRef
        );


        // =================================================
        // FIREBASE AUTH
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