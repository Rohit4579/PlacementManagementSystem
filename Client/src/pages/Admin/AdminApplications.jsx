
import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    writeBatch
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
    FaFileAlt,
    FaTrash
} from "react-icons/fa";

import { db } from "../../firebase/firebaseConfig";

import "./AdminApplications.css";


/*
 * IMPORTANT
 *
 * If your actual company collection has a different name,
 * change COMPANY_COLLECTIONS below.
 *
 * The same applies to JOB_COLLECTIONS.
 */

const COMPANY_COLLECTIONS = [
    "companies",
    "companyProfiles"
];

const JOB_COLLECTIONS = [
    "jobs",
    "jobPosts",
    "jobOpportunities"
];


function Applications() {

    /* =====================================================
       STATES
    ===================================================== */

    const [applications, setApplications] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [deletingId, setDeletingId] =
        useState(null);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("all");


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

            const value =
                profile[field];

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
       NORMALIZE
    ===================================================== */

    const normalize = (
        value
    ) => {

        if (
            value === undefined ||
            value === null
        ) {

            return "";

        }

        return String(value).trim();

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
       DATE VALUE
    ===================================================== */

    const getDateTime = (
        value
    ) => {

        if (!value) {
            return 0;
        }

        try {

            if (
                value &&
                typeof value.toDate ===
                    "function"
            ) {

                return value
                    .toDate()
                    .getTime();

            }

            const date =
                new Date(value);

            if (
                isNaN(
                    date.getTime()
                )
            ) {

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

    const formatDate = (
        value
    ) => {

        if (!value) {
            return "Not Available";
        }

        try {

            if (
                value &&
                typeof value.toDate ===
                    "function"
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

            const date =
                new Date(value);

            if (
                isNaN(
                    date.getTime()
                )
            ) {

                return "Not Available";

            }

            return date
                .toLocaleDateString(
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

    const getStatus = (
        application
    ) => {

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


        if (
            status === "rejected"
        ) {

            return "rejected";

        }


        if (
            status === "placed"
        ) {

            return "placed";

        }


        return "pending";

    };


    /* =====================================================
       STATUS LABEL
    ===================================================== */

    const getStatusLabel = (
        status
    ) => {

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
       GET RELATION ID
    ===================================================== */

    const getStudentIds = (
        application
    ) => {

        return [

            application?.studentId,
            application?.uid,
            application?.userId,
            application?.studentUid,
            application?.studentUID,
            application?.studentProfileId

        ]
            .map(normalize)
            .filter(Boolean);

    };


    const getCompanyIds = (
        application
    ) => {

        return [

            application?.companyId,
            application?.companyID,
            application?.companyUid,
            application?.companyUID,
            application?.employerId,
            application?.employerID

        ]
            .map(normalize)
            .filter(Boolean);

    };


    const getJobIds = (
        application
    ) => {

        return [

            application?.jobId,
            application?.jobID,
            application?.jobUid,
            application?.jobUID,
            application?.jobPostId,
            application?.jobPostID,
            application?.opportunityId,
            application?.opportunityID

        ]
            .map(normalize)
            .filter(Boolean);

    };


    /* =====================================================
       FETCH EXISTING RELATED RECORDS
    ===================================================== */

    const fetchExistingRecords = async (
        collectionNames
    ) => {

        const records = [];

        for (
            const collectionName
            of collectionNames
        ) {

            try {

                const snapshot =
                    await getDocs(
                        collection(
                            db,
                            collectionName
                        )
                    );


                snapshot.docs.forEach(
                    (recordDoc) => {

                        records.push({

                            id:
                                recordDoc.id,

                            data:
                                recordDoc.data() ||
                                {},

                            collectionName

                        });

                    }
                );

            }

            catch (collectionError) {

                /*
                 * A collection may not exist in this
                 * project. Ignore that collection and
                 * continue checking the others.
                 */

                console.warn(
                    `Unable to read ${collectionName}:`,
                    collectionError
                );

            }

        }

        return records;

    };


    /* =====================================================
       CHECK APPLICATION RELATIONSHIPS
    ===================================================== */

    const isApplicationValid = (
        application,
        existingStudents,
        existingCompanies,
        existingJobs
    ) => {

        /* -------------------------------------------------
           STUDENT CHECK
        ------------------------------------------------- */

        const studentIds =
            getStudentIds(
                application
            );


        if (
            studentIds.length > 0
        ) {

            const studentExists =
                existingStudents.some(
                    (student) => {

                        const studentData =
                            student.data ||
                            {};


                        const identifiers = [

                            student.id,
                            studentData.uid

                        ]
                            .map(normalize)
                            .filter(Boolean);


                        return identifiers.some(
                            (identifier) =>
                                studentIds.includes(
                                    identifier
                                )
                        );

                    }
                );


            if (
                !studentExists
            ) {

                return false;

            }

        }


        /* -------------------------------------------------
           COMPANY CHECK
           
           Only perform this check when the application
           actually contains a company ID.
           
           This avoids incorrectly deleting/hiding old
           applications that only contain companyName.
        ------------------------------------------------- */

        const companyIds =
            getCompanyIds(
                application
            );


        if (
            companyIds.length > 0
        ) {

            const companyExists =
                existingCompanies.some(
                    (company) => {

                        const companyData =
                            company.data ||
                            {};


                        const identifiers = [

                            company.id,

                            companyData.uid,
                            companyData.companyId,
                            companyData.companyID

                        ]
                            .map(normalize)
                            .filter(Boolean);


                        return identifiers.some(
                            (identifier) =>
                                companyIds.includes(
                                    identifier
                                )
                        );

                    }
                );


            if (
                !companyExists
            ) {

                return false;

            }

        }


        /* -------------------------------------------------
           JOB CHECK
           
           If the application contains a job ID and that
           job no longer exists, the application is stale.
        ------------------------------------------------- */

        const jobIds =
            getJobIds(
                application
            );


        if (
            jobIds.length > 0
        ) {

            const jobExists =
                existingJobs.some(
                    (job) => {

                        const jobData =
                            job.data ||
                            {};


                        const identifiers = [

                            job.id,

                            jobData.uid,
                            jobData.jobId,
                            jobData.jobID

                        ]
                            .map(normalize)
                            .filter(Boolean);


                        return identifiers.some(
                            (identifier) =>
                                jobIds.includes(
                                    identifier
                                )
                        );

                    }
                );


            if (
                !jobExists
            ) {

                return false;

            }

        }


        return true;

    };


    /* =====================================================
       LOAD APPLICATIONS
    ===================================================== */

    useEffect(() => {

        fetchApplications();

    }, []);


    /* =====================================================
       FETCH APPLICATIONS
    ===================================================== */

    const fetchApplications =
        async () => {

            try {

                setError("");

                setLoading(true);


                /* =========================================
                   1. APPLICATIONS
                ========================================= */

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

                            id:
                                document.id,

                            ...document.data()

                        })
                    );


                /* =========================================
                   2. STUDENT PROFILES
                ========================================= */

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
                            document.data() ||
                            {};


                        profilesById[
                            document.id
                        ] = {

                            id:
                                document.id,

                            ...profile

                        };


                        if (
                            profile.uid
                        ) {

                            profilesByUid[
                                profile.uid
                            ] = {

                                id:
                                    document.id,

                                ...profile

                            };

                        }

                    }
                );


                /* =========================================
                   3. USERS
                   
                   Used to make sure applications belonging
                   to deleted students are not displayed,
                   even if a stale application document
                   somehow remains.
                ========================================= */

                const usersSnapshot =
                    await getDocs(
                        collection(
                            db,
                            "users"
                        )
                    );


                const existingStudents =
                    usersSnapshot.docs
                        .filter(
                            (studentDoc) => {

                                const data =
                                    studentDoc.data() ||
                                    {};

                                const role =
                                    normalize(
                                        data.role
                                    ).toLowerCase();

                                return (
                                    !role ||
                                    role === "student"
                                );

                            }
                        )
                        .map(
                            (studentDoc) => ({

                                id:
                                    studentDoc.id,

                                data:
                                    studentDoc.data() ||
                                    {}

                            })
                        );


                /* =========================================
                   4. COMPANIES
                ========================================= */

                const existingCompanies =
                    await fetchExistingRecords(
                        COMPANY_COLLECTIONS
                    );


                /* =========================================
                   5. JOBS
                ========================================= */

                const existingJobs =
                    await fetchExistingRecords(
                        JOB_COLLECTIONS
                    );


                /* =========================================
                   6. FIND STUDENT PROFILE
                ========================================= */

                const findStudentProfile =
                    (
                        application
                    ) => {

                        const studentIds =
                            getStudentIds(
                                application
                            );


                        for (
                            const studentId
                            of studentIds
                        ) {

                            if (
                                profilesById[
                                    studentId
                                ]
                            ) {

                                return profilesById[
                                    studentId
                                ];

                            }


                            if (
                                profilesByUid[
                                    studentId
                                ]
                            ) {

                                return profilesByUid[
                                    studentId
                                ];

                            }

                        }


                        return null;

                    };


                /* =========================================
                   7. FILTER ORPHANED APPLICATIONS
                ========================================= */

                const validApplications =
                    applicationList.filter(
                        (application) =>
                            isApplicationValid(
                                application,
                                existingStudents,
                                existingCompanies,
                                existingJobs
                            )
                    );


                /* =========================================
                   8. MERGE PROFILE DATA
                ========================================= */

                const mergedApplications =
                    validApplications.map(
                        (application) => {

                            const profile =
                                findStudentProfile(
                                    application
                                );


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


                            const profilePhoto =
                                getProfilePhoto(
                                    profile,
                                    application
                                );


                            const jobTitle =
                                application.jobTitle ||
                                application.jobName ||
                                application.title ||
                                "Job Not Available";


                            const companyName =
                                application.companyName ||
                                application.company ||
                                "Company";


                            const status =
                                getStatus(
                                    application
                                );


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
                                    profile?.id ||
                                    null,

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


                /* =========================================
                   9. SORT
                ========================================= */

                mergedApplications.sort(
                    (a, b) =>
                        getDateTime(
                            b.appliedAt
                        ) -
                        getDateTime(
                            a.appliedAt
                        )
                );


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
       DELETE SINGLE APPLICATION
    ===================================================== */

    const deleteApplication =
        async (
            application
        ) => {

            if (
                !application?.id
            ) {

                return;

            }


            const confirmed =
                window.confirm(

                    `Are you sure you want to delete the application of ` +
                    `${application.studentName || "this student"}?\n\n` +

                    `Job: ${application.jobTitle || "Job Not Available"}\n` +

                    `Company: ${application.companyName || "Company"}\n\n` +

                    "This application will be permanently deleted."

                );


            if (!confirmed) {

                return;

            }


            try {

                setDeletingId(
                    application.id
                );


                await deleteDoc(
                    doc(
                        db,
                        "applications",
                        application.id
                    )
                );


                setApplications(
                    previous =>
                        previous.filter(
                            item =>
                                item.id !==
                                application.id
                        )
                );


                alert(
                    "Application deleted successfully."
                );

            }

            catch (error) {

                console.error(
                    "Delete application error:",
                    error
                );

                alert(
                    "Unable to delete this application. " +
                    "Please check your Firebase permissions."
                );

            }

            finally {

                setDeletingId(
                    null
                );

            }

        };


    /* =====================================================
       REFRESH
    ===================================================== */

    const handleRefresh =
        async () => {

            try {

                setRefreshing(true);

                await fetchApplications();

            }

            finally {

                setRefreshing(false);

            }

        };


    /* =====================================================
       FILTER
    ===================================================== */

    const filteredApplications =
        useMemo(
            () => {

                const searchText =
                    search
                        .trim()
                        .toLowerCase();


                return applications.filter(
                    (application) => {

                        if (
                            statusFilter !== "all" &&
                            application.status !==
                                statusFilter
                        ) {

                            return false;

                        }


                        if (
                            !searchText
                        ) {

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

            },
            [
                applications,
                search,
                statusFilter
            ]
        );


    /* =====================================================
       STATISTICS
    ===================================================== */

    const totalCount =
        applications.length;


    const pendingCount =
        applications.filter(
            application =>
                application.status ===
                "pending"
        ).length;


    const acceptedCount =
        applications.filter(
            application =>
                application.status ===
                "accepted"
        ).length;


    const rejectedCount =
        applications.filter(
            application =>
                application.status ===
                "rejected"
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
                    part =>
                        part.charAt(0)
                )
                .join("")
                .toUpperCase();


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
                        Checking student, company and job records...
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
                        onClick={
                            fetchApplications
                        }
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

            <section className="applications-header">

                <div>

                    <span className="page-label">
                        APPLICATION MANAGEMENT
                    </span>

                    <h1>
                        Student Applications
                    </h1>

                    <p>
                        View all valid student applications
                        for company job opportunities.
                    </p>

                </div>


                <button
                    type="button"
                    className="refresh-button"
                    onClick={
                        handleRefresh
                    }
                    disabled={
                        refreshing
                    }
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


            <section className="applications-toolbar">

                <div className="search-container">

                    <FaSearch className="search-icon" />

                    <input
                        type="text"
                        placeholder="Search student, job, company, college..."
                        value={
                            search
                        }
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                    />

                </div>


                <select
                    value={
                        statusFilter
                    }
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
                            No valid student applications
                            match your current search or filter.
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

                                    <th>
                                        Action
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


                                            <td>

                                                <span className="company-name">

                                                    <FaBuilding />

                                                    {
                                                        application.companyName
                                                    }

                                                </span>

                                            </td>


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


                                            <td>

                                                <button
                                                    type="button"
                                                    className="application-delete-button"
                                                    disabled={
                                                        deletingId ===
                                                        application.id
                                                    }
                                                    onClick={() =>
                                                        deleteApplication(
                                                            application
                                                        )
                                                    }
                                                    title="Delete application"
                                                >

                                                    <FaTrash />

                                                    <span>

                                                        {deletingId ===
                                                        application.id
                                                            ? "Deleting..."
                                                            : "Delete"}

                                                    </span>

                                                </button>

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
