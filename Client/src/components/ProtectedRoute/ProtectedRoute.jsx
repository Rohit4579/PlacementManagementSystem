import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

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

    const location = useLocation();


    // =================================================
    // FIREBASE AUTH INITIALIZATION
    // =================================================

    if (loading) {

        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "inherit"
                }}
            >
                <h2>
                    Loading...
                </h2>
            </div>
        );

    }


    // =================================================
    // USER NOT LOGGED IN
    // =================================================

    if (!user) {

        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: location.pathname
                }}
            />
        );

    }


    // =================================================
    // NORMALIZE ROLE CONFIGURATION
    // =================================================

    let roles = [];

    if (role) {
        roles.push(
            String(role).toLowerCase()
        );
    }

    if (Array.isArray(allowedRoles)) {

        roles = [
            ...roles,
            ...allowedRoles.map(
                item =>
                    String(item).toLowerCase()
            )
        ];

    }


    // Remove duplicates

    roles = [
        ...new Set(roles)
    ];


    // =================================================
    // USER ROLE
    // =================================================

    const userRole =
        String(user.role || "")
            .toLowerCase();


    // =================================================
    // ROLE CHECK
    // =================================================

    if (
        roles.length > 0 &&
        !roles.includes(userRole)
    ) {

        /*
         * IMPORTANT:
         *
         * Do NOT redirect here to another dashboard.
         *
         * Example of the old problem:
         *
         * /dashboard
         *      ↓
         * ProtectedRoute
         *      ↓
         * admin
         *      ↓
         * /admin/dashboard
         *      ↓
         * another redirect
         *      ↓
         * /dashboard
         *      ↓
         * LOOP
         *
         */

        return (
            <Navigate
                to="/"
                replace
            />
        );

    }


    // =================================================
    // AUTHORIZED
    // =================================================

    return children;

}


export default ProtectedRoute;