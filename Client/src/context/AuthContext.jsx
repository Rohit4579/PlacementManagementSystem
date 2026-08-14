// src/context/AuthContext.jsx

import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import {
    onAuthStateChanged,
    signOut
} from "firebase/auth";

import {
    doc,
    getDoc
} from "firebase/firestore";

import {
    auth,
    db
} from "../firebase/firebaseConfig";


// =====================================================
// AUTH CONTEXT
// =====================================================

const AuthContext = createContext(null);


// =====================================================
// AUTH PROVIDER
// =====================================================

export function AuthProvider({ children }) {

    const [user, setUser] = useState(null);

    const [loading, setLoading] = useState(true);


    // =====================================================
    // LOAD FIREBASE AUTH SESSION
    // =====================================================

    useEffect(() => {

        let mounted = true;


        const unsubscribe = onAuthStateChanged(
            auth,
            async (currentUser) => {

                // -----------------------------------------
                // FIREBASE USER LOGGED OUT
                // -----------------------------------------

                if (!currentUser) {

                    if (mounted) {

                        setUser(null);

                        setLoading(false);

                    }

                    return;
                }


                console.log(
                    "Authenticated UID:",
                    currentUser.uid
                );


                try {

                    // -----------------------------------------
                    // GET FIRESTORE USER PROFILE
                    // -----------------------------------------

                    const userRef = doc(
                        db,
                        "users",
                        currentUser.uid
                    );


                    const userSnap = await getDoc(
                        userRef
                    );


                    // -----------------------------------------
                    // PROFILE EXISTS
                    // -----------------------------------------

                    if (userSnap.exists()) {

                        const data =
                            userSnap.data();


                        // -------------------------------------
                        // NORMALIZE ROLE
                        // -------------------------------------

                        const normalizedRole =
                            String(
                                data.role || ""
                            )
                                .trim()
                                .toLowerCase();


                        // -------------------------------------
                        // CREATE APPLICATION USER
                        // -------------------------------------

                        const authenticatedUser = {

                            // Firebase Authentication
                            uid:
                                currentUser.uid,

                            email:
                                currentUser.email ||
                                data.email ||
                                "",

                            // Firestore data
                            ...data,

                            // Keep Firebase values authoritative
                            uid:
                                currentUser.uid,

                            email:
                                currentUser.email ||
                                data.email ||
                                "",

                            name:
                                data.name ||
                                currentUser.displayName ||
                                "",

                            role:
                                normalizedRole || null

                        };


                        console.log(
                            "Authenticated user profile:",
                            authenticatedUser
                        );


                        if (mounted) {

                            setUser(
                                authenticatedUser
                            );

                        }

                    }


                    // -----------------------------------------
                    // PROFILE DOES NOT EXIST
                    // -----------------------------------------

                    else {

                        console.warn(
                            "Firebase user exists but users/{uid} profile does not exist:",
                            currentUser.uid
                        );


                        /*
                         * Do NOT automatically create a profile.
                         *
                         * Without a Firestore users/{uid}
                         * document, the application cannot
                         * determine whether this is a student,
                         * company, or admin.
                         */

                        if (mounted) {

                            setUser({

                                uid:
                                    currentUser.uid,

                                email:
                                    currentUser.email || "",

                                name:
                                    currentUser.displayName || "",

                                role:
                                    null

                            });

                        }

                    }

                }

                catch (error) {

                    console.error(
                        "AuthContext profile loading error:",
                        error
                    );


                    if (mounted) {

                        setUser(null);

                    }

                }

                finally {

                    if (mounted) {

                        setLoading(false);

                    }

                }

            }
        );


        // =================================================
        // CLEANUP
        // =================================================

        return () => {

            mounted = false;

            unsubscribe();

        };

    }, []);


    // =====================================================
    // LOGOUT
    // =====================================================

    const logout = async () => {

        try {

            await signOut(auth);

            setUser(null);

        }

        catch (error) {

            console.error(
                "Logout Error:",
                error
            );

            throw error;

        }

    };


    // =====================================================
    // CONTEXT VALUE
    // =====================================================

    return (

        <AuthContext.Provider
            value={{
                user,
                loading,
                logout
            }}
        >

            {children}

        </AuthContext.Provider>

    );

}


// =====================================================
// USE AUTH
// =====================================================

export function useAuth() {

    return useContext(
        AuthContext
    );

}