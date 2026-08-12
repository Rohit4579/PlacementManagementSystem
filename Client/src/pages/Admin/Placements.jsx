import React, { useEffect, useMemo, useState } from "react";

import {
    collection,
    getDocs
} from "firebase/firestore";

import {
    FaBuilding,
    FaCheckCircle,
    FaGraduationCap,
    FaSearch,
    FaSyncAlt,
    FaUserGraduate,
    FaBriefcase,
    FaMapMarkerAlt
} from "react-icons/fa";

import { db } from "../../firebase/firebaseConfig";

import "./Placements.css";


function Placements() {

    // =====================================================
    // STATES
    // =====================================================

    const [placements, setPlacements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);


    // =====================================================
    // GET FIRST AVAILABLE VALUE
    // =====================================================

    const getFirstValue = (object, fields, fallback = "") => {

        if (!object) {
            return fallback;
        }

        for (const field of fields) {

            const value = object[field];

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


    // =====================================================
    // NORMALIZE TEXT
    // =====================================================

    const normalizeText = (value) => {

        if (
            value === undefined ||
            value === null
        ) {
            return "";
        }

        return String(value)
            .trim()
            .toLowerCase();
    };


    // =====================================================
    // STUDENT INITIALS
    // =====================================================

    const getStudentInitials = (name) => {

        const cleanName = String(name || "")
            .trim()
            .replace(/\s+/g, " ");

        if (!cleanName) {
            return "ST";
        }

        const parts = cleanName
            .split(" ")
            .filter(Boolean);

        if (parts.length >= 2) {

            return (
                parts[0].charAt(0) +
                parts[parts.length - 1].charAt(0)
            ).toUpperCase();

        }

        return cleanName
            .substring(0, 2)
            .toUpperCase();
    };


    // =====================================================
    // FIRESTORE DATE -> TIMESTAMP
    // =====================================================

    const getDateValue = (value) => {

        if (!value) {
            return 0;
        }

        try {

            // Firebase Timestamp
            if (
                typeof value.toDate === "function"
            ) {

                return value.toDate().getTime();
            }

            // Firestore Timestamp-like object
            if (
                typeof value === "object" &&
                value.seconds !== undefined
            ) {

                return Number(value.seconds) * 1000;
            }

            const date = new Date(value);

            if (isNaN(date.getTime())) {
                return 0;
            }

            return date.getTime();

        } catch (err) {

            return 0;
        }
    };


    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (value) => {

        const timestamp = getDateValue(value);

        if (!timestamp) {
            return "—";
        }

        return new Date(timestamp).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    };


    // =====================================================
    // FORMAT DATE + TIME
    // =====================================================

    const formatDateTime = (value) => {

        const timestamp = getDateValue(value);

        if (!timestamp) {
            return "Not available";
        }

        return new Date(timestamp).toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    };


    // =====================================================
    // GET PROFILE PHOTO
    // =====================================================

    const getProfilePhoto = (profile) => {

        return getFirstValue(
            profile,
            [
                "profilePhotoURL",
                "profilePhotoUrl",
                "photoURL",
                "photoUrl",
                "profilePhoto",
                "profileImage",
                "profileImageURL",
                "profileImageUrl",
                "imageURL",
                "imageUrl",
                "photo",
                "avatar",
                "avatarUrl"
            ],
            ""
        );
    };


    // =====================================================
    // FIND COMPANY
    //
    // Priority:
    // 1. Company ID
    // 2. Company Email
    // 3. Company Name
    // =====================================================

    const findCompanyForRecord = (
        application,
        companies
    ) => {

        if (
            !application ||
            !companies ||
            companies.length === 0
        ) {
            return null;
        }


        // -------------------------------------------------
        // COMPANY IDS
        // -------------------------------------------------

        const companyIds = [
            application.companyId,
            application.companyID,
            application.companyUid,
            application.companyUID,
            application.companyUserId,
            application.companyUserID,
            application.employerId,
            application.employerID,
            application.recruiterId,
            application.recruiterID
        ]
            .filter(Boolean)
            .map(normalizeText);


        if (companyIds.length > 0) {

            const companyById = companies.find(
                (company) => {

                    const possibleIds = [
                        company.id,
                        company.uid,
                        company.userId,
                        company.companyId
                    ]
                        .filter(Boolean)
                        .map(normalizeText);

                    return possibleIds.some(
                        (id) => companyIds.includes(id)
                    );
                }
            );

            if (companyById) {
                return companyById;
            }
        }


        // -------------------------------------------------
        // COMPANY EMAIL
        // -------------------------------------------------

        const companyEmails = [
            application.companyEmail,
            application.recruiterEmail,
            application.employerEmail
        ]
            .filter(Boolean)
            .map(normalizeText);


        if (companyEmails.length > 0) {

            const companyByEmail = companies.find(
                (company) => {

                    const emails = [
                        company.email,
                        company.companyEmail,
                        company.contactEmail,
                        company.recruiterEmail
                    ]
                        .filter(Boolean)
                        .map(normalizeText);

                    return emails.some(
                        (email) =>
                            companyEmails.includes(email)
                    );
                }
            );

            if (companyByEmail) {
                return companyByEmail;
            }
        }


        // -------------------------------------------------
        // COMPANY NAME
        // -------------------------------------------------

        const companyNames = [
            application.companyName,
            application.company,
            application.employerName,
            application.recruiterName
        ]
            .filter(Boolean)
            .map(normalizeText);


        if (companyNames.length > 0) {

            const companyByName = companies.find(
                (company) => {

                    const names = [
                        company.companyName,
                        company.name,
                        company.company,
                        company.displayName,
                        company.businessName
                    ]
                        .filter(Boolean)
                        .map(normalizeText);

                    return names.some(
                        (name) =>
                            companyNames.includes(name)
                    );
                }
            );

            if (companyByName) {
                return companyByName;
            }
        }


        return null;
    };


    // =====================================================
    // FIND STUDENT PROFILE
    // =====================================================

    const findStudentProfile = (
        application,
        profilesById,
        profilesByUid
    ) => {

        if (!application) {
            return null;
        }


        const studentIds = [
            application.studentId,
            application.studentID,
            application.uid,
            application.userId,
            application.userID
        ]
            .filter(Boolean);


        for (const studentId of studentIds) {

            // Direct document ID
            if (profilesById[studentId]) {
                return profilesById[studentId];
            }


            // UID
            if (profilesByUid[studentId]) {
                return profilesByUid[studentId];
            }


            // Normalized matching
            const normalizedStudentId =
                normalizeText(studentId);


            const profile = Object.values(
                profilesById
            ).find(
                (item) => {

                    return (
                        normalizeText(item.id) ===
                        normalizedStudentId
                    ) || (
                        normalizeText(item.uid) ===
                        normalizedStudentId
                    );
                }
            );


            if (profile) {
                return profile;
            }
        }


        return null;
    };


    // =====================================================
    // FETCH PLACEMENTS
    // =====================================================

    const fetchPlacements = async () => {

        try {

            setError("");


            if (placements.length === 0) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }


            // -------------------------------------------------
            // LOAD FIRESTORE COLLECTIONS
            // -------------------------------------------------

            const [
                usersSnapshot,
                jobsSnapshot,
                applicationsSnapshot,
                studentProfilesSnapshot,
                companiesSnapshot
            ] = await Promise.all([

                getDocs(
                    collection(db, "users")
                ),

                getDocs(
                    collection(db, "jobs")
                ),

                getDocs(
                    collection(db, "applications")
                ),

                getDocs(
                    collection(db, "studentProfiles")
                ),

                getDocs(
                    collection(db, "companies")
                )
            ]);


            // -------------------------------------------------
            // USERS
            // -------------------------------------------------

            const users =
                usersSnapshot.docs.map(
                    (document) => ({
                        id: document.id,
                        ...document.data()
                    })
                );


            // -------------------------------------------------
            // JOBS
            // -------------------------------------------------

            const jobs =
                jobsSnapshot.docs.map(
                    (document) => ({
                        id: document.id,
                        ...document.data()
                    })
                );


            // -------------------------------------------------
            // APPLICATIONS
            // -------------------------------------------------

            const applications =
                applicationsSnapshot.docs.map(
                    (document) => ({
                        id: document.id,
                        ...document.data()
                    })
                );


            // -------------------------------------------------
            // COMPANIES
            // -------------------------------------------------

            const companies =
                companiesSnapshot.docs.map(
                    (document) => ({
                        id: document.id,
                        ...document.data()
                    })
                );


            // -------------------------------------------------
            // STUDENT PROFILES
            // -------------------------------------------------

            const profilesById = {};
            const profilesByUid = {};


            studentProfilesSnapshot.docs.forEach(
                (document) => {

                    const data = document.data();

                    const profile = {
                        id: document.id,
                        ...data
                    };


                    profilesById[document.id] = profile;


                    if (data.uid) {
                        profilesByUid[data.uid] = profile;
                    }
                }
            );


            // -------------------------------------------------
            // ONLY PLACED APPLICATIONS
            //
            // accepted/selected is NOT enough.
            // -------------------------------------------------

            const placedApplications =
                applications.filter(
                    (application) => {

                        const status =
                            normalizeText(
                                application.status
                            );


                        return (
                            application.placedStudent === true ||
                            status === "placed"
                        );
                    }
                );


            // -------------------------------------------------
            // BUILD PLACEMENT RECORDS
            // -------------------------------------------------

            const placementRecords = [];


            for (
                const application
                of placedApplications
            ) {

                // =============================================
                // COMPANY MUST EXIST
                // =============================================

                const company =
                    findCompanyForRecord(
                        application,
                        companies
                    );


                if (!company) {
                    continue;
                }


                // =============================================
                // STUDENT PROFILE MUST EXIST
                // =============================================

                const studentProfile =
                    findStudentProfile(
                        application,
                        profilesById,
                        profilesByUid
                    );


                if (!studentProfile) {
                    continue;
                }


                // =============================================
                // FIND STUDENT IN USERS
                // =============================================

                const possibleStudentIds = [
                    application.studentId,
                    application.studentID,
                    application.uid,
                    application.userId,
                    application.userID
                ]
                    .filter(Boolean);


                const student =
                    users.find(
                        (user) => {

                            return possibleStudentIds.some(
                                (id) => {

                                    return (
                                        normalizeText(user.id) ===
                                        normalizeText(id)
                                    ) || (
                                        normalizeText(user.uid) ===
                                        normalizeText(id)
                                    );
                                }
                            );
                        }
                    );


                // =============================================
                // STUDENT NAME
                // =============================================

                const studentName =
                    getFirstValue(
                        studentProfile,
                        [
                            "studentName",
                            "name",
                            "fullName",
                            "displayName"
                        ],
                        getFirstValue(
                            student,
                            [
                                "studentName",
                                "name",
                                "fullName",
                                "displayName"
                            ],
                            application.studentName ||
                            application.name ||
                            "Unknown Student"
                        )
                    );


                // =============================================
                // STUDENT EMAIL
                // =============================================

                const studentEmail =
                    getFirstValue(
                        studentProfile,
                        [
                            "email",
                            "studentEmail",
                            "emailAddress"
                        ],
                        getFirstValue(
                            student,
                            [
                                "email",
                                "studentEmail",
                                "emailAddress"
                            ],
                            application.studentEmail ||
                            application.email ||
                            "No email"
                        )
                    );


                // =============================================
                // PROFILE PHOTO
                // =============================================

                const profilePhotoURL =
                    getProfilePhoto(
                        studentProfile
                    );


                // =============================================
                // STUDENT ID
                // =============================================

                const studentId =
                    application.studentId ||
                    application.studentID ||
                    application.uid ||
                    application.userId ||
                    application.userID ||
                    studentProfile.uid ||
                    studentProfile.id ||
                    null;


                // =============================================
                // COMPANY NAME
                // =============================================

                const companyName =
                    getFirstValue(
                        company,
                        [
                            "companyName",
                            "name",
                            "company",
                            "displayName",
                            "businessName"
                        ],
                        application.companyName ||
                        application.company ||
                        "Unknown Company"
                    );


                // =============================================
                // COMPANY ID
                // =============================================

                const companyId =
                    company.id ||
                    company.companyId ||
                    company.uid ||
                    application.companyId ||
                    application.companyID ||
                    null;


                // =============================================
                // JOB ID
                // =============================================

                const jobId =
                    application.jobId ||
                    application.jobID ||
                    "";


                // =============================================
                // FIND JOB
                // =============================================

                const job =
                    jobs.find(
                        (item) =>
                            normalizeText(item.id) ===
                            normalizeText(jobId)
                    );


                // =============================================
                // JOB TITLE
                // =============================================

                const jobTitle =
                    application.jobTitle ||
                    application.jobName ||
                    application.title ||
                    job?.jobTitle ||
                    job?.jobName ||
                    job?.title ||
                    job?.position ||
                    job?.role ||
                    "Unknown Job";


                // =============================================
                // LOCATION
                // =============================================

                const location =
                    application.location ||
                    application.jobLocation ||
                    job?.location ||
                    job?.jobLocation ||
                    "Not specified";


                // =============================================
                // PACKAGE
                // =============================================

                const packageValue =
                    application.salary ||
                    application.package ||
                    application.salaryPackage ||
                    application.ctc ||
                    job?.salary ||
                    job?.package ||
                    job?.salaryPackage ||
                    job?.ctc ||
                    "Not specified";


                // =============================================
                // PLACED DATE
                // =============================================

                const placedDate =
                    application.placedAt ||
                    application.placementDate ||
                    application.placedAtDate ||
                    application.statusUpdatedAt ||
                    application.updatedAt ||
                    application.createdAt ||
                    null;


                // =============================================
                // SELECTED DATE
                // =============================================

                const selectedDate =
                    application.selectedAt ||
                    application.statusUpdatedAt ||
                    application.updatedAt ||
                    application.appliedAt ||
                    application.createdAt ||
                    null;


                // =============================================
                // FINAL RECORD
                // =============================================

                placementRecords.push({

                    id: application.id,

                    ...application,

                    studentId,

                    studentName,

                    studentEmail,

                    profilePhotoURL,

                    studentInitials:
                        getStudentInitials(
                            studentName
                        ),

                    studentProfileId:
                        studentProfile.id,

                    companyId,

                    companyName,

                    companyData:
                        company,

                    jobId,

                    jobTitle,

                    jobData:
                        job || null,

                    location,

                    packageValue,

                    selectedDate,

                    placedDate,

                    isPlaced: true
                });
            }


            // -------------------------------------------------
            // SORT NEWEST FIRST
            // -------------------------------------------------

            placementRecords.sort(
                (a, b) => {

                    return (
                        getDateValue(b.placedDate) -
                        getDateValue(a.placedDate)
                    );
                }
            );


            // -------------------------------------------------
            // UPDATE STATE
            // -------------------------------------------------

            setPlacements(
                placementRecords
            );

            setLastUpdated(
                new Date()
            );


            console.log(
                "Valid placement records:",
                placementRecords
            );

        } catch (err) {

            console.error(
                "Error fetching placements:",
                err
            );

            setError(
                err?.message ||
                "Unable to load placement records."
            );

        } finally {

            setLoading(false);
            setRefreshing(false);
        }
    };


    // =====================================================
    // LOAD DATA ON PAGE LOAD
    // =====================================================

    useEffect(() => {

        fetchPlacements();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    // =====================================================
    // SEARCH
    // =====================================================

    const filteredPlacements = useMemo(
        () => {

            const searchText =
                search
                    .trim()
                    .toLowerCase();


            if (!searchText) {
                return placements;
            }


            return placements.filter(
                (placement) => {

                    const searchableText = [

                        placement.studentName,

                        placement.studentEmail,

                        placement.companyName,

                        placement.jobTitle,

                        placement.location,

                        placement.packageValue

                    ]
                        .map(
                            (value) =>
                                String(value || "")
                                    .toLowerCase()
                        )
                        .join(" ");


                    return searchableText.includes(
                        searchText
                    );
                }
            );

        },
        [
            placements,
            search
        ]
    );


    // =====================================================
    // STATISTICS
    // =====================================================

    const totalPlacements =
        placements.length;


    const placedStudentIds =
        new Set(
            placements
                .map(
                    (placement) =>
                        placement.studentId
                )
                .filter(Boolean)
        );


    const placedStudents =
        placedStudentIds.size ||
        placements.length;


    const companyIds =
        new Set(
            placements
                .map(
                    (placement) =>
                        placement.companyId ||
                        placement.companyName
                )
                .filter(Boolean)
        );


    const companiesCount =
        companyIds.size;


    const showing =
        filteredPlacements.length;


    // =====================================================
    // LOADING SCREEN
    // =====================================================

    if (loading) {

        return (
            <div className="placements-page">

                <div className="placements-loading">

                    <div className="loading-spinner"></div>

                    <h3>
                        Loading Placements...
                    </h3>

                    <p>
                        Fetching officially placed
                        students from Firestore.
                    </p>

                </div>

            </div>
        );
    }


    // =====================================================
    // PAGE
    // =====================================================

    return (

        <div className="placements-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="placements-header">

                <div className="placements-heading">

                    <span className="page-label">
                        PLACEMENT MANAGEMENT
                    </span>

                    <h1>
                        Placements
                    </h1>

                    <p>
                        Students officially placed
                        through campus recruitment.
                    </p>

                </div>


                <button
                    className="refresh-btn"
                    onClick={fetchPlacements}
                    disabled={refreshing}
                    type="button"
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

            </div>


            {/* =================================================
                LAST UPDATED
            ================================================= */}

            {lastUpdated && (

                <div className="last-updated">

                    <span className="live-dot"></span>

                    Live Firestore data

                    <span className="updated-separator">
                        •
                    </span>

                    Updated{" "}

                    {formatDateTime(
                        lastUpdated
                    )}

                </div>

            )}


            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="placement-stats">

                <div className="placement-stat-card">

                    <div className="stat-icon stat-icon-blue">
                        <FaCheckCircle />
                    </div>

                    <div className="stat-content">

                        <span className="stat-title">
                            Total Placements
                        </span>

                        <strong className="stat-value">
                            {totalPlacements}
                        </strong>

                        <small>
                            Officially placed
                        </small>

                    </div>

                </div>


                <div className="placement-stat-card">

                    <div className="stat-icon stat-icon-purple">
                        <FaBuilding />
                    </div>

                    <div className="stat-content">

                        <span className="stat-title">
                            Companies
                        </span>

                        <strong className="stat-value">
                            {companiesCount}
                        </strong>

                        <small>
                            Hiring companies
                        </small>

                    </div>

                </div>


                <div className="placement-stat-card">

                    <div className="stat-icon stat-icon-green">
                        <FaUserGraduate />
                    </div>

                    <div className="stat-content">

                        <span className="stat-title">
                            Placed Students
                        </span>

                        <strong className="stat-value">
                            {placedStudents}
                        </strong>

                        <small>
                            Unique students
                        </small>

                    </div>

                </div>


                <div className="placement-stat-card">

                    <div className="stat-icon stat-icon-orange">
                        <FaBriefcase />
                    </div>

                    <div className="stat-content">

                        <span className="stat-title">
                            Showing
                        </span>

                        <strong className="stat-value">
                            {showing}
                        </strong>

                        <small>
                            Matching records
                        </small>

                    </div>

                </div>

            </div>


            {/* =================================================
                MAIN CARD
            ================================================= */}

            <div className="placements-card">

                {/* =================================================
                    CARD HEADER
                ================================================= */}

                <div className="placements-card-header">

                    <div>

                        <div className="card-title-row">

                            <h2>
                                Placement Records
                            </h2>

                            <span className="live-badge">
                                <span></span>
                                LIVE
                            </span>

                        </div>

                        <p>
                            Only students marked as
                            officially placed are shown here.
                        </p>

                    </div>


                    <span className="record-count">

                        {showing}{" "}

                        {showing === 1
                            ? "Record"
                            : "Records"
                        }

                    </span>

                </div>


                {/* =================================================
                    SEARCH
                ================================================= */}

                <div className="placements-toolbar">

                    <div className="placements-search">

                        <FaSearch
                            className="search-icon"
                        />

                        <input
                            type="text"
                            placeholder="Search student, company, job, location..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />

                        {search && (

                            <button
                                className="clear-search"
                                onClick={() =>
                                    setSearch("")
                                }
                                type="button"
                            >
                                ×
                            </button>

                        )}

                    </div>


                    {search && (

                        <div className="search-result-text">

                            Showing{" "}

                            <strong>
                                {showing}
                            </strong>

                            {" "}of{" "}

                            <strong>
                                {totalPlacements}
                            </strong>

                            {" "}placements

                        </div>

                    )}

                </div>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <div className="placements-message error-message">

                        <div className="message-icon">
                            ⚠️
                        </div>

                        <h3>
                            Unable to load placements
                        </h3>

                        <p>
                            {error}
                        </p>

                        <button
                            className="retry-btn"
                            onClick={fetchPlacements}
                            type="button"
                        >
                            Try Again
                        </button>

                    </div>

                )}


                {/* =================================================
                    NO PLACEMENTS
                ================================================= */}

                {!error &&
                placements.length === 0 && (

                    <div className="placements-message">

                        <div className="message-icon">
                            <FaGraduationCap />
                        </div>

                        <h3>
                            No Placements Yet
                        </h3>

                        <p>
                            Students who are selected
                            are not automatically considered
                            placed. Once the company marks
                            a student as placed, the record
                            will appear here.
                        </p>

                    </div>

                )}


                {/* =================================================
                    NO SEARCH RESULTS
                ================================================= */}

                {!error &&
                placements.length > 0 &&
                filteredPlacements.length === 0 && (

                    <div className="placements-message">

                        <div className="message-icon">
                            <FaSearch />
                        </div>

                        <h3>
                            No Matching Placements
                        </h3>

                        <p>
                            Try searching for a different
                            student, company, job or location.
                        </p>

                        <button
                            className="retry-btn secondary-btn"
                            onClick={() =>
                                setSearch("")
                            }
                            type="button"
                        >
                            Clear Search
                        </button>

                    </div>

                )}


                {/* =================================================
                    TABLE
                ================================================= */}

                {!error &&
                filteredPlacements.length > 0 && (

                    <div className="placements-table-wrapper">

                        <table className="placements-table">

                            <thead>

                                <tr>

                                    <th>
                                        Student
                                    </th>

                                    <th>
                                        Company
                                    </th>

                                    <th>
                                        Job Role
                                    </th>

                                    <th>
                                        Location
                                    </th>

                                    <th>
                                        Package
                                    </th>

                                    <th>
                                        Placed Date
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {filteredPlacements.map(
                                    (placement) => (

                                        <tr
                                            key={
                                                placement.id
                                            }
                                        >

                                            {/* STUDENT */}

                                            <td className="student-table-cell">

                                                <div className="student-info">

                                                    <div className="student-avatar">

                                                        {placement.profilePhotoURL && (

                                                            <img
                                                                src={
                                                                    placement.profilePhotoURL
                                                                }
                                                                alt={
                                                                    placement.studentName
                                                                }
                                                                className="student-avatar-image"
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

                                                        )}

                                                        <span
                                                            className="student-avatar-fallback"
                                                            style={{
                                                                display:
                                                                    placement.profilePhotoURL
                                                                        ? "none"
                                                                        : "flex"
                                                            }}
                                                        >
                                                            {
                                                                placement.studentInitials
                                                            }
                                                        </span>

                                                    </div>


                                                    <div className="student-details">

                                                        <strong
                                                            title={
                                                                placement.studentName
                                                            }
                                                        >
                                                            {
                                                                placement.studentName
                                                            }
                                                        </strong>

                                                        <span
                                                            title={
                                                                placement.studentEmail
                                                            }
                                                        >
                                                            {
                                                                placement.studentEmail
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* COMPANY */}

                                            <td>

                                                <div className="company-cell">

                                                    <div className="company-mini-icon">
                                                        <FaBuilding />
                                                    </div>

                                                    <span
                                                        className="table-primary-text"
                                                        title={
                                                            placement.companyName
                                                        }
                                                    >
                                                        {
                                                            placement.companyName
                                                        }
                                                    </span>

                                                </div>

                                            </td>


                                            {/* JOB ROLE */}

                                            <td>

                                                <span
                                                    className="job-cell"
                                                    title={
                                                        placement.jobTitle
                                                    }
                                                >

                                                    <FaBriefcase />

                                                    {
                                                        placement.jobTitle
                                                    }

                                                </span>

                                            </td>


                                            {/* LOCATION */}

                                            <td>

                                                <span
                                                    className="location-cell"
                                                    title={
                                                        placement.location
                                                    }
                                                >

                                                    <FaMapMarkerAlt />

                                                    {
                                                        placement.location
                                                    }

                                                </span>

                                            </td>


                                            {/* PACKAGE */}

                                            <td>

                                                <span className="package-value">

                                                    {
                                                        placement.packageValue
                                                    }

                                                </span>

                                            </td>


                                            {/* PLACED DATE */}

                                            <td>

                                                <span className="date-value">

                                                    {
                                                        formatDate(
                                                            placement.placedDate
                                                        )
                                                    }

                                                </span>

                                            </td>


                                            {/* STATUS */}

                                            <td>

                                                <span className="placement-status">

                                                    <span className="status-dot"></span>

                                                    Placed

                                                </span>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </div>
    );
}

export default Placements;