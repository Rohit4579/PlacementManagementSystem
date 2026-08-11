import { useEffect, useMemo, useState } from "react";

import {
    collection,
    getDocs
} from "firebase/firestore";

import {
    FaUsers,
    FaSearch,
    FaEnvelope,
    FaUniversity,
    FaGraduationCap,
    FaBriefcase,
    FaBuilding,
    FaCalendarAlt,
    FaSyncAlt,
    FaFileAlt
} from "react-icons/fa";

import { db } from "../../firebase/firebaseConfig";

import "./AdminApplications.css";


/* =========================================================
   ADMIN APPLICATIONS
   ---------------------------------------------------------
   Fetches ALL applicants from:
   1. applications
   2. studentProfiles

   This page does NOT:
   - fetch jobs
   - fetch placement statistics
   - update applications
   - delete applications
   - modify Firebase data
========================================================= */

function Applications() {

    /* =====================================================
       STATES
    ===================================================== */

    const [applications, setApplications] = useState([]);

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState("");

    const [search, setSearch] = useState("");

    const [statusFilter, setStatusFilter] = useState("all");


    /* =====================================================
       GET FIRST AVAILABLE VALUE
    ===================================================== */

    const getFirstValue = (
        profile,
        fields,
        fallback = "Not Available"
    ) => {

        if (!profile) {
            return fallback;
        }

        for (const field of fields) {

            const value = profile[field];

            if (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            ) {

                return value;

            }

        }

        return fallback;

    };


    /* =====================================================
       PROFILE PHOTO
    ===================================================== */

    const getProfilePhoto = (
        profile,
        application
    ) => {

        const photoFields = [

            "photoURL",
            "photoUrl",

            "profilePhoto",
            "profilePhotoURL",
            "profilePhotoUrl",

            "profileImage",
            "profileImageURL",
            "profileImageUrl",

            "photo",

            "image",
            "imageURL",
            "imageUrl",

            "avatar",
            "avatarUrl"

        ];


        /* -------------------------------------------------
           FIRST: STUDENT PROFILE
        ------------------------------------------------- */

        const profilePhoto = getFirstValue(
            profile,
            photoFields,
            ""
        );


        if (profilePhoto) {

            return String(
                profilePhoto
            ).trim();

        }


        /* -------------------------------------------------
           SECOND: APPLICATION
        ------------------------------------------------- */

        const applicationPhoto = getFirstValue(
            application,
            photoFields,
            ""
        );


        if (applicationPhoto) {

            return String(
                applicationPhoto
            ).trim();

        }


        return "";

    };


    /* =====================================================
       DATE VALUE
    ===================================================== */

    const getDateTime = (value) => {

        if (!value) {
            return 0;
        }

        try {

            if (
                value &&
                typeof value.toDate === "function"
            ) {

                return value
                    .toDate()
                    .getTime();

            }

            const date = new Date(value);

            if (isNaN(date.getTime())) {
                return 0;
            }

            return date.getTime();

        }
        catch {

            return 0;

        }

    };


    /* =====================================================
       FORMAT DATE
    ===================================================== */

    const formatDate = (value) => {

        if (!value) {
            return "Not Available";
        }

        try {

            if (
                value &&
                typeof value.toDate === "function"
            ) {

                return value
                    .toDate()
                    .toLocaleDateString(
                        "en-IN",
                        {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                        }
                    );

            }

            const date = new Date(value);

            if (isNaN(date.getTime())) {
                return "Not Available";
            }

            return date.toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );

        }
        catch {

            return "Not Available";

        }

    };


    /* =====================================================
       NORMALIZE STATUS
    ===================================================== */

    const getStatus = (application) => {

        const rawStatus =
            application?.status ||
            "pending";

        const status =
            String(rawStatus)
                .trim()
                .toLowerCase();


        if (
            status === "accepted" ||
            status === "selected"
        ) {

            return "accepted";

        }


        if (status === "rejected") {

            return "rejected";

        }


        if (status === "placed") {

            return "placed";

        }


        return "pending";

    };


    /* =====================================================
       STATUS LABEL
    ===================================================== */

    const getStatusLabel = (status) => {

        switch (status) {

            case "accepted":
                return "Selected";

            case "rejected":
                return "Rejected";

            case "placed":
                return "Placed";

            default:
                return "Pending";

        }

    };


    /* =====================================================
       LOAD ALL APPLICATIONS
    ===================================================== */

    useEffect(() => {

        fetchApplications();

    }, []);


    /* =====================================================
       FETCH APPLICATIONS
    ===================================================== */

    const fetchApplications = async () => {

        try {

            setError("");

            setLoading(true);


            /* =================================================
               1. FETCH ALL APPLICATIONS
            ================================================= */

            const applicationsSnapshot =
                await getDocs(
                    collection(
                        db,
                        "applications"
                    )
                );


            const applicationList =
                applicationsSnapshot.docs.map(
                    (document) => ({

                        id: document.id,

                        ...document.data()

                    })
                );


            /* =================================================
               2. FETCH ALL STUDENT PROFILES
            ================================================= */

            const profilesSnapshot =
                await getDocs(
                    collection(
                        db,
                        "studentProfiles"
                    )
                );


            const profilesById = {};

            const profilesByUid = {};


            profilesSnapshot.docs.forEach(
                (document) => {

                    const profile =
                        document.data();


                    /* -----------------------------------------
                       STORE USING DOCUMENT ID
                    ----------------------------------------- */

                    profilesById[
                        document.id
                    ] = {

                        id: document.id,

                        ...profile

                    };


                    /* -----------------------------------------
                       STORE USING UID
                    ----------------------------------------- */

                    if (profile.uid) {

                        profilesByUid[
                            profile.uid
                        ] = {

                            id: document.id,

                            ...profile

                        };

                    }

                }
            );


            /* =================================================
               3. FIND STUDENT PROFILE
            ================================================= */

            const findStudentProfile = (
                application
            ) => {

                const studentId =
                    application.studentId ||
                    application.uid ||
                    application.userId;


                if (!studentId) {
                    return null;
                }


                /* -----------------------------------------
                   FIRST: DOCUMENT ID
                ----------------------------------------- */

                if (
                    profilesById[
                        studentId
                    ]
                ) {

                    return profilesById[
                        studentId
                    ];

                }


                /* -----------------------------------------
                   SECOND: UID
                ----------------------------------------- */

                if (
                    profilesByUid[
                        studentId
                    ]
                ) {

                    return profilesByUid[
                        studentId
                    ];

                }


                return null;

            };


            /* =================================================
               4. MERGE APPLICATION + STUDENT PROFILE
            ================================================= */

            const mergedApplications =
                applicationList.map(
                    (application) => {

                        const profile =
                            findStudentProfile(
                                application
                            );


                        /* -------------------------------------
                           STUDENT NAME
                        ------------------------------------- */

                        const studentName =
                            getFirstValue(
                                profile,
                                [
                                    "studentName",
                                    "name",
                                    "fullName",
                                    "displayName"
                                ],
                                application.studentName ||
                                application.name ||
                                "Student"
                            );


                        /* -------------------------------------
                           EMAIL
                        ------------------------------------- */

                        const email =
                            getFirstValue(
                                profile,
                                [
                                    "email",
                                    "studentEmail",
                                    "emailAddress"
                                ],
                                application.studentEmail ||
                                application.email ||
                                "Not Available"
                            );


                        /* -------------------------------------
                           COLLEGE
                        ------------------------------------- */

                        const college =
                            getFirstValue(
                                profile,
                                [
                                    "college",
                                    "collegeName",
                                    "college_name",
                                    "institute",
                                    "instituteName",
                                    "university",
                                    "universityName",
                                    "institution",
                                    "institutionName"
                                ],
                                application.college ||
                                application.collegeName ||
                                "Not Available"
                            );


                        /* -------------------------------------
                           DEGREE
                        ------------------------------------- */

                        const degree =
                            getFirstValue(
                                profile,
                                [
                                    "degree",
                                    "course",
                                    "program",
                                    "qualification",
                                    "education",
                                    "highestQualification",
                                    "degreeName",
                                    "courseName",
                                    "programName"
                                ],
                                application.degree ||
                                application.course ||
                                "Not Available"
                            );


                        /* -------------------------------------
                           DEPARTMENT
                        ------------------------------------- */

                        const department =
                            getFirstValue(
                                profile,
                                [
                                    "department",
                                    "branch",
                                    "stream",
                                    "specialization"
                                ],
                                application.department ||
                                application.branch ||
                                "Not Available"
                            );


                        /* -------------------------------------
                           PHONE
                        ------------------------------------- */

                        const phone =
                            getFirstValue(
                                profile,
                                [
                                    "phone",
                                    "mobile",
                                    "mobileNumber",
                                    "phoneNumber",
                                    "contactNumber"
                                ],
                                application.phone ||
                                "Not Available"
                            );


                        /* -------------------------------------
                           PHOTO
                        ------------------------------------- */

                        const profilePhoto =
                            getProfilePhoto(
                                profile,
                                application
                            );


                        /* -------------------------------------
                           JOB
                        ------------------------------------- */

                        const jobTitle =
                            application.jobTitle ||
                            application.jobName ||
                            application.title ||
                            "Job Not Available";


                        /* -------------------------------------
                           COMPANY
                        ------------------------------------- */

                        const companyName =
                            application.companyName ||
                            application.company ||
                            "Company";


                        /* -------------------------------------
                           STATUS
                        ------------------------------------- */

                        const status =
                            getStatus(
                                application
                            );


                        /* -------------------------------------
                           APPLIED DATE
                        ------------------------------------- */

                        const appliedAt =
                            application.appliedAt ||
                            application.createdAt ||
                            application.applicationDate ||
                            application.appliedDate ||
                            null;


                        return {

                            ...application,

                            profile,

                            studentProfileId:
                                profile?.id || null,

                            studentName,

                            email,

                            studentEmail:
                                email,

                            college,

                            degree,

                            department,

                            phone,

                            profilePhoto,

                            jobTitle,

                            companyName,

                            status,

                            appliedAt

                        };

                    }
                );


            /* =================================================
               5. SORT NEWEST APPLICATION FIRST
            ================================================= */

            mergedApplications.sort(
                (a, b) => {

                    return (
                        getDateTime(
                            b.appliedAt
                        ) -
                        getDateTime(
                            a.appliedAt
                        )
                    );

                }
            );


            /* =================================================
               6. SAVE
            ================================================= */

            setApplications(
                mergedApplications
            );

        }
        catch (error) {

            console.error(
                "Applications fetch error:",
                error
            );

            setError(
                "Unable to load applications. Please try again."
            );

        }
        finally {

            setLoading(false);

        }

    };


    /* =====================================================
       REFRESH
    ===================================================== */

    const handleRefresh = async () => {

        try {

            setRefreshing(true);

            await fetchApplications();

        }
        finally {

            setRefreshing(false);

        }

    };


    /* =====================================================
       FILTER APPLICATIONS
    ===================================================== */

    const filteredApplications =
        useMemo(() => {

            const searchText =
                search
                    .trim()
                    .toLowerCase();


            return applications.filter(
                (application) => {

                    /* -----------------------------------------
                       STATUS FILTER
                    ----------------------------------------- */

                    if (
                        statusFilter !== "all" &&
                        application.status !== statusFilter
                    ) {

                        return false;

                    }


                    /* -----------------------------------------
                       SEARCH
                    ----------------------------------------- */

                    if (!searchText) {
                        return true;
                    }


                    const searchableText = [

                        application.studentName,

                        application.email,

                        application.college,

                        application.degree,

                        application.department,

                        application.jobTitle,

                        application.companyName,

                        application.phone

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    return searchableText.includes(
                        searchText
                    );

                }
            );

        }, [
            applications,
            search,
            statusFilter
        ]);


    /* =====================================================
       STATISTICS
    ===================================================== */

    const totalCount =
        applications.length;


    const pendingCount =
        applications.filter(
            (application) =>
                application.status === "pending"
        ).length;


    const acceptedCount =
        applications.filter(
            (application) =>
                application.status === "accepted"
        ).length;


    const rejectedCount =
        applications.filter(
            (application) =>
                application.status === "rejected"
        ).length;


    /* =====================================================
       STUDENT AVATAR
    ===================================================== */

    const StudentAvatar = ({
        student
    }) => {

        const photo =
            student?.profilePhoto
                ? String(
                    student.profilePhoto
                ).trim()
                : "";


        const name =
            student?.studentName ||
            "Student";


        const initials =
            name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map(
                    (part) =>
                        part.charAt(0)
                )
                .join("")
                .toUpperCase();


        /* ---------------------------------------------
           NO PHOTO
        --------------------------------------------- */

        if (!photo) {

            return (

                <div
                    className="student-avatar"
                    title={name}
                >

                    <span className="student-avatar-fallback">

                        {initials || "S"}

                    </span>

                </div>

            );

        }


        /* ---------------------------------------------
           PHOTO
        --------------------------------------------- */

        return (

            <div
                className="student-avatar"
                title={name}
            >

                <img
                    src={photo}
                    alt={`${name} profile`}
                    className="student-avatar-image"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(event) => {

                        event.currentTarget.style.display =
                            "none";


                        const fallback =
                            event.currentTarget
                                .parentElement
                                ?.querySelector(
                                    ".student-avatar-fallback"
                                );


                        if (fallback) {

                            fallback.style.display =
                                "flex";

                        }

                    }}
                />


                <span
                    className="student-avatar-fallback"
                    style={{
                        display: "none"
                    }}
                >

                    {initials || "S"}

                </span>

            </div>

        );

    };


    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {

        return (

            <div className="admin-applications-page">

                <div className="applications-message">

                    <div className="loading-spinner"></div>

                    <h3>
                        Loading Applications
                    </h3>

                    <p>
                        Fetching all student applications...
                    </p>

                </div>

            </div>

        );

    }


    /* =====================================================
       ERROR
    ===================================================== */

    if (error) {

        return (

            <div className="admin-applications-page">

                <div className="applications-message error">

                    <div className="empty-icon">
                        <FaFileAlt />
                    </div>

                    <h3>
                        Unable to Load Applications
                    </h3>

                    <p>
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={fetchApplications}
                    >
                        Try Again
                    </button>

                </div>

            </div>

        );

    }


    /* =====================================================
       RETURN
    ===================================================== */

    return (

        <div className="admin-applications-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <section className="applications-header">

                <div>

                    <span className="page-label">
                        APPLICATION MANAGEMENT
                    </span>

                    <h1>
                        Student Applications
                    </h1>

                    <p>
                        View all students who have applied
                        for company job opportunities.
                    </p>

                </div>


                <button
                    type="button"
                    className="refresh-button"
                    onClick={handleRefresh}
                    disabled={refreshing}
                >

                    <FaSyncAlt
                        className={
                            refreshing
                                ? "refresh-spinning"
                                : ""
                        }
                    />

                    {refreshing
                        ? "Refreshing..."
                        : "Refresh"
                    }

                </button>

            </section>


            {/* =================================================
                STATISTICS
            ================================================= */}

            <section className="application-stat-grid">


                <div className="application-stat-card">

                    <div className="stat-icon total">
                        <FaUsers />
                    </div>

                    <div>

                        <span>
                            Total Applicants
                        </span>

                        <strong>
                            {totalCount}
                        </strong>

                    </div>

                </div>


                <div className="application-stat-card">

                    <div className="stat-icon pending">
                        <FaFileAlt />
                    </div>

                    <div>

                        <span>
                            Pending
                        </span>

                        <strong>
                            {pendingCount}
                        </strong>

                    </div>

                </div>


                <div className="application-stat-card">

                    <div className="stat-icon accepted">
                        <FaGraduationCap />
                    </div>

                    <div>

                        <span>
                            Selected
                        </span>

                        <strong>
                            {acceptedCount}
                        </strong>

                    </div>

                </div>


                <div className="application-stat-card">

                    <div className="stat-icon rejected">
                        <FaUsers />
                    </div>

                    <div>

                        <span>
                            Rejected
                        </span>

                        <strong>
                            {rejectedCount}
                        </strong>

                    </div>

                </div>


            </section>


            {/* =================================================
                TOOLBAR
            ================================================= */}

            <section className="applications-toolbar">


                <div className="search-container">

                    <FaSearch className="search-icon" />

                    <input
                        type="text"
                        placeholder="Search student, job, company, college..."
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                    />

                </div>


                <select
                    value={statusFilter}
                    onChange={(event) =>
                        setStatusFilter(
                            event.target.value
                        )
                    }
                >

                    <option value="all">
                        All Applications
                    </option>

                    <option value="pending">
                        Pending
                    </option>

                    <option value="accepted">
                        Selected
                    </option>

                    <option value="placed">
                        Placed
                    </option>

                    <option value="rejected">
                        Rejected
                    </option>

                </select>


            </section>


            {/* =================================================
                RESULTS INFO
            ================================================= */}

            <div className="applications-results">

                <span>

                    Showing
                    <strong>
                        {" "}
                        {filteredApplications.length}
                        {" "}
                    </strong>
                    of
                    <strong>
                        {" "}
                        {applications.length}
                        {" "}
                    </strong>
                    applications

                </span>

            </div>


            {/* =================================================
                APPLICATION TABLE
            ================================================= */}

            <section className="applications-card">

                {filteredApplications.length === 0 ? (

                    <div className="applications-message">

                        <div className="empty-icon">
                            <FaUsers />
                        </div>

                        <h3>
                            No Applications Found
                        </h3>

                        <p>
                            No student applications match
                            your current search or filter.
                        </p>

                    </div>

                ) : (

                    <div className="applications-table-wrapper">

                        <table className="applications-table">


                            <thead>

                                <tr>

                                    <th>
                                        Student
                                    </th>

                                    <th>
                                        Job
                                    </th>

                                    <th>
                                        Company
                                    </th>

                                    <th>
                                        Education
                                    </th>

                                    <th>
                                        Applied
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {filteredApplications.map(
                                    (application) => (

                                        <tr
                                            key={
                                                application.id
                                            }
                                        >


                                            {/* =================================
                                                STUDENT
                                            ================================= */}

                                            <td>

                                                <div className="student-cell">

                                                    <StudentAvatar
                                                        student={
                                                            application
                                                        }
                                                    />


                                                    <div className="student-info">

                                                        <strong>
                                                            {
                                                                application.studentName
                                                            }
                                                        </strong>

                                                        <span>

                                                            <FaEnvelope />

                                                            {
                                                                application.email
                                                            }

                                                        </span>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* =================================
                                                JOB
                                            ================================= */}

                                            <td>

                                                <div className="job-cell">

                                                    <span className="job-name">

                                                        <FaBriefcase />

                                                        {
                                                            application.jobTitle
                                                        }

                                                    </span>

                                                </div>

                                            </td>


                                            {/* =================================
                                                COMPANY
                                            ================================= */}

                                            <td>

                                                <span className="company-name">

                                                    <FaBuilding />

                                                    {
                                                        application.companyName
                                                    }

                                                </span>

                                            </td>


                                            {/* =================================
                                                EDUCATION
                                            ================================= */}

                                            <td>

                                                <div className="education-cell">

                                                    <strong>

                                                        <FaGraduationCap />

                                                        {
                                                            application.degree
                                                        }

                                                    </strong>

                                                    <span>

                                                        <FaUniversity />

                                                        {
                                                            application.college
                                                        }

                                                    </span>

                                                </div>

                                            </td>


                                            {/* =================================
                                                APPLIED DATE
                                            ================================= */}

                                            <td>

                                                <span className="applied-date">

                                                    <FaCalendarAlt />

                                                    {
                                                        formatDate(
                                                            application.appliedAt
                                                        )
                                                    }

                                                </span>

                                            </td>


                                            {/* =================================
                                                STATUS
                                            ================================= */}

                                            <td>

                                                <span
                                                    className={
                                                        `application-status ${application.status}`
                                                    }
                                                >

                                                    <span className="status-dot"></span>

                                                    {
                                                        getStatusLabel(
                                                            application.status
                                                        )
                                                    }

                                                </span>

                                            </td>


                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>


        </div>

    );

}


export default Applications;