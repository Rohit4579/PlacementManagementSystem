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


const AuthContext =
    createContext();


export function AuthProvider({ children }) {

    const [user, setUser] =
        useState(null);

    const [loading, setLoading] =
        useState(true);


    useEffect(() => {

        const unsubscribe =
            onAuthStateChanged(

                auth,

                async (currentUser) => {

                    try {

                        if (!currentUser) {

                            setUser(null);

                            setLoading(false);

                            return;

                        }


                        console.log(
                            "Authenticated UID:",
                            currentUser.uid
                        );


                        const userRef =
                            doc(
                                db,
                                "users",
                                currentUser.uid
                            );


                        const userSnap =
                            await getDoc(userRef);


                        if (userSnap.exists()) {

                            const data =
                                userSnap.data();


                            setUser({

                                uid:
                                    currentUser.uid,

                                email:
                                    currentUser.email,

                                ...data

                            });

                        }

                        else {

                            setUser({

                                uid:
                                    currentUser.uid,

                                email:
                                    currentUser.email,

                                role:
                                    null

                            });

                        }

                    }

                    catch (error) {

                        console.error(
                            "Auth Context Error:",
                            error
                        );

                        setUser(null);

                    }

                    finally {

                        setLoading(false);

                    }

                }

            );


        return unsubscribe;

    }, []);


    const logout = async () => {

        try {

            await signOut(auth);

            setUser(null);

            window.location.href =
                "/login";

        }

        catch (error) {

            console.error(
                "Logout Error:",
                error
            );

        }

    };


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


export function useAuth() {

    return useContext(AuthContext);

}