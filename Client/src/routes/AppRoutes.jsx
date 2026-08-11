import {
    Routes,
    Route
} from "react-router-dom";

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
// Admin / TPO Pages
// ========================================
// IMPORTANT:
// The actual folder name is "Admin" with capital A.
// Linux/Vercel is case-sensitive.

import AdminDashboard from "../pages/Admin/AdminDashboard";
import ManageStudents from "../pages/Admin/ManageStudents";
import ManageCompanies from "../pages/Admin/ManageCompanies";
import AdminManageJobs from "../pages/Admin/ManageJobs";
import AdminApplications from "../pages/Admin/AdminApplications";
import PlacementReports from "../pages/Admin/PlacementReports";
import Placements from "../pages/Admin/Placements";

// ========================================
// APP ROUTES
// ========================================

function AppRoutes() {

    return (

        <Routes>

            {/* ==================================
                PUBLIC ROUTES
            ================================== */}

            <Route
                path="/"
                element={
                    <Landing />
                }
            />

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


            {/* ==================================
                STUDENT ROUTES
            ================================== */}

            <Route
                path="/student/dashboard"
                element={

                    <ProtectedRoute
                        allowedRoles={["student"]}
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
                        allowedRoles={["student"]}
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
                        allowedRoles={["student"]}
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
                        allowedRoles={["student"]}
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
                        allowedRoles={["student"]}
                    >

                        <Layout>
                            <AppliedJobs />
                        </Layout>

                    </ProtectedRoute>

                }
            />


            {/* ==================================
                COMPANY ROUTES
            ================================== */}

            <Route
                path="/company/dashboard"
                element={

                    <ProtectedRoute
                        allowedRoles={["company"]}
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
                        allowedRoles={["company"]}
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
                        allowedRoles={["company"]}
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
                        allowedRoles={["company"]}
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
                        allowedRoles={["company"]}
                    >

                        <Layout>
                            <Applicants />
                        </Layout>

                    </ProtectedRoute>

                }
            />


            {/* ==================================
                ADMIN / TPO ROUTES
            ================================== */}

            {/* Admin Dashboard */}

            <Route
                path="/admin/dashboard"
                element={

                    <ProtectedRoute
                        allowedRoles={["admin"]}
                    >

                        <Layout>
                            <AdminDashboard />
                        </Layout>

                    </ProtectedRoute>

                }
            />


            {/* Manage Students */}

            <Route
                path="/admin/students"
                element={

                    <ProtectedRoute
                        allowedRoles={["admin"]}
                    >

                        <Layout>
                            <ManageStudents />
                        </Layout>

                    </ProtectedRoute>

                }
            />


            {/* Manage Companies */}

            <Route
                path="/admin/companies"
                element={

                    <ProtectedRoute
                        allowedRoles={["admin"]}
                    >

                        <Layout>
                            <ManageCompanies />
                        </Layout>

                    </ProtectedRoute>

                }
            />


            {/* Manage Jobs */}

            <Route
                path="/admin/jobs"
                element={

                    <ProtectedRoute
                        allowedRoles={["admin"]}
                    >

                        <Layout>
                            <AdminManageJobs />
                        </Layout>

                    </ProtectedRoute>

                }
            />


            {/* Applications */}

            <Route
                path="/admin/applications"
                element={

                    <ProtectedRoute
                        allowedRoles={["admin"]}
                    >

                        <Layout>
                            <AdminApplications />
                        </Layout>

                    </ProtectedRoute>

                }
            />


            {/* ==================================
                PLACEMENTS
            ================================== */}

            <Route
                path="/admin/placements"
                element={

                    <ProtectedRoute
                        allowedRoles={["admin"]}
                    >

                        <Layout>
                            <Placements />
                        </Layout>

                    </ProtectedRoute>

                }
            />


            {/* ==================================
                PLACEMENT REPORTS
            ================================== */}

            <Route
                path="/admin/reports"
                element={

                    <ProtectedRoute
                        allowedRoles={["admin"]}
                    >

                        <Layout>
                            <PlacementReports />
                        </Layout>

                    </ProtectedRoute>

                }
            />


            {/* ==================================
                FALLBACK
            ================================== */}

            <Route
                path="*"
                element={
                    <Landing />
                }
            />

        </Routes>

    );
}

export default AppRoutes;