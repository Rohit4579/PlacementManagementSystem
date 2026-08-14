import { useEffect, useState } from "react";

import {
    collection,
    onSnapshot
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
       NORMALIZE TEXT
    ===================================================== */

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
            return String(profilePhoto).trim();
        }


        const applicationPhoto =
            getFirstValue(
                application,
                photoFields,
                ""
            );


        if (applicationPhoto) {
            return String(applicationPhoto).trim();
        }


        return "";

    };


    /* =====================================================
       DATE FORMAT
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

        } catch {

            return "Not Available";

        }

    };


    /* =====================================================
       DATE TIME
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

        } catch {

            return 0;

        }

    };


    /* =====================================================
       FIND COMPANY FOR RECORD
       
       COMPANY MUST STILL EXIST.

       Matching order:
       1. Company ID
       2. Company email
       3. Company name

       IMPORTANT:
       record.email IS NOT USED because it may
       belong to the student.
    ===================================================== */

    const findCompanyForRecord = (
        record,
        companies
    ) => {

        if (
            !record ||
            !companies ||
            companies.length === 0
        ) {
            return null;
        }


        /* =================================================
           COMPANY ID VALUES
        ================================================= */

        const companyIdValues = [

            record.companyId,
            record.companyID,

            record.companyUid,
            record.companyUID,

            record.companyUserId,
            record.companyUserID,

            record.employerId,
            record.employerID,

            record.recruiterId,
            record.recruiterID

        ]
            .filter(
                value =>
                    value !== undefined &&
                    value !== null &&
                    String(value).trim() !== ""
            )
            .map(normalizeText);


        /* =================================================
           COMPANY EMAIL VALUES

           DO NOT USE record.email
        ================================================= */

        const companyEmailValues = [

            record.companyEmail,

            record.recruiterEmail,

            record.employerEmail

        ]
            .filter(
                value =>
                    value !== undefined &&
                    value !== null &&
                    String(value).trim() !== ""
            )
            .map(normalizeText);


        /* =================================================
           COMPANY NAME VALUES
        ================================================= */

        const companyNameValues = [

            record.companyName,

            record.company,

            record.employerName,

            record.recruiterName

        ]
            .filter(
                value =>
                    value !== undefined &&
                    value !== null &&
                    String(value).trim() !== ""
            )
            .map(normalizeText);


        /* =================================================
           FIRST: COMPANY ID
        ================================================= */

        if (companyIdValues.length > 0) {

            const companyById =
                companies.find(
                    (company) => {

                        const companyDocumentId =
                            normalizeText(
                                company.id
                            );

                        const companyUid =
                            normalizeText(
                                company.uid
                            );

                        const companyUserId =
                            normalizeText(
                                company.userId
                            );

                        const companyCompanyId =
                            normalizeText(
                                company.companyId
                            );

                        return (

                            companyIdValues.includes(
                                companyDocumentId
                            ) ||

                            companyIdValues.includes(
                                companyUid
                            ) ||

                            companyIdValues.includes(
                                companyUserId
                            ) ||

                            companyIdValues.includes(
                                companyCompanyId
                            )

                        );

                    }
                );


            if (companyById) {
                return companyById;
            }

        }


        /* =================================================
           SECOND: COMPANY EMAIL
        ================================================= */

        if (companyEmailValues.length > 0) {

            const companyByEmail =
                companies.find(
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
                            email =>
                                companyEmailValues.includes(
                                    email
                                )
                        );

                    }
                );


            if (companyByEmail) {
                return companyByEmail;
            }

        }


        /* =================================================
           THIRD: COMPANY NAME
        ================================================= */

        if (companyNameValues.length > 0) {

            const companyByName =
                companies.find(
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
                            name =>
                                companyNameValues.includes(
                                    name
                                )
                        );

                    }
                );


            if (companyByName) {
                return companyByName;
            }

        }


        /* =================================================
           COMPANY DOES NOT EXIST
        ================================================= */

        return null;

    };


    /* =====================================================
       REALTIME DASHBOARD
    ===================================================== */

    useEffect(() => {

        let jobsData = [];

        let applicationsData = [];

        let profilesData = [];

        let companiesData = [];


        let jobsLoaded = false;

        let applicationsLoaded = false;

        let profilesLoaded = false;

        let companiesLoaded = false;


        /* =================================================
           PROCESS DASHBOARD
        ================================================= */

        const processDashboard = () => {

            try {

                /* =========================================
                   WAIT UNTIL ALL COLLECTIONS LOAD
                ========================================= */

                if (
                    !jobsLoaded ||
                    !applicationsLoaded ||
                    !profilesLoaded ||
                    !companiesLoaded
                ) {
                    return;
                }


                /* =========================================
                   BUILD PROFILE MAPS
                ========================================= */

                const profilesById = {};

                const profilesByUid = {};


                profilesData.forEach(
                    (profile) => {

                        profilesById[
                            normalizeText(profile.id)
                        ] = profile;


                        if (profile.uid) {

                            profilesByUid[
                                normalizeText(profile.uid)
                            ] = profile;

                        }

                    }
                );


                /* =========================================
                   FIND STUDENT PROFILE

                   IMPORTANT:

                   If student profile does not exist,
                   return null.

                   That means the application is invalid
                   and will NOT be counted or displayed.
                ========================================= */

                const findStudentProfile =
                    (application) => {

                        if (!application) {
                            return null;
                        }


                        const studentIdValues = [

                            application.studentId,

                            application.studentID,

                            application.studentUid,

                            application.studentUID,

                            application.uid,

                            application.userId,

                            application.userID

                        ]
                            .filter(
                                value =>
                                    value !== undefined &&
                                    value !== null &&
                                    String(value).trim() !== ""
                            )
                            .map(normalizeText);


                        if (
                            studentIdValues.length === 0
                        ) {
                            return null;
                        }


                        /* =================================
                           FIND BY DOCUMENT ID
                        ================================= */

                        for (
                            const studentId
                            of studentIdValues
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

                        }


                        /* =================================
                           FIND BY UID
                        ================================= */

                        for (
                            const studentId
                            of studentIdValues
                        ) {

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


                        /* =================================
                           STUDENT DOES NOT EXIST
                        ================================= */

                        return null;

                    };


                /* =========================================
                   VALID JOBS

                   A job is valid ONLY when the company
                   still exists.

                   Deleted company => job disappears.
                ========================================= */

                const validJobs =
                    jobsData
                        .map((job) => {

                            const company =
                                findCompanyForRecord(
                                    job,
                                    companiesData
                                );


                            if (!company) {
                                return null;
                            }


                            return {

                                ...job,

                                companyData:
                                    company

                            };

                        })
                        .filter(Boolean);


                /* =========================================
                   SORT JOBS
                ========================================= */

                validJobs.sort(
                    (a, b) =>
                        getDateTime(
                            b.createdAt
                        ) -
                        getDateTime(
                            a.createdAt
                        )
                );


                /* =========================================
                   SET JOBS
                ========================================= */

                setJobs(validJobs);

                setTotalJobs(
                    validJobs.length
                );


                /* =========================================
                   COUNTERS
                ========================================= */

                let selectedCount = 0;

                let placedCount = 0;

                let pendingCount = 0;


                /* =========================================
                   VALID APPLICATIONS

                   An application is valid ONLY when:

                   1. Company exists
                   2. Student exists

                   Otherwise it is completely ignored.
                ========================================= */

                const validApplications = [];


                /* =========================================
                   PROCESS APPLICATIONS
                ========================================= */

                for (
                    const application
                    of applicationsData
                ) {

                    /* =====================================
                       COMPANY MUST EXIST
                    ===================================== */

                    const company =
                        findCompanyForRecord(
                            application,
                            companiesData
                        );


                    if (!company) {

                        /*
                         * Company was deleted or cannot
                         * be found.
                         *
                         * Ignore application completely.
                         */

                        continue;

                    }


                    /* =====================================
                       STUDENT MUST EXIST
                    ===================================== */

                    const profile =
                        findStudentProfile(
                            application
                        );


                    if (!profile) {

                        /*
                         * Student was deleted or cannot
                         * be found.
                         *
                         * Ignore application completely.
                         */

                        continue;

                    }


                    /* =====================================
                       APPLICATION IS VALID
                    ===================================== */

                    const status =
                        String(
                            application.status ||
                            "pending"
                        )
                            .trim()
                            .toLowerCase();


                    /* =====================================
                       SELECTED
                    ===================================== */

                    const isSelected =
                        status === "accepted" ||
                        status === "selected";


                    /* =====================================
                       PLACED
                    ===================================== */

                    const isPlaced =
                        application.placedStudent === true ||
                        status === "placed";


                    /* =====================================
                       PENDING
                    ===================================== */

                    const isPending =
                        status === "applied" ||
                        status === "pending";


                    /* =====================================
                       COUNT ONLY VALID APPLICATIONS
                    ===================================== */

                    if (isSelected) {
                        selectedCount++;
                    }


                    if (isPlaced) {
                        placedCount++;
                    }


                    if (
                        isPending &&
                        !isSelected &&
                        !isPlaced
                    ) {
                        pendingCount++;
                    }


                    /* =====================================
                       STUDENT NAME
                    ===================================== */

                    const studentName =
                        getFirstValue(
                            profile,
                            [
                                "studentName",
                                "name",
                                "fullName",
                                "displayName"
                            ],
                            "Student"
                        );


                    /* =====================================
                       EMAIL
                    ===================================== */

                    const email =
                        getFirstValue(
                            profile,
                            [
                                "email",
                                "studentEmail",
                                "emailAddress"
                            ],
                            "Not Available"
                        );


                    /* =====================================
                       COLLEGE
                    ===================================== */

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
                            "Not Available"
                        );


                    /* =====================================
                       DEGREE
                    ===================================== */

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
                            "Not Available"
                        );


                    /* =====================================
                       DEPARTMENT
                    ===================================== */

                    const department =
                        getFirstValue(
                            profile,
                            [
                                "department",
                                "branch",
                                "stream",
                                "specialization"
                            ],
                            "Not Available"
                        );


                    /* =====================================
                       PHONE
                    ===================================== */

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
                            "Not Available"
                        );


                    /* =====================================
                       PHOTO
                    ===================================== */

                    const profilePhoto =
                        getProfilePhoto(
                            profile,
                            application
                        );


                    /* =====================================
                       JOB TITLE
                    ===================================== */

                    const jobTitle =
                        application.jobTitle ||
                        application.jobName ||
                        application.title ||
                        "Job Not Available";


                    /* =====================================
                       COMPANY NAME

                       Use the verified company record
                       first where possible.
                    ===================================== */

                    const companyName =
                        company.companyName ||
                        company.name ||
                        company.displayName ||
                        company.businessName ||
                        application.companyName ||
                        application.company ||
                        "Company";


                    /* =====================================
                       PROCESSED APPLICATION
                    ===================================== */

                    validApplications.push({

                        ...application,

                        profile,

                        companyData:
                            company,

                        studentProfileId:
                            profile.id || null,

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


                /* =========================================
                   TOTAL APPLICANTS

                   IMPORTANT:

                   Count ONLY applications where:

                   student exists
                   AND
                   company exists
                ========================================= */

                setTotalApplicants(
                    validApplications.length
                );


                /* =========================================
                   PLACEMENT RATE
                ========================================= */

                const calculatedPlacementRate =
                    selectedCount > 0
                        ? Math.round(
                            (
                                placedCount /
                                selectedCount
                            ) * 100
                        )
                        : 0;


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


                /* =========================================
                   SELECTED STUDENTS
                ========================================= */

                const selectedList =
                    validApplications
                        .filter(
                            application =>
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


                /* =========================================
                   PLACED STUDENTS
                ========================================= */

                const placedList =
                    validApplications
                        .filter(
                            application =>
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


                /* =========================================
                   ONLY SHOW 5
                ========================================= */

                setSelectedStudents(
                    selectedList.slice(0, 5)
                );


                setPlacedStudents(
                    placedList.slice(0, 5)
                );


                /* =========================================
                   LOADING COMPLETE
                ========================================= */

                setLoading(false);

            } catch (error) {

                console.error(
                    "Dashboard processing error:",
                    error
                );

                setLoading(false);

            }

        };


        /* =================================================
           JOBS REALTIME LISTENER
        ================================================= */

        const unsubscribeJobs =
            onSnapshot(

                collection(
                    db,
                    "jobs"
                ),

                (snapshot) => {

                    jobsData =
                        snapshot.docs.map(
                            (document) => ({

                                id:
                                    document.id,

                                ...document.data()

                            })
                        );


                    jobsLoaded = true;

                    processDashboard();

                },

                (error) => {

                    console.error(
                        "Jobs realtime listener error:",
                        error
                    );

                    jobsLoaded = true;

                    processDashboard();

                }

            );


        /* =================================================
           APPLICATIONS REALTIME LISTENER
        ================================================= */

        const unsubscribeApplications =
            onSnapshot(

                collection(
                    db,
                    "applications"
                ),

                (snapshot) => {

                    applicationsData =
                        snapshot.docs.map(
                            (document) => ({

                                id:
                                    document.id,

                                ...document.data()

                            })
                        );


                    applicationsLoaded = true;

                    processDashboard();

                },

                (error) => {

                    console.error(
                        "Applications realtime listener error:",
                        error
                    );

                    applicationsLoaded = true;

                    processDashboard();

                }

            );


        /* =================================================
           STUDENT PROFILES REALTIME LISTENER

           If a student is deleted:

           profilesData changes
                 ↓
           processDashboard()
                 ↓
           student cannot be found
                 ↓
           application becomes invalid
                 ↓
           application is removed from:
             - applicants
             - selected
             - placed
             - pending
             - recent selected
             - recent placed
        ================================================= */

        const unsubscribeProfiles =
            onSnapshot(

                collection(
                    db,
                    "studentProfiles"
                ),

                (snapshot) => {

                    profilesData =
                        snapshot.docs.map(
                            (document) => ({

                                id:
                                    document.id,

                                ...document.data()

                            })
                        );


                    profilesLoaded = true;

                    processDashboard();

                },

                (error) => {

                    console.error(
                        "Student profiles realtime listener error:",
                        error
                    );

                    profilesLoaded = true;

                    processDashboard();

                }

            );


        /* =================================================
           COMPANIES REALTIME LISTENER

           If a company is deleted:

           companiesData changes
                 ↓
           processDashboard()
                 ↓
           company cannot be found
                 ↓
           related jobs disappear
                 ↓
           related applications disappear
                 ↓
           all related counters decrease
        ================================================= */

        const unsubscribeCompanies =
            onSnapshot(

                collection(
                    db,
                    "companies"
                ),

                (snapshot) => {

                    companiesData =
                        snapshot.docs.map(
                            (document) => ({

                                id:
                                    document.id,

                                ...document.data()

                            })
                        );


                    companiesLoaded = true;

                    processDashboard();

                },

                (error) => {

                    console.error(
                        "Companies realtime listener error:",
                        error
                    );

                    companiesLoaded = true;

                    processDashboard();

                }

            );


        /* =================================================
           CLEANUP
        ================================================= */

        return () => {

            unsubscribeJobs();

            unsubscribeApplications();

            unsubscribeProfiles();

            unsubscribeCompanies();

        };

    }, []);


    /* =====================================================
       STUDENT AVATAR
    ===================================================== */

    const StudentAvatar = ({
        student,
        placed = false
    }) => {

        const [imageError, setImageError] =
            useState(false);


        const photo =
            student?.profilePhoto
                ? String(
                    student.profilePhoto
                ).trim()
                : "";


        const name =
            student?.studentName?.trim() ||
            "Student";


        /* ================================================
           INITIALS
        ================================================ */

        const nameParts =
            name
                .split(/\s+/)
                .filter(Boolean);


        let initials = "S";


        if (
            nameParts.length === 1
        ) {

            initials =
                nameParts[0]
                    .charAt(0)
                    .toUpperCase();

        } else {

            initials =
                (
                    nameParts[0]
                        .charAt(0) +

                    nameParts[
                        nameParts.length - 1
                    ]
                        .charAt(0)

                ).toUpperCase();

        }


        const avatarClass =
            placed
                ? "student-avatar placed-avatar"
                : "student-avatar";


        /* ================================================
           FALLBACK
        ================================================ */

        if (
            !photo ||
            imageError
        ) {

            return (

                <div
                    className={avatarClass}
                    title={name}
                    aria-label={`${name} profile`}
                >

                    {initials}

                </div>

            );

        }


        /* ================================================
           PHOTO
        ================================================ */

        return (

            <div
                className={`${avatarClass} avatar-photo`}
                title={name}
                aria-label={`${name} profile`}
            >

                <img
                    src={photo}
                    alt={`${name} profile`}
                    className="student-profile-photo"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={() => {
                        setImageError(true);
                    }}
                />

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


                {/* TOTAL JOBS */}

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


                {/* APPLICANTS */}

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


                {/* SELECTED */}

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


                {/* PLACED */}

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


                {/* PENDING */}

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
                SELECTED STUDENTS
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

                                                    <StudentAvatar
                                                        student={
                                                            student
                                                        }
                                                    />

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
                PLACED STUDENTS
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
                                                                    job.company ||
                                                                    job.companyData?.companyName ||
                                                                    job.companyData?.name ||
                                                                    job.companyData?.displayName ||
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