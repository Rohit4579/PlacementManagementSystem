// src/routes/AppRoutes.jsx

import {
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import {
    useAuth
} from "../context/AuthContext";


// ========================================
// Public Pages
// ========================================

import Landing from "../pages/Landing/Landing";
import Login from "../pages/Authentication/Login";
import Register from "../pages/Authentication/Register";


// ========================================
// Layout
// ========================================

import Layout from "../components/Layout/Layout";


// ========================================
// Protected Route
// ========================================

import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";


// ========================================
// Student Pages
// ========================================

import StudentDashboard from "../pages/Student/StudentDashboard";
import StudentProfile from "../pages/Student/StudentProfile";
import ResumeUpload from "../pages/Student/ResumeUpload";
import AvailableJobs from "../pages/Student/AvailableJobs";
import AppliedJobs from "../pages/Student/AppliedJobs";


// ========================================
// Company Pages
// ========================================

import CompanyDashboard from "../pages/Company/CompanyDashboard";
import CompanyProfile from "../pages/Company/CompanyProfile";
import AddJob from "../pages/Company/AddJob";
import ManageJobs from "../pages/Company/ManageJobs";
import Applicants from "../pages/Company/Applicants";


// ========================================
// Admin Pages
// ========================================

import AdminDashboard from "../pages/Admin/AdminDashboard";
import ManageStudents from "../pages/Admin/ManageStudents";
import ManageCompanies from "../pages/Admin/ManageCompanies";
import AdminManageJobs from "../pages/Admin/ManageJobs";
import AdminApplications from "../pages/Admin/AdminApplications";
import PlacementReports from "../pages/Admin/PlacementReports";
import Placements from "../pages/Admin/Placements";


// =====================================================
// ROLE NAVIGATION
// =====================================================

function getDashboardPath(role) {

    const normalizedRole =
        String(
            role || ""
        )
            .trim()
            .toLowerCase();


    if (
        normalizedRole ===
        "student"
    ) {

        return "/student/dashboard";

    }


    if (
        normalizedRole ===
        "company"
    ) {

        return "/company/dashboard";

    }


    if (
        normalizedRole ===
        "admin"
    ) {

        return "/admin/dashboard";

    }


    return null;

}


// =====================================================
// AUTH LOADING SCREEN
// =====================================================

function AuthLoadingScreen() {

    return (

        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f8fafc",
                padding: "24px"
            }}
        >

            <div
                style={{
                    width: "100%",
                    maxWidth: "420px",
                    padding: "40px 30px",
                    background: "#ffffff",
                    borderRadius: "18px",
                    textAlign: "center",
                    boxShadow:
                        "0 10px 40px rgba(15, 23, 42, 0.08)"
                }}
            >

                <div
                    style={{
                        width: "48px",
                        height: "48px",
                        margin: "0 auto 20px",
                        borderRadius: "50%",
                        border:
                            "4px solid #e2e8f0",
                        borderTopColor:
                            "#2563eb",
                        animation:
                            "authRouteSpin 0.8s linear infinite"
                    }}
                />

                <h2
                    style={{
                        margin: "0 0 8px",
                        color: "#0f172a",
                        fontSize: "20px"
                    }}
                >
                    PlacementPro
                </h2>

                <p
                    style={{
                        margin: 0,
                        color: "#64748b",
                        fontSize: "14px"
                    }}
                >
                    Checking your login session...
                </p>

            </div>


            <style>
                {`
                    @keyframes authRouteSpin {
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
// ROOT ROUTE
// =====================================================
//
// This controls:
//
// OPEN WEBSITE
//      ↓
// AuthContext
//      ↓
// Firebase user?
//      ↓
// role?
//      ↓
// correct dashboard
//
// =====================================================

function RootRedirect() {

    const {
        user,
        loading
    } = useAuth();


    // -----------------------------------------
    // AuthContext still loading
    // -----------------------------------------

    if (loading) {

        return (
            <AuthLoadingScreen />
        );

    }


    // -----------------------------------------
    // No Firebase session
    // -----------------------------------------

    if (!user) {

        return (
            <Landing />
        );

    }


    // -----------------------------------------
    // Firebase session exists
    // -----------------------------------------

    const dashboardPath =
        getDashboardPath(
            user.role
        );


    // -----------------------------------------
    // Valid role
    // -----------------------------------------

    if (dashboardPath) {

        return (

            <Navigate
                to={dashboardPath}
                replace
            />

        );

    }


    // -----------------------------------------
    // Firebase account exists but
    // Firestore role is missing/invalid
    // -----------------------------------------

    return (

        <Navigate
            to="/login"
            replace
            state={{
                roleError: true
            }}
        />

    );

}


// =====================================================
// APP ROUTES
// =====================================================

function AppRoutes() {

    return (

        <Routes>


            {/* ==========================================
                ROOT
            ========================================== */}

            <Route
                path="/"
                element={
                    <RootRedirect />
                }
            />


            {/* ==========================================
                PUBLIC ROUTES
            ========================================== */}

            <Route
                path="/login"
                element={
                    <Login />
                }
            />


            <Route
                path="/register"
                element={
                    <Register />
                }
            />


            {/* ==========================================
                STUDENT ROUTES
            ========================================== */}

            <Route
                path="/student/dashboard"
                element={

                    <ProtectedRoute
                        allowedRoles={[
                            "student"
                        ]}
                    >

                        <Layout>

                            <StudentDashboard />

                        </Layout>

                    </ProtectedRoute>

                }
            />


            <Route
                path="/student/profile"
                element={

                    <ProtectedRoute
                        allowedRoles={[
                            "student"
                        ]}
                    >

                        <Layout>

                            <StudentProfile />

                        </Layout>

                    </ProtectedRoute>

                }
            />


            <Route
                path="/student/resume"
                element={

                    <ProtectedRoute
                        allowedRoles={[
                            "student"
                        ]}
                    >

                        <Layout>

                            <ResumeUpload />

                        </Layout>

                    </ProtectedRoute>

                }
            />


            <Route
                path="/student/jobs"
                element={

                    <ProtectedRoute
                        allowedRoles={[
                            "student"
                        ]}
                    >

                        <Layout>

                            <AvailableJobs />

                        </Layout>

                    </ProtectedRoute>

                }
            />


            <Route
                path="/student/applied-jobs"
                element={

                    <ProtectedRoute
                        allowedRoles={[
                            "student"
                        ]}
                    >

                        <Layout>

                            <AppliedJobs />

                        </Layout>

                    </ProtectedRoute>

                }
            />


            {/* ==========================================
                COMPANY ROUTES
            ========================================== */}

            <Route
                path="/company/dashboard"
                element={

                    <ProtectedRoute
                        allowedRoles={[
                            "company"
                        ]}
                    >

                        <Layout>

                            <CompanyDashboard />

                        </Layout>

                    </ProtectedRoute>

                }
            />


            <Route
                path="/company/profile"
                element={

                    <ProtectedRoute
                        allowedRoles={[
                            "company"
                        ]}
                    >

                        <Layout>

                            <CompanyProfile />

                        </Layout>

                    </ProtectedRoute>

                }
            />


            <Route
                path="/company/add-job"
                element={

                    <ProtectedRoute
                        allowedRoles={[
                            "company"
                        ]}
                    >

                        <Layout>

                            <AddJob />

                        </Layout>

                    </ProtectedRoute>

                }
            />


            <Route
                path="/company/jobs"
                element={

                    <ProtectedRoute
                        allowedRoles={[
                            "company"
                        ]}
                    >

                        <Layout>

                            <ManageJobs />

                        </Layout>

                    </ProtectedRoute>

                }
            />


            <Route
                path="/company/applicants"
                element={

                    <ProtectedRoute
                        allowedRoles={[
                            "company"
                        ]}
                    >

                        <Layout>

                            <Applicants />

                        </Layout>

                    </ProtectedRoute>

                }
            />


            {/* ==========================================
                ADMIN ROUTES
            ========================================== */}

            <Route
                path="/admin/dashboard"
                element={

                    <ProtectedRoute
                        allowedRoles={[
                            "admin"
                        ]}
                    >

                        <Layout>

                            <AdminDashboard />

                        </Layout>

                    </ProtectedRoute>

                }
            />


            <Route
                path="/admin/students"
                element={

                    <ProtectedRoute
                        allowedRoles={[
                            "admin"
                        ]}
                    >

                        <Layout>

                            <ManageStudents />

                        </Layout>

                    </ProtectedRoute>

                }
            />


            <Route
                path="/admin/companies"
                element={

                    <ProtectedRoute
                        allowedRoles={[
                            "admin"
                        ]}
                    >

                        <Layout>

                            <ManageCompanies />

                        </Layout>

                    </ProtectedRoute>

                }
            />


            <Route
                path="/admin/jobs"
                element={

                    <ProtectedRoute
                        allowedRoles={[
                            "admin"
                        ]}
                    >

                        <Layout>

                            <AdminManageJobs />

                        </Layout>

                    </ProtectedRoute>

                }
            />


            <Route
                path="/admin/applications"
                element={

                    <ProtectedRoute
                        allowedRoles={[
                            "admin"
                        ]}
                    >

                        <Layout>

                            <AdminApplications />

                        </Layout>

                    </ProtectedRoute>

                }
            />


            <Route
                path="/admin/placements"
                element={

                    <ProtectedRoute
                        allowedRoles={[
                            "admin"
                        ]}
                    >

                        <Layout>

                            <Placements />

                        </Layout>

                    </ProtectedRoute>

                }
            />


            <Route
                path="/admin/reports"
                element={

                    <ProtectedRoute
                        allowedRoles={[
                            "admin"
                        ]}
                    >

                        <Layout>

                            <PlacementReports />

                        </Layout>

                    </ProtectedRoute>

                }
            />


            {/* ==========================================
                OLD /dashboard
            ========================================== */}

            <Route
                path="/dashboard"
                element={

                    <RootRedirect />

                }
            />


            {/* ==========================================
                FALLBACK
            ========================================== */}

            <Route
                path="*"
                element={

                    <RootRedirect />

                }
            />

        </Routes>

    );

}


export default AppRoutes;