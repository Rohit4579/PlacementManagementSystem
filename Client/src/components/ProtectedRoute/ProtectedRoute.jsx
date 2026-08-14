import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// =====================================================
// PROTECTED ROUTE
// =====================================================
//
// Usage:
//
// <ProtectedRoute>
//     <Dashboard />
// </ProtectedRoute>
//
// OR:
//
// <ProtectedRoute role="student">
//     <StudentDashboard />
// </ProtectedRoute>
//
// OR:
//
// <ProtectedRoute allowedRoles={["student", "company"]}>
//     <SomePage />
// </ProtectedRoute>
//
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

    const location = useLocation();


    // =====================================================
    // AUTHENTICATION INITIALIZATION
    // =====================================================
    //
    // Firebase must finish restoring the current session
    // before we decide whether the user is logged in.
    //
    // This prevents:
    //
    // Firebase still loading
    //        ↓
    // user === null
    //        ↓
    // redirect to login
    //        ↓
    // session loads
    //
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
                            animation: "protectedRouteSpin 0.8s linear infinite"
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
    // USER NOT AUTHENTICATED
    // =====================================================

    if (!user) {

        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: location.pathname + location.search
                }}
            />
        );

    }


    // =====================================================
    // BUILD ALLOWED ROLE LIST
    // =====================================================

    let roles = [];


    // =====================================================
    // SINGLE ROLE
    // =====================================================

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


    // =====================================================
    // MULTIPLE ROLES
    // =====================================================

    if (
        Array.isArray(allowedRoles)
    ) {

        const normalizedAllowedRoles =
            allowedRoles
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
                );

        roles = [
            ...roles,
            ...normalizedAllowedRoles
        ];

    }


    // =====================================================
    // REMOVE DUPLICATE ROLES
    // =====================================================

    roles = [
        ...new Set(roles)
    ];


    // =====================================================
    // GET USER ROLE
    // =====================================================

    const userRole =
        String(user?.role || "")
            .trim()
            .toLowerCase();


    // =====================================================
    // NO ROLE RESTRICTION
    // =====================================================
    //
    // If neither role nor allowedRoles was supplied,
    // the route only requires authentication.
    //
    // Example:
    //
    // <ProtectedRoute>
    //     <Profile />
    // </ProtectedRoute>
    //
    // Any logged-in user can access it.
    //
    // =====================================================

    if (roles.length === 0) {

        return children;

    }


    // =====================================================
    // USER HAS NO VALID ROLE
    // =====================================================

    if (!userRole) {

        console.error(
            "ProtectedRoute: authenticated user has no role.",
            {
                uid: user?.uid,
                email: user?.email
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
    // ROLE AUTHORIZATION CHECK
    // =====================================================

    const hasPermission =
        roles.includes(userRole);


    // =====================================================
    // USER DOES NOT HAVE REQUIRED ROLE
    // =====================================================
    //
    // IMPORTANT:
    //
    // Do NOT redirect this user to another role dashboard.
    //
    // For example:
    //
    // Student tries:
    // /admin/dashboard
    //
    // We simply send the student to "/".
    //
    // This prevents:
    //
    // /dashboard
    //     ↓
    // /admin/dashboard
    //     ↓
    // /dashboard
    //     ↓
    // /admin/dashboard
    //
    // redirect loops.
    //
    // =====================================================

    if (!hasPermission) {

        console.warn(
            "ProtectedRoute: unauthorized route access.",
            {
                uid: user?.uid,
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