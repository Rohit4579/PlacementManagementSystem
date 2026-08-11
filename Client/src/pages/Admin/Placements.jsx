import {
    useEffect,
    useMemo,
    useState
} from "react";

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


/* =========================================================
   PLACEMENTS PAGE
========================================================= */

function Placements() {

    /* =====================================================
       STATES
    ===================================================== */

    const [placements, setPlacements] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [lastUpdated, setLastUpdated] =
        useState(null);


    /* =====================================================
       LOAD DATA
    ===================================================== */

    useEffect(() => {

        fetchPlacements();

    }, []);


    /* =====================================================
       GET FIRST AVAILABLE VALUE
    ===================================================== */

    const getFirstValue = (
        profile,
        fields,
        fallback = ""
    ) => {

        for (const field of fields) {

            const value =
                profile?.[field];

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
       GET STUDENT INITIALS
       
       Example:
       Rohit Thorat -> RT
       Rahul -> RA
       Unknown Student -> US
    ===================================================== */

    const getStudentInitials = (name) => {

        const cleanName =
            String(name || "")
                .trim()
                .replace(/\s+/g, " ");


        if (!cleanName) {

            return "ST";

        }


        const parts =
            cleanName
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


    /* =====================================================
       DATE VALUE
    ===================================================== */

    const getDateValue = (value) => {

        if (!value) {

            return 0;

        }


        /* Firebase Timestamp */

        if (
            value &&
            typeof value.toDate === "function"
        ) {

            return value
                .toDate()
                .getTime();

        }


        /* Firestore timestamp object */

        if (
            typeof value === "object" &&
            value.seconds !== undefined
        ) {

            return Number(value.seconds) * 1000;

        }


        const date =
            new Date(value);


        return isNaN(date.getTime())
            ? 0
            : date.getTime();

    };


    /* =====================================================
       FORMAT DATE
    ===================================================== */

    const formatDate = (value) => {

        const timestamp =
            getDateValue(value);


        if (!timestamp) {

            return "—";

        }


        return new Date(
            timestamp
        ).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    };


    /* =====================================================
       FORMAT DATE + TIME
    ===================================================== */

    const formatDateTime = (value) => {

        const timestamp =
            getDateValue(value);


        if (!timestamp) {

            return "Not available";

        }


        return new Date(
            timestamp
        ).toLocaleString(
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


    /* =====================================================
       FETCH PLACEMENTS
       
       ALSO FETCH:
       studentProfiles
       
       PROFILE PHOTO:
       studentProfiles/{studentId}
========================================================= */

    const fetchPlacements = async () => {

        try {

            setError("");


            if (placements.length === 0) {

                setLoading(true);

            }
            else {

                setRefreshing(true);

            }


            /* =================================================
               LOAD COLLECTIONS
            ================================================= */

            const [
                usersSnapshot,
                jobsSnapshot,
                applicationsSnapshot,
                studentProfilesSnapshot
            ] = await Promise.all([

                getDocs(
                    collection(
                        db,
                        "users"
                    )
                ),

                getDocs(
                    collection(
                        db,
                        "jobs"
                    )
                ),

                getDocs(
                    collection(
                        db,
                        "applications"
                    )
                ),

                /*
                 * NEW:
                 * Fetch student profiles so the placement
                 * table can display the student's profile photo.
                 */
                getDocs(
                    collection(
                        db,
                        "studentProfiles"
                    )
                )

            ]);


            /* =================================================
               USERS
            ================================================= */

            const users =
                usersSnapshot.docs.map(
                    (document) => ({

                        id:
                            document.id,

                        ...document.data()

                    })
                );


            /* =================================================
               JOBS
            ================================================= */

            const jobs =
                jobsSnapshot.docs.map(
                    (document) => ({

                        id:
                            document.id,

                        ...document.data()

                    })
                );


            /* =================================================
               APPLICATIONS
            ================================================= */

            const applications =
                applicationsSnapshot.docs.map(
                    (document) => ({

                        id:
                            document.id,

                        ...document.data()

                    })
                );


            /* =================================================
               STUDENT PROFILES
               
               Map by UID / document ID.
               
               Your StudentProfile page saves the profile as:
               
               studentProfiles/{user.uid}
            ================================================= */

            const studentProfiles =
                studentProfilesSnapshot.docs.reduce(
                    (profileMap, document) => {

                        const data =
                            document.data();


                        const profileUid =
                            data.uid ||
                            document.id;


                        profileMap[
                            profileUid
                        ] = {

                            id:
                                document.id,

                            ...data

                        };


                        return profileMap;

                    },
                    {}
                );


            /* =================================================
               ONLY ACTUALLY PLACED STUDENTS
               
               DO NOT USE accepted HERE.
            ================================================= */

            const placedApplications =
                applications.filter(
                    (application) => {

                        const status =
                            String(
                                application.status ||
                                ""
                            )
                                .trim()
                                .toLowerCase();


                        const isPlaced =
                            application.placedStudent === true ||
                            status === "placed";


                        return isPlaced;

                    }
                );


            /* =================================================
               BUILD PLACEMENT RECORDS
            ================================================= */

            const placementRecords =
                placedApplications.map(
                    (application) => {


                        /* =====================================
                           STUDENT
                        ===================================== */

                        const student =
                            users.find(
                                (user) =>
                                    user.id ===
                                    application.studentId
                            );


                        const studentName =
                            application.studentName ||
                            application.name ||
                            application.student ||
                            student?.studentName ||
                            student?.name ||
                            student?.fullName ||
                            student?.displayName ||
                            (
                                student?.firstName
                                    ? `${student.firstName} ${
                                        student.lastName || ""
                                    }`
                                    : ""
                            ).trim() ||
                            "Unknown Student";


                        const studentEmail =
                            application.studentEmail ||
                            application.email ||
                            student?.email ||
                            "No email";


                        /* =====================================
                           STUDENT PROFILE
                           
                           IMPORTANT:
                           studentProfiles/{studentId}
                        ===================================== */

                        const studentProfile =
                            studentProfiles[
                                application.studentId
                            ] || {};


                        /*
                         * Profile photo saved by StudentProfile.jsx
                         */
                        const profilePhotoURL =
                            getFirstValue(
                                studentProfile,
                                [
                                    "profilePhotoURL",
                                    "photoURL",
                                    "photoUrl",
                                    "profilePhoto",
                                    "imageURL",
                                    "imageUrl"
                                ],
                                ""
                            );


                        /* =====================================
                           COMPANY
                        ===================================== */

                        const company =
                            users.find(
                                (user) =>
                                    user.id ===
                                    application.companyId
                            );


                        const companyName =
                            application.companyName ||
                            application.company ||
                            company?.companyName ||
                            company?.name ||
                            company?.fullName ||
                            "Unknown Company";


                        /* =====================================
                           JOB
                        ===================================== */

                        const applicationJobId =
                            application.jobId ||
                            application.jobID ||
                            "";


                        const job =
                            jobs.find(
                                (item) =>
                                    item.id ===
                                    applicationJobId
                            );


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


                        /* =====================================
                           LOCATION
                        ===================================== */

                        const location =
                            application.location ||
                            application.jobLocation ||
                            job?.location ||
                            job?.jobLocation ||
                            "Not specified";


                        /* =====================================
                           PACKAGE
                        ===================================== */

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


                        /* =====================================
                           PLACED DATE
                        ===================================== */

                        const placedDate =
                            application.placedAt ||
                            application.placementDate ||
                            application.placedAtDate ||
                            application.statusUpdatedAt ||
                            application.updatedAt ||
                            application.createdAt ||
                            null;


                        /* =====================================
                           SELECTED DATE
                        ===================================== */

                        const selectedDate =
                            application.selectedAt ||
                            application.statusUpdatedAt ||
                            application.updatedAt ||
                            application.appliedAt ||
                            application.createdAt ||
                            null;


                        return {

                            id:
                                application.id,

                            ...application,

                            studentName,

                            studentEmail,

                            profilePhotoURL,

                            studentInitials:
                                getStudentInitials(
                                    studentName
                                ),

                            companyName,

                            jobTitle,

                            location,

                            packageValue,

                            selectedDate,

                            placedDate,

                            isPlaced: true

                        };

                    }
                );


            /* =================================================
               SORT NEWEST PLACEMENTS FIRST
            ================================================= */

            placementRecords.sort(
                (a, b) => {

                    return (
                        getDateValue(
                            b.placedDate
                        ) -
                        getDateValue(
                            a.placedDate
                        )
                    );

                }
            );


            setPlacements(
                placementRecords
            );


            setLastUpdated(
                new Date()
            );

        }

        catch (err) {

            console.error(
                "Error fetching placements:",
                err
            );


            setError(
                "Unable to load placement records."
            );

        }

        finally {

            setLoading(false);

            setRefreshing(false);

        }

    };


    /* =====================================================
       SEARCH
    ===================================================== */

    const filteredPlacements =
        useMemo(
            () => {

                const searchText =
                    search
                        .toLowerCase()
                        .trim();


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
                                value =>
                                    String(
                                        value || ""
                                    )
                                        .toLowerCase()
                            )
                            .join(" ");


                        return searchableText
                            .includes(
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


    /* =====================================================
       STATISTICS
    ===================================================== */

    const totalPlacements =
        placements.length;


    const selectedStudentIds =
        new Set(
            placements
                .map(
                    placement =>
                        placement.studentId
                )
                .filter(Boolean)
        );


    const placedStudents =
        selectedStudentIds.size ||
        placements.length;


    const companies =
        new Set(
            placements.map(
                placement =>
                    placement.companyId ||
                    placement.companyName
            )
        ).size;


    const showing =
        filteredPlacements.length;


    /* =====================================================
       LOADING
    ===================================================== */

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


    /* =====================================================
       PAGE
    ===================================================== */

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
                    onClick={
                        fetchPlacements
                    }
                    disabled={
                        refreshing
                    }
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
                            {companies}
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

                        {showing}

                        {" "}

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
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
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
                            onClick={
                                fetchPlacements
                            }
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


                                            {/* =================================
                                                STUDENT
                                            ================================= */}

                                            <td className="student-table-cell">

                                                <div className="student-info">


                                                    {/* PROFILE AVATAR */}

                                                    <div className="student-avatar">

                                                        {placement.profilePhotoURL ? (

                                                            <img
                                                                src={
                                                                    placement.profilePhotoURL
                                                                }
                                                                alt={
                                                                    placement.studentName
                                                                }
                                                                className="student-avatar-image"
                                                                onError={(e) => {

                                                                    /*
                                                                     * If Cloudinary/image URL
                                                                     * is broken, hide image and
                                                                     * show initials.
                                                                     */

                                                                    e.currentTarget.style.display =
                                                                        "none";

                                                                    const fallback =
                                                                        e.currentTarget
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

                                                        ) : null}


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


                                                    {/* STUDENT TEXT */}

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


                                            {/* =================================
                                                COMPANY
                                            ================================= */}

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


                                            {/* =================================
                                                JOB
                                            ================================= */}

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


                                            {/* =================================
                                                LOCATION
                                            ================================= */}

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


                                            {/* =================================
                                                PACKAGE
                                            ================================= */}

                                            <td>

                                                <span className="package-value">

                                                    {
                                                        placement.packageValue
                                                    }

                                                </span>

                                            </td>


                                            {/* =================================
                                                DATE
                                            ================================= */}

                                            <td>

                                                <span className="date-value">

                                                    {
                                                        formatDate(
                                                            placement.placedDate
                                                        )
                                                    }

                                                </span>

                                            </td>


                                            {/* =================================
                                                STATUS
                                            ================================= */}

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