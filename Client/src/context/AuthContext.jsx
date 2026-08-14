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

const AuthContext = createContext();


// =====================================================
// AUTH PROVIDER
// =====================================================

export function AuthProvider({ children }) {

    const [user, setUser] = useState(null);

    const [loading, setLoading] = useState(true);


    // =================================================
    // FIREBASE AUTH STATE
    // =================================================

    useEffect(() => {

        let mounted = true;


        const unsubscribe = onAuthStateChanged(

            auth,

            async (currentUser) => {

                try {

                    // =========================================
                    // USER LOGGED OUT
                    // =========================================

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


                    // =========================================
                    // GET FIRESTORE USER PROFILE
                    // =========================================

                    const userRef = doc(
                        db,
                        "users",
                        currentUser.uid
                    );


                    const userSnap = await getDoc(
                        userRef
                    );


                    // =========================================
                    // FIRESTORE PROFILE EXISTS
                    // =========================================

                    if (userSnap.exists()) {

                        const data =
                            userSnap.data();


                        // -------------------------------------
                        // NORMALIZE ROLE
                        // -------------------------------------

                        const normalizedRole =
                            data.role
                                ?.toString()
                                .trim()
                                .toLowerCase() || null;


                        if (mounted) {

                            setUser({

                                // Firebase Authentication data
                                uid:
                                    currentUser.uid,

                                email:
                                    currentUser.email ||
                                    data.email ||
                                    "",

                                // Firestore profile data
                                name:
                                    data.name || "",

                                role:
                                    normalizedRole,

                                // Keep any other Firestore
                                // profile fields available.
                                ...data,

                                // IMPORTANT:
                                // Firebase values are applied
                                // again after ...data so that
                                // Firestore cannot accidentally
                                // overwrite them.
                                uid:
                                    currentUser.uid,

                                email:
                                    currentUser.email ||
                                    data.email ||
                                    "",

                                role:
                                    normalizedRole

                            });

                        }

                    }


                    // =========================================
                    // AUTH EXISTS BUT FIRESTORE PROFILE
                    // DOES NOT EXIST
                    // =========================================

                    else {

                        console.warn(
                            "Firebase Authentication user exists, but Firestore profile was not found:",
                            currentUser.uid
                        );


                        /*
                         * IMPORTANT
                         *
                         * We intentionally DO NOT create a
                         * Firestore profile automatically.
                         *
                         * Therefore an Authentication account
                         * without a users/{uid} document does
                         * not receive a role automatically.
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
                        "Auth Context Error:",
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


        // ==============================================
        // CLEANUP
        // ==============================================

        return () => {

            mounted = false;

            unsubscribe();

        };

    }, []);


    // =================================================
    // LOGOUT
    // =================================================

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

        }

    };


    // =================================================
    // CONTEXT VALUE
    // =================================================

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

    return useContext(AuthContext);

}