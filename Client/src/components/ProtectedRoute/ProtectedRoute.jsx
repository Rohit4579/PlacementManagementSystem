// src/components/ProtectedRoute/ProtectedRoute.jsx

import {
    Navigate,
    useLocation
} from "react-router-dom";

import {
    useAuth
} from "../../context/AuthContext";


// =====================================================
// PROTECTED ROUTE
// =====================================================

function ProtectedRoute({
    children,
    role,
    allowedRoles
}) {

    const {
        user,
        loading
    } = useAuth();

    const location =
        useLocation();


    // =====================================================
    // AUTH CONTEXT LOADING
    // =====================================================

    if (loading) {

        return (

            <div
                style={{
                    minHeight: "100vh",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f8fafc",
                    fontFamily: "inherit"
                }}
            >

                <div
                    style={{
                        textAlign: "center"
                    }}
                >

                    <div
                        style={{
                            width: "42px",
                            height: "42px",
                            margin: "0 auto 16px",
                            border: "4px solid #e2e8f0",
                            borderTopColor: "#2563eb",
                            borderRadius: "50%",
                            animation:
                                "protectedRouteSpin 0.8s linear infinite"
                        }}
                    />

                    <h2
                        style={{
                            margin: 0,
                            fontSize: "18px",
                            fontWeight: 600,
                            color: "#334155"
                        }}
                    >
                        Loading...
                    </h2>

                </div>


                <style>
                    {`
                        @keyframes protectedRouteSpin {

                            from {
                                transform: rotate(0deg);
                            }

                            to {
                                transform: rotate(360deg);
                            }

                        }
                    `}
                </style>

            </div>

        );

    }


    // =====================================================
    // NOT LOGGED IN
    // =====================================================

    if (!user) {

        return (

            <Navigate
                to="/login"
                replace
                state={{
                    from:
                        location.pathname +
                        location.search
                }}
            />

        );

    }


    // =====================================================
    // BUILD ALLOWED ROLES
    // =====================================================

    let roles = [];


    // Single role

    if (
        role !== undefined &&
        role !== null &&
        String(role).trim() !== ""
    ) {

        roles.push(
            String(role)
                .trim()
                .toLowerCase()
        );

    }


    // Multiple roles

    if (
        Array.isArray(allowedRoles)
    ) {

        roles = [
            ...roles,
            ...allowedRoles
                .filter(
                    item =>
                        item !== undefined &&
                        item !== null &&
                        String(item).trim() !== ""
                )
                .map(
                    item =>
                        String(item)
                            .trim()
                            .toLowerCase()
                )
        ];

    }


    // Remove duplicates

    roles = [
        ...new Set(roles)
    ];


    // =====================================================
    // USER ROLE
    // =====================================================

    const userRole =
        String(
            user.role || ""
        )
            .trim()
            .toLowerCase();


    // =====================================================
    // AUTHENTICATED ROUTE WITHOUT ROLE RESTRICTION
    // =====================================================

    if (roles.length === 0) {

        return children;

    }


    // =====================================================
    // INVALID USER ROLE
    // =====================================================

    if (!userRole) {

        return (

            <Navigate
                to="/"
                replace
            />

        );

    }


    // =====================================================
    // ROLE CHECK
    // =====================================================

    if (
        !roles.includes(userRole)
    ) {

        console.warn(
            "Unauthorized route access:",
            {
                userRole,
                requiredRoles: roles,
                pathname: location.pathname
            }
        );


        return (

            <Navigate
                to="/"
                replace
            />

        );

    }


    // =====================================================
    // AUTHORIZED
    // =====================================================

    return children;

}


export default ProtectedRoute;