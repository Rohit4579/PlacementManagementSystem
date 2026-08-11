
import { useEffect, useState } from "react";

import {
    collection,
    getDocs
} from "firebase/firestore";

import {
    FaBriefcase,
    FaUsers,
    FaUserCheck,
    FaClock,
    FaGraduationCap,
    FaChartLine,
    FaArrowRight,
    FaMapMarkerAlt,
    FaCalendarAlt,
    FaMoneyBillWave,
    FaBuilding,
    FaCheckCircle,
    FaUserGraduate
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

import { db } from "../../firebase/firebaseConfig";

import "./AdminDashboard.css";


/* =========================================================
   ADMIN DASHBOARD
========================================================= */

function AdminDashboard() {

    const navigate = useNavigate();


    /* =====================================================
       STATES
    ===================================================== */

    const [totalJobs, setTotalJobs] = useState(0);

    const [totalApplicants, setTotalApplicants] = useState(0);

    const [selected, setSelected] = useState(0);

    const [placed, setPlaced] = useState(0);

    const [pending, setPending] = useState(0);

    const [placementRate, setPlacementRate] = useState(0);

    const [jobs, setJobs] = useState([]);

    const [selectedStudents, setSelectedStudents] = useState([]);

    const [placedStudents, setPlacedStudents] = useState([]);

    const [loading, setLoading] = useState(true);


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
       GET PROFILE PHOTO

       Checks student profile first.

       Supported fields:

       photoURL
       photoUrl
       profilePhoto
       profilePhotoURL
       profilePhotoUrl
       profileImage
       profileImageURL
       profileImageUrl
       photo
       image
       imageURL
       imageUrl
       avatar
       avatarUrl
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


        /* ---------------------------------------------
           FIRST: STUDENT PROFILE
        --------------------------------------------- */

        const profilePhoto =
            getFirstValue(
                profile,
                photoFields,
                ""
            );


        if (profilePhoto) {

            return String(
                profilePhoto
            ).trim();

        }


        /* ---------------------------------------------
           SECOND: APPLICATION
        --------------------------------------------- */

        const applicationPhoto =
            getFirstValue(
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
                    .toLocaleDateString();

            }

            const date = new Date(value);

            if (isNaN(date.getTime())) {
                return "Not Available";
            }

            return date.toLocaleDateString();

        }

        catch (error) {

            console.error(
                "Date formatting error:",
                error
            );

            return "Not Available";

        }

    };


    /* =====================================================
       GET DATE TIME
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
       LOAD DASHBOARD
    ===================================================== */

    useEffect(() => {

        fetchDashboard();

    }, []);


    /* =====================================================
       FETCH DASHBOARD
    ===================================================== */

    const fetchDashboard = async () => {

        try {

            setLoading(true);


            /* =================================================
               1. LOAD JOBS
            ================================================= */

            const jobsSnapshot =
                await getDocs(
                    collection(
                        db,
                        "jobs"
                    )
                );


            const jobList =
                jobsSnapshot.docs.map(
                    (document) => ({

                        id: document.id,

                        ...document.data()

                    })
                );


            /* =================================================
               SORT JOBS NEWEST FIRST
            ================================================= */

            jobList.sort(
                (a, b) => {

                    return (
                        getDateTime(
                            b.createdAt
                        ) -
                        getDateTime(
                            a.createdAt
                        )
                    );

                }
            );


            setJobs(jobList);

            setTotalJobs(
                jobList.length
            );


            /* =================================================
               2. LOAD APPLICATIONS
            ================================================= */

            const applicationsSnapshot =
                await getDocs(
                    collection(
                        db,
                        "applications"
                    )
                );


            const applications =
                applicationsSnapshot.docs.map(
                    (document) => ({

                        id: document.id,

                        ...document.data()

                    })
                );


            /* =================================================
               3. LOAD ALL STUDENT PROFILES ONCE
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
                       DOCUMENT ID
                    ----------------------------------------- */

                    profilesById[
                        document.id
                    ] = {

                        id: document.id,

                        ...profile

                    };


                    /* -----------------------------------------
                       UID
                    ----------------------------------------- */

                    if (
                        profile.uid
                    ) {

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
               HELPER:
               FIND STUDENT PROFILE
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
                   FIRST TRY DOCUMENT ID
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
                   THEN TRY UID
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
               4. COUNTERS
            ================================================= */

            let selectedCount = 0;

            let placedCount = 0;

            let pendingCount = 0;


            /* =================================================
               5. PROCESS APPLICATIONS
            ================================================= */

            const processedApplications = [];


            for (
                const application of applications
            ) {

                const status =
                    String(
                        application.status ||
                        "pending"
                    )
                        .trim()
                        .toLowerCase();


                /* -----------------------------------------
                   SELECTED
                ----------------------------------------- */

                const isSelected =
                    status === "accepted" ||
                    status === "selected";


                /* -----------------------------------------
                   PLACED
                ----------------------------------------- */

                const isPlaced =
                    application.placedStudent === true ||
                    status === "placed";


                /* -----------------------------------------
                   PENDING
                ----------------------------------------- */

                const isPending =
                    status === "applied" ||
                    status === "pending";


                if (isSelected) {
                    selectedCount++;
                }


                if (isPlaced) {
                    placedCount++;
                }


                if (
                    isPending &&
                    !isSelected
                ) {

                    pendingCount++;

                }


                /* -----------------------------------------
                   ONLY PROCESS SELECTED / PLACED
                ----------------------------------------- */

                if (
                    !isSelected &&
                    !isPlaced
                ) {

                    continue;

                }


                const profile =
                    findStudentProfile(
                        application
                    );


                /* =================================================
                   STUDENT NAME
                ================================================= */

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


                /* =================================================
                   EMAIL
                ================================================= */

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


                /* =================================================
                   COLLEGE
                ================================================= */

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


                /* =================================================
                   DEGREE
                ================================================= */

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


                /* =================================================
                   DEPARTMENT
                ================================================= */

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


                /* =================================================
                   PHONE
                ================================================= */

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


                /* =================================================
                   PROFILE PHOTO
                ================================================= */

                const profilePhoto =
                    getProfilePhoto(
                        profile,
                        application
                    );


                /* =================================================
                   JOB
                ================================================= */

                const jobTitle =
                    application.jobTitle ||
                    application.jobName ||
                    application.title ||
                    "Job Not Available";


                /* =================================================
                   COMPANY
                ================================================= */

                const companyName =
                    application.companyName ||
                    application.company ||
                    "Company";


                /* =================================================
                   FINAL STUDENT OBJECT
                ================================================= */

                processedApplications.push({

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

                    isSelected,

                    isPlaced

                });

            }


            /* =================================================
               6. PLACEMENT RATE
            ================================================= */

            const calculatedPlacementRate =
                selectedCount > 0
                    ? Math.round(
                        (
                            placedCount /
                            selectedCount
                        ) * 100
                    )
                    : 0;


            /* =================================================
               7. SET COUNTERS
            ================================================= */

            setTotalApplicants(
                applications.length
            );

            setSelected(
                selectedCount
            );

            setPlaced(
                placedCount
            );

            setPending(
                pendingCount
            );

            setPlacementRate(
                calculatedPlacementRate
            );


            /* =================================================
               8. SELECTED STUDENTS
            ================================================= */

            const selectedList =
                processedApplications
                    .filter(
                        (application) =>
                            application.isSelected
                    )
                    .sort(
                        (a, b) =>
                            getDateTime(
                                b.appliedAt ||
                                b.createdAt
                            ) -
                            getDateTime(
                                a.appliedAt ||
                                a.createdAt
                            )
                    );


            /* =================================================
               9. PLACED STUDENTS
            ================================================= */

            const placedList =
                processedApplications
                    .filter(
                        (application) =>
                            application.isPlaced
                    )
                    .sort(
                        (a, b) =>
                            getDateTime(
                                b.appliedAt ||
                                b.createdAt
                            ) -
                            getDateTime(
                                a.appliedAt ||
                                a.createdAt
                            )
                    );


            /* =================================================
               10. SET RECENT STUDENTS
            ================================================= */

            setSelectedStudents(
                selectedList.slice(0, 5)
            );


            setPlacedStudents(
                placedList.slice(0, 5)
            );

        }

        catch (error) {

            console.error(
                "Admin dashboard error:",
                error
            );

        }

        finally {

            setLoading(false);

        }

    };


    /* =====================================================
       PROFILE AVATAR

       UPDATED:
       - Displays actual student photo
       - Fallback initials
       - Handles broken URLs
       - Works in selected student table
       - Works in placed student cards
    ===================================================== */

    const StudentAvatar = ({
        student,
        placed = false
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


        const firstLetter =
            name
                .charAt(0)
                .toUpperCase();


        const avatarClass =
            placed
                ? "placed-avatar"
                : "student-avatar";


        /* ---------------------------------------------
           NO PHOTO
        --------------------------------------------- */

        if (!photo) {

            return (

                <div
                    className={
                        avatarClass
                    }
                    aria-label={
                        `${name} profile`
                    }
                    title={name}
                >

                    {firstLetter}

                </div>

            );

        }


        /* ---------------------------------------------
           PHOTO
        --------------------------------------------- */

        return (

            <div
                className={`${avatarClass} student-photo-container`}
            >

                <img
                    src={photo}
                    alt={`${name} profile`}
                    className="student-profile-photo"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(event) => {

                        /*
                         * Hide broken image
                         */

                        event.currentTarget.style.display =
                            "none";


                        /*
                         * Show fallback
                         */

                        const fallback =
                            event.currentTarget
                                .parentElement
                                ?.querySelector(
                                    ".student-photo-fallback"
                                );


                        if (fallback) {

                            fallback.style.display =
                                "flex";

                        }

                    }}
                />


                <span
                    className="student-photo-fallback"
                    style={{
                        display: "none"
                    }}
                >

                    {firstLetter}

                </span>

            </div>

        );

    };


    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {

        return (

            <div className="admin-dashboard">

                <div className="admin-loading">

                    <div className="admin-spinner"></div>

                    <p>
                        Loading admin dashboard...
                    </p>

                </div>

            </div>

        );

    }


    /* =====================================================
       RETURN
    ===================================================== */

    return (

        <div className="admin-dashboard">


            {/* =================================================
                HEADER
            ================================================= */}

            <section className="admin-header">

                <div className="admin-welcome">

                    <div>

                        <span className="admin-label">
                            ADMIN DASHBOARD
                        </span>

                        <h1>
                            Recruitment Overview 👋
                        </h1>

                        <p>
                            Monitor jobs, applications,
                            selected students and
                            placement progress across
                            all companies.
                        </p>

                    </div>

                </div>

            </section>


            {/* =================================================
                STATISTICS
            ================================================= */}

            <section className="admin-cards">


                <div className="admin-card">

                    <div className="admin-card-icon blue">
                        <FaBriefcase />
                    </div>

                    <div className="admin-card-content">

                        <span>
                            Total Jobs
                        </span>

                        <h3>
                            {totalJobs}
                        </h3>

                        <small>
                            Job postings
                        </small>

                    </div>

                </div>


                <div className="admin-card">

                    <div className="admin-card-icon purple">
                        <FaUsers />
                    </div>

                    <div className="admin-card-content">

                        <span>
                            Applicants
                        </span>

                        <h3>
                            {totalApplicants}
                        </h3>

                        <small>
                            Total applications
                        </small>

                    </div>

                </div>


                <div className="admin-card">

                    <div className="admin-card-icon green">
                        <FaUserCheck />
                    </div>

                    <div className="admin-card-content">

                        <span>
                            Selected
                        </span>

                        <h3>
                            {selected}
                        </h3>

                        <small>
                            Selected students
                        </small>

                    </div>

                </div>


                <div className="admin-card">

                    <div className="admin-card-icon placed">
                        <FaGraduationCap />
                    </div>

                    <div className="admin-card-content">

                        <span>
                            Placed
                        </span>

                        <h3>
                            {placed}
                        </h3>

                        <small>
                            Students placed
                        </small>

                    </div>

                </div>


                <div className="admin-card">

                    <div className="admin-card-icon orange">
                        <FaClock />
                    </div>

                    <div className="admin-card-content">

                        <span>
                            Pending
                        </span>

                        <h3>
                            {pending}
                        </h3>

                        <small>
                            Applications to review
                        </small>

                    </div>

                </div>


            </section>


            {/* =================================================
                PLACEMENT OVERVIEW
            ================================================= */}

            <section className="admin-placement-overview">

                <div className="placement-overview-icon">

                    <FaChartLine />

                </div>


                <div className="placement-overview-content">

                    <span className="overview-label">
                        PLACEMENT OVERVIEW
                    </span>

                    <h2>
                        Placement Rate
                    </h2>

                    <p>
                        Students placed from the
                        selected student pool.
                    </p>

                </div>


                <div className="placement-rate">

                    <strong>
                        {placementRate}%
                    </strong>

                    <span>
                        Placement Rate
                    </span>

                </div>


                <div className="placement-stat">

                    <FaUserGraduate />

                    <div>

                        <strong>
                            {placed}
                        </strong>

                        <span>
                            Students Placed
                        </span>

                    </div>

                </div>

            </section>


            {/* =================================================
                PLACEMENT PIPELINE
            ================================================= */}

            <section className="placement-pipeline">

                <div className="pipeline-header">

                    <div>

                        <span className="section-label">
                            PLACEMENT MANAGEMENT
                        </span>

                        <h2>
                            Placement Pipeline
                        </h2>

                        <p>
                            Track candidates from selection
                            through final placement.
                        </p>

                    </div>

                </div>


                <div className="pipeline-content">


                    <div className="pipeline-step">

                        <div className="pipeline-icon selected-icon">
                            <FaUserCheck />
                        </div>

                        <div>

                            <strong>
                                {selected}
                            </strong>

                            <span>
                                Students Selected
                            </span>

                        </div>

                    </div>


                    <div className="pipeline-arrow">
                        <FaArrowRight />
                    </div>


                    <div className="pipeline-step">

                        <div className="pipeline-icon placed-icon">
                            <FaGraduationCap />
                        </div>

                        <div>

                            <strong>
                                {placed}
                            </strong>

                            <span>
                                Students Placed
                            </span>

                        </div>

                    </div>


                    <div className="pipeline-arrow">
                        <FaArrowRight />
                    </div>


                    <div className="pipeline-step">

                        <div className="pipeline-icon rate-icon">
                            <FaCheckCircle />
                        </div>

                        <div>

                            <strong>
                                {placementRate}%
                            </strong>

                            <span>
                                Placement Rate
                            </span>

                        </div>

                    </div>


                </div>

            </section>


            {/* =================================================
                RECENT SELECTED STUDENTS
            ================================================= */}

            <section className="admin-students-section">

                <div className="section-header">

                    <div>

                        <span className="section-label">
                            SELECTIONS
                        </span>

                        <h2>
                            Recent Selected Students
                        </h2>

                        <p>
                            Recently selected candidates
                            across all companies.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="view-all-btn"
                        onClick={() =>
                            navigate(
                                "/admin/applications"
                            )
                        }
                    >

                        View Applications

                        <FaArrowRight />

                    </button>

                </div>


                {selectedStudents.length === 0 ? (

                    <div className="empty-students">

                        <div className="empty-student-icon">
                            <FaUserCheck />
                        </div>

                        <h3>
                            No Selected Students
                        </h3>

                        <p>
                            Selected students will
                            appear here.
                        </p>

                    </div>

                ) : (

                    <div className="students-table-wrapper">

                        <table className="students-table">

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
                                        College
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {selectedStudents.map(
                                    (student) => (

                                        <tr
                                            key={
                                                student.id
                                            }
                                        >

                                            <td>

                                                <div className="student-info">

                                                    {/* =================================
                                                        STUDENT PHOTO
                                                    ================================= */}

                                                    <div className="student-avatar-wrapper">

                                                        <StudentAvatar
                                                            student={
                                                                student
                                                            }
                                                        />

                                                    </div>


                                                    <div className="student-text">

                                                        <strong>
                                                            {
                                                                student.studentName
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                student.email
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>


                                            <td>

                                                <span className="table-job">

                                                    <FaBriefcase />

                                                    {
                                                        student.jobTitle
                                                    }

                                                </span>

                                            </td>


                                            <td>

                                                <span className="table-company">

                                                    <FaBuilding />

                                                    {
                                                        student.companyName
                                                    }

                                                </span>

                                            </td>


                                            <td>

                                                {
                                                    student.college
                                                }

                                            </td>


                                            <td>

                                                {student.isPlaced ? (

                                                    <span className="student-status placed-status">

                                                        <span className="status-dot"></span>

                                                        Placed

                                                    </span>

                                                ) : (

                                                    <span className="student-status selected-status">

                                                        <span className="status-dot"></span>

                                                        Selected

                                                    </span>

                                                )}

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>


            {/* =================================================
                RECENT PLACED STUDENTS
            ================================================= */}

            <section className="admin-students-section placed-section">

                <div className="section-header">

                    <div>

                        <span className="section-label">
                            PLACEMENT
                        </span>

                        <h2>
                            Recent Placed Students
                        </h2>

                        <p>
                            Students recently marked as
                            officially placed.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="view-all-btn"
                        onClick={() =>
                            navigate(
                                "/admin/placements"
                            )
                        }
                    >

                        View Placements

                        <FaArrowRight />

                    </button>

                </div>


                {placedStudents.length === 0 ? (

                    <div className="empty-students">

                        <div className="empty-student-icon">
                            <FaGraduationCap />
                        </div>

                        <h3>
                            No Placed Students
                        </h3>

                        <p>
                            Students marked as placed
                            will appear here.
                        </p>

                    </div>

                ) : (

                    <div className="placed-students-grid">

                        {placedStudents.map(
                            (student) => (

                                <div
                                    className="placed-student-card"
                                    key={
                                        student.id
                                    }
                                >

                                    <div className="placed-card-top">


                                        <StudentAvatar
                                            student={
                                                student
                                            }
                                            placed
                                        />


                                        <div className="placed-card-name">

                                            <h3>
                                                {
                                                    student.studentName
                                                }
                                            </h3>

                                            <span>
                                                {
                                                    student.email
                                                }
                                            </span>

                                        </div>


                                        <div className="placed-check">

                                            <FaCheckCircle />

                                        </div>

                                    </div>


                                    <div className="placed-card-job">

                                        <span>
                                            Job
                                        </span>

                                        <strong>
                                            {
                                                student.jobTitle
                                            }
                                        </strong>

                                    </div>


                                    <div className="placed-card-company">

                                        <FaBuilding />

                                        <span>
                                            {
                                                student.companyName
                                            }
                                        </span>

                                    </div>


                                    <div className="placed-card-college">

                                        <span>
                                            College
                                        </span>

                                        <strong>
                                            {
                                                student.college
                                            }
                                        </strong>

                                    </div>


                                    <div className="placed-badge">

                                        <FaGraduationCap />

                                        Student Placed

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                )}

            </section>


            {/* =================================================
                RECENT JOBS
            ================================================= */}

            <section className="admin-jobs-section">

                <div className="section-header">

                    <div>

                        <span className="section-label">
                            JOB MANAGEMENT
                        </span>

                        <h2>
                            Recent Job Posts
                        </h2>

                        <p>
                            Latest recruitment
                            opportunities from companies.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="view-all-btn"
                        onClick={() =>
                            navigate(
                                "/admin/jobs"
                            )
                        }
                    >

                        View All Jobs

                        <FaArrowRight />

                    </button>

                </div>


                {jobs.length === 0 ? (

                    <div className="empty-students">

                        <div className="empty-student-icon">

                            <FaBriefcase />

                        </div>

                        <h3>
                            No Job Posts
                        </h3>

                        <p>
                            Company job postings will
                            appear here.
                        </p>

                    </div>

                ) : (

                    <div className="jobs-table-wrapper">

                        <table className="jobs-table">

                            <thead>

                                <tr>

                                    <th>
                                        Job
                                    </th>

                                    <th>
                                        Location
                                    </th>

                                    <th>
                                        Salary
                                    </th>

                                    <th>
                                        Deadline
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {jobs
                                    .slice(0, 5)
                                    .map(
                                        (job) => (

                                            <tr
                                                key={
                                                    job.id
                                                }
                                            >

                                                <td>

                                                    <div className="job-info">

                                                        <div className="job-icon">

                                                            <FaBriefcase />

                                                        </div>

                                                        <div>

                                                            <strong>
                                                                {
                                                                    job.jobTitle ||
                                                                    job.title ||
                                                                    "Untitled Job"
                                                                }
                                                            </strong>

                                                            <span>
                                                                {
                                                                    job.companyName ||
                                                                    "Company"
                                                                }
                                                            </span>

                                                        </div>

                                                    </div>

                                                </td>


                                                <td>

                                                    <span className="table-detail">

                                                        <FaMapMarkerAlt />

                                                        {
                                                            job.location ||
                                                            "Not specified"
                                                        }

                                                    </span>

                                                </td>


                                                <td>

                                                    <span className="table-detail">

                                                        <FaMoneyBillWave />

                                                        {
                                                            job.salary ||
                                                            "Not specified"
                                                        }

                                                    </span>

                                                </td>


                                                <td>

                                                    <span className="table-detail">

                                                        <FaCalendarAlt />

                                                        {
                                                            formatDate(
                                                                job.deadline
                                                            )
                                                        }

                                                    </span>

                                                </td>


                                                <td>

                                                    <span className="job-status">

                                                        Active

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


export default AdminDashboard;
