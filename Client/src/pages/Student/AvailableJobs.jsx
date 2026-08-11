import { useEffect, useState } from "react";

import {
    collection,
    getDocs,
    onSnapshot,
    query,
    where,
    addDoc,
    serverTimestamp,
    doc,
    getDoc
} from "firebase/firestore";

import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../context/AuthContext";

import {
    FaSearch,
    FaMapMarkerAlt,
    FaMoneyBillWave,
    FaGraduationCap,
    FaCalendarAlt,
    FaBuilding,
    FaBriefcase,
    FaCheckCircle
} from "react-icons/fa";

import "./AvailableJobs.css";

function AvailableJobs() {

    const { user } = useAuth();

    /* =========================================================
       STATES
    ========================================================= */

    const [jobs, setJobs] = useState([]);

    const [filteredJobs, setFilteredJobs] = useState([]);

    const [search, setSearch] = useState("");

    const [appliedJobs, setAppliedJobs] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [applyingJobId, setApplyingJobId] = useState(null);


    /* =========================================================
       DATE HELPER
    ========================================================= */

    const getDateValue = (value) => {

        if (!value) {
            return 0;
        }

        if (typeof value.toDate === "function") {
            return value.toDate().getTime();
        }

        if (value instanceof Date) {
            return value.getTime();
        }

        const date = new Date(value);

        return isNaN(date.getTime())
            ? 0
            : date.getTime();

    };


    /* =========================================================
       LOAD JOBS
    ========================================================= */

    useEffect(() => {

        setLoading(true);
        setError("");

        const jobsRef = collection(
            db,
            "jobs"
        );

        const unsubscribe = onSnapshot(

            jobsRef,

            (snapshot) => {

                const jobData = snapshot.docs.map(
                    (document) => ({
                        id: document.id,
                        ...document.data()
                    })
                );


                /*
                -------------------------------------------------
                ONLY SHOW ACTIVE JOBS
                -------------------------------------------------
                */

                const activeJobs = jobData.filter(
                    (job) => {

                        return (
                            !job.status ||
                            job.status === "active"
                        );

                    }
                );


                /*
                -------------------------------------------------
                NEWEST JOBS FIRST
                -------------------------------------------------
                */

                activeJobs.sort(
                    (a, b) => {

                        const dateA =
                            getDateValue(
                                a.createdAt
                            );

                        const dateB =
                            getDateValue(
                                b.createdAt
                            );

                        return dateB - dateA;

                    }
                );


                setJobs(activeJobs);

                setLoading(false);

            },

            (firebaseError) => {

                console.error(
                    "Jobs listener error:",
                    firebaseError
                );

                setError(
                    "Unable to load available jobs."
                );

                setLoading(false);

            }

        );

        return () => {
            unsubscribe();
        };

    }, []);


    /* =========================================================
       LOAD STUDENT APPLICATIONS
    ========================================================= */

    useEffect(() => {

        if (!user?.uid) {

            setAppliedJobs([]);

            return;

        }

        const applicationsRef =
            collection(
                db,
                "applications"
            );

        const applicationsQuery =
            query(
                applicationsRef,
                where(
                    "studentId",
                    "==",
                    user.uid
                )
            );

        const unsubscribe =
            onSnapshot(

                applicationsQuery,

                (snapshot) => {

                    const jobIds =
                        snapshot.docs
                            .map(
                                (document) =>
                                    document.data().jobId
                            )
                            .filter(Boolean);

                    setAppliedJobs(
                        [
                            ...new Set(jobIds)
                        ]
                    );

                },

                (firebaseError) => {

                    console.error(
                        "Applications listener error:",
                        firebaseError
                    );

                }

            );

        return () => {
            unsubscribe();
        };

    }, [user]);


    /* =========================================================
       FILTER JOBS
    ========================================================= */

    useEffect(() => {

        const searchValue =
            search
                .toLowerCase()
                .trim();

        if (!searchValue) {

            setFilteredJobs(jobs);

            return;

        }

        const filtered =
            jobs.filter(
                (job) => {

                    const company =
                        String(
                            job.companyName ||
                            ""
                        ).toLowerCase();

                    const title =
                        String(
                            job.jobTitle ||
                            ""
                        ).toLowerCase();

                    const skills =
                        String(
                            job.skills ||
                            ""
                        ).toLowerCase();

                    const location =
                        String(
                            job.location ||
                            ""
                        ).toLowerCase();

                    const description =
                        String(
                            job.jobDescription ||
                            ""
                        ).toLowerCase();

                    return (

                        company.includes(
                            searchValue
                        ) ||

                        title.includes(
                            searchValue
                        ) ||

                        skills.includes(
                            searchValue
                        ) ||

                        location.includes(
                            searchValue
                        ) ||

                        description.includes(
                            searchValue
                        )

                    );

                }
            );

        setFilteredJobs(filtered);

    }, [jobs, search]);


    /* =========================================================
       CHECK STUDENT PROFILE COMPLETION
       
       IMPORTANT:
       Student must complete the profile before applying.
       
       Required fields:
       - phone
       - collegeName
       - degree
       - department
       - tenthPercentage
       - twelfthPercentage
       - cgpa
       - graduationYear
       - skills
    ========================================================= */

    const checkStudentProfileCompletion =
        async () => {

            try {

                if (!user?.uid) {

                    return {
                        complete: false,
                        reason: "login"
                    };

                }


                const profileRef =
                    doc(
                        db,
                        "studentProfiles",
                        user.uid
                    );


                const profileSnapshot =
                    await getDoc(
                        profileRef
                    );


                /*
                -------------------------------------------------
                PROFILE DOCUMENT DOES NOT EXIST
                -------------------------------------------------
                */

                if (
                    !profileSnapshot.exists()
                ) {

                    return {
                        complete: false,
                        reason: "missing_profile"
                    };

                }


                const profile =
                    profileSnapshot.data();


                /*
                -------------------------------------------------
                REQUIRED PROFILE FIELDS
                -------------------------------------------------
                */

                const requiredFields = [

                    {
                        key: "phone",
                        label: "Phone Number"
                    },

                    {
                        key: "collegeName",
                        label: "College / University"
                    },

                    {
                        key: "degree",
                        label: "Degree"
                    },

                    {
                        key: "department",
                        label: "Department / Branch"
                    },

                    {
                        key: "tenthPercentage",
                        label: "10th Percentage"
                    },

                    {
                        key: "twelfthPercentage",
                        label: "12th Percentage"
                    },

                    {
                        key: "cgpa",
                        label: "CGPA"
                    },

                    {
                        key: "graduationYear",
                        label: "Graduation Year"
                    },

                    {
                        key: "skills",
                        label: "Skills"
                    }

                ];


                /*
                -------------------------------------------------
                FIND MISSING FIELDS
                -------------------------------------------------
                */

                const missingFields =
                    requiredFields
                        .filter(
                            (field) => {

                                const value =
                                    profile[
                                        field.key
                                    ];

                                return (
                                    value === undefined ||
                                    value === null ||
                                    String(
                                        value
                                    ).trim() === ""
                                );

                            }
                        )
                        .map(
                            (field) =>
                                field.label
                        );


                /*
                -------------------------------------------------
                PROFILE INCOMPLETE
                -------------------------------------------------
                */

                if (
                    missingFields.length > 0
                ) {

                    return {

                        complete: false,

                        reason:
                            "incomplete_profile",

                        missingFields

                    };

                }


                /*
                -------------------------------------------------
                PROFILE COMPLETE
                -------------------------------------------------
                */

                return {
                    complete: true
                };

            }

            catch (error) {

                console.error(
                    "Student profile check error:",
                    error
                );

                return {

                    complete: false,

                    reason:
                        "profile_check_error"

                };

            }

        };


    /* =========================================================
       CREATE STUDENT NOTIFICATION
    ========================================================= */

    const createStudentNotification =
        async (job) => {

            try {

                if (!user?.uid) {

                    console.warn(
                        "Student notification skipped: student UID missing."
                    );

                    return;

                }

                const notificationData = {

                    userId:
                        user.uid,

                    message:
                        `Your application for "${job.jobTitle || "this job"}" at ${job.companyName || "the company"} has been submitted successfully.`,

                    type:
                        "application_submitted",

                    read:
                        false,

                    jobId:
                        job.id,

                    jobTitle:
                        job.jobTitle ||
                        "Unknown Job",

                    companyId:
                        job.companyId ||
                        "",

                    companyName:
                        job.companyName ||
                        "Unknown Company",

                    companyEmail:
                        job.companyEmail ||
                        "",

                    createdAt:
                        serverTimestamp()

                };

                await addDoc(
                    collection(
                        db,
                        "notifications"
                    ),
                    notificationData
                );

                console.log(
                    "Student notification created successfully."
                );

            }
            catch (error) {

                console.error(
                    "Student notification error:",
                    error
                );

            }

        };


    /* =========================================================
       CREATE COMPANY NOTIFICATION
    ========================================================= */

    const createCompanyNotification =
        async (job) => {

            try {

                if (!user?.uid) {

                    console.warn(
                        "Company notification skipped: student UID missing."
                    );

                    return;

                }

                if (!job?.companyId) {

                    console.error(
                        "Company notification skipped: job.companyId is missing.",
                        job
                    );

                    return;

                }

                const notificationData = {

                    userId:
                        job.companyId,

                    message:
                        `${user.name || user.displayName || "A student"} has applied for "${job.jobTitle || "your job"}".`,

                    type:
                        "new_application",

                    read:
                        false,

                    jobId:
                        job.id,

                    jobTitle:
                        job.jobTitle ||
                        "Unknown Job",

                    studentId:
                        user.uid,

                    studentName:
                        user.name ||
                        user.displayName ||
                        "Unknown Student",

                    studentEmail:
                        user.email ||
                        "",

                    companyId:
                        job.companyId,

                    companyName:
                        job.companyName ||
                        "Unknown Company",

                    companyEmail:
                        job.companyEmail ||
                        "",

                    createdAt:
                        serverTimestamp()

                };

                await addDoc(
                    collection(
                        db,
                        "notifications"
                    ),
                    notificationData
                );

                console.log(
                    "Company notification created successfully."
                );

            }
            catch (error) {

                console.error(
                    "Company notification error:",
                    error
                );

            }

        };


    /* =========================================================
       APPLY FOR JOB
    ========================================================= */

    const applyJob =
        async (job) => {

            /*
            -----------------------------------------------------
            LOGIN CHECK
            -----------------------------------------------------
            */

            if (!user?.uid) {

                alert(
                    "Please login as a student before applying."
                );

                return;

            }


            /*
            -----------------------------------------------------
            ROLE CHECK
            -----------------------------------------------------
            */

            if (
                user.role &&
                user.role.toLowerCase() !==
                "student"
            ) {

                alert(
                    "Only students can apply for jobs."
                );

                return;

            }


            /*
            -----------------------------------------------------
            PROFILE COMPLETION CHECK
             
            THIS IS THE NEW CHECK.
            
            It happens BEFORE company/job/application
            processing so an incomplete student can never
            submit an application.
            -----------------------------------------------------
            */

            const profileCheck =
                await checkStudentProfileCompletion();


            /*
            -----------------------------------------------------
            PROFILE CHECK FAILED
            -----------------------------------------------------
            */

            if (
                !profileCheck.complete
            ) {

                if (
                    profileCheck.reason ===
                    "login"
                ) {

                    alert(
                        "Please login as a student before applying."
                    );

                    return;

                }


                if (
                    profileCheck.reason ===
                    "missing_profile"
                ) {

                    alert(
                        "Please complete your Student Profile before applying for any company job.\n\nGo to Student Profile and complete all required information first."
                    );

                    return;

                }


                if (
                    profileCheck.reason ===
                    "incomplete_profile"
                ) {

                    const missingText =
                        profileCheck.missingFields
                            ?.join(", ") ||
                        "required profile information";


                    alert(
                        `Please complete your Student Profile before applying.\n\nMissing information:\n${missingText}\n\nGo to Student Profile, save your complete profile, and then apply for the job.`
                    );

                    return;

                }


                if (
                    profileCheck.reason ===
                    "profile_check_error"
                ) {

                    alert(
                        "Unable to verify your Student Profile right now.\n\nPlease try again. If the problem continues, open your Student Profile and save it again before applying."
                    );

                    return;

                }


                return;

            }


            /*
            -----------------------------------------------------
            COMPANY CHECK
            -----------------------------------------------------
            */

            if (!job?.companyId) {

                alert(
                    "This job does not have a valid company."
                );

                console.error(
                    "Job companyId missing:",
                    job
                );

                return;

            }


            /*
            -----------------------------------------------------
            JOB ID CHECK
            -----------------------------------------------------
            */

            if (!job?.id) {

                alert(
                    "This job is invalid."
                );

                return;

            }


            /*
            -----------------------------------------------------
            ALREADY APPLIED
            -----------------------------------------------------
            */

            if (
                appliedJobs.includes(
                    job.id
                )
            ) {

                alert(
                    "You have already applied for this job."
                );

                return;

            }


            /*
            -----------------------------------------------------
            PREVENT DOUBLE CLICK
            -----------------------------------------------------
            */

            if (
                applyingJobId ===
                job.id
            ) {

                return;

            }


            try {

                setApplyingJobId(
                    job.id
                );


                /*
                =================================================
                CHECK FIRESTORE FOR DUPLICATE
                =================================================
                */

                const applicationsQuery =
                    query(

                        collection(
                            db,
                            "applications"
                        ),

                        where(
                            "studentId",
                            "==",
                            user.uid
                        ),

                        where(
                            "jobId",
                            "==",
                            job.id
                        )

                    );


                const existingApplications =
                    await getDocs(
                        applicationsQuery
                    );


                if (
                    !existingApplications.empty
                ) {

                    setAppliedJobs(
                        (previous) => {

                            if (
                                previous.includes(
                                    job.id
                                )
                            ) {

                                return previous;

                            }

                            return [
                                ...previous,
                                job.id
                            ];

                        }
                    );

                    alert(
                        "You have already applied for this job."
                    );

                    return;

                }


                /*
                =================================================
                CREATE APPLICATION
                =================================================
                */

                const applicationData = {

                    /*
                    STUDENT
                    */

                    studentId:
                        user.uid,

                    studentName:
                        user.name ||
                        user.displayName ||
                        "Unknown Student",

                    studentEmail:
                        user.email ||
                        "",


                    /*
                    COMPANY
                    */

                    companyId:
                        job.companyId,

                    companyName:
                        job.companyName ||
                        "Unknown Company",

                    companyEmail:
                        job.companyEmail ||
                        "",


                    /*
                    JOB
                    */

                    jobId:
                        job.id,

                    jobTitle:
                        job.jobTitle ||
                        "Unknown Job",

                    jobDescription:
                        job.jobDescription ||
                        "",

                    skills:
                        job.skills ||
                        "",

                    salary:
                        job.salary ||
                        "",

                    location:
                        job.location ||
                        "",

                    deadline:
                        job.deadline ||
                        "",


                    /*
                    ELIGIBILITY
                    */

                    eligibility:
                        job.eligibility ||
                        null,


                    /*
                    STATUS
                    */

                    status:
                        "Applied",


                    /*
                    TIMESTAMPS
                    */

                    appliedAt:
                        serverTimestamp(),

                    createdAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()

                };


                const applicationReference =
                    await addDoc(

                        collection(
                            db,
                            "applications"
                        ),

                        applicationData

                    );


                console.log(
                    "Application created:",
                    applicationReference.id
                );


                /*
                =================================================
                UPDATE UI
                =================================================
                */

                setAppliedJobs(
                    (previous) => [

                        ...previous,
                        job.id

                    ]
                );


                /*
                =================================================
                CREATE NOTIFICATIONS
                =================================================
                */

                await Promise.all([

                    createStudentNotification(
                        job
                    ),

                    createCompanyNotification(
                        job
                    )

                ]);


                /*
                =================================================
                SUCCESS
                =================================================
                */

                alert(
                    "Application submitted successfully!"
                );

            }
            catch (error) {

                console.error(
                    "Application error:",
                    error
                );

                alert(
                    error.message ||
                    "Unable to submit application."
                );

            }
            finally {

                setApplyingJobId(
                    null
                );

            }

        };


    /* =========================================================
       RETRY
    ========================================================= */

    const retryJobs =
        () => {

            window.location.reload();

        };


    /* =========================================================
       RENDER
    ========================================================= */

    return (

        <div className="available-jobs-page">


            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="available-jobs-header">

                <div>

                    <span className="jobs-page-label">
                        PLACEMENT PORTAL
                    </span>

                    <h1>
                        Available Jobs
                    </h1>

                    <p>
                        Discover placement opportunities
                        and apply for positions that match
                        your skills.
                    </p>

                </div>


                <div className="jobs-count">

                    <FaBriefcase />

                    <span>

                        {filteredJobs.length}

                        {" "}

                        {
                            filteredJobs.length === 1
                                ? "Job"
                                : "Jobs"
                        }

                    </span>

                </div>

            </div>


            {/* ==================================================
                SEARCH
            ================================================== */}

            <div className="jobs-search-box">

                <FaSearch className="search-icon" />

                <input
                    type="text"
                    placeholder="Search by company, job, skill or location..."
                    value={search}
                    onChange={(e) =>
                        setSearch(
                            e.target.value
                        )
                    }
                />

                {search && (

                    <button
                        type="button"
                        className="clear-search"
                        onClick={() =>
                            setSearch("")
                        }
                    >
                        ×
                    </button>

                )}

            </div>


            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (

                <div className="jobs-message error-message">

                    <div className="message-icon">
                        ⚠️
                    </div>

                    <h3>
                        Unable to load jobs
                    </h3>

                    <p>
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={retryJobs}
                    >
                        Try Again
                    </button>

                </div>

            )}


            {/* ==================================================
                LOADING
            ================================================== */}

            {loading && !error && (

                <div className="jobs-message">

                    <div className="loading-spinner"></div>

                    <h3>
                        Loading jobs
                    </h3>

                    <p>
                        Please wait while we find
                        available opportunities.
                    </p>

                </div>

            )}


            {/* ==================================================
                EMPTY
            ================================================== */}

            {!loading &&
            !error &&
            filteredJobs.length === 0 && (

                <div className="jobs-message">

                    <div className="message-icon">
                        💼
                    </div>

                    <h3>
                        No Jobs Found
                    </h3>

                    <p>

                        {
                            search
                                ? "No jobs match your search. Try a different keyword."
                                : "There are currently no placement opportunities available."
                        }

                    </p>

                    {search && (

                        <button
                            type="button"
                            onClick={() =>
                                setSearch("")
                            }
                        >
                            Clear Search
                        </button>

                    )}

                </div>

            )}


            {/* ==================================================
                JOB LIST
            ================================================== */}

            {!loading &&
            !error &&
            filteredJobs.length > 0 && (

                <div className="jobs-grid">

                    {
                        filteredJobs.map(
                            (job) => {

                                const alreadyApplied =
                                    appliedJobs.includes(
                                        job.id
                                    );


                                const isApplying =
                                    applyingJobId ===
                                    job.id;


                                /*
                                =================================================
                                ELIGIBILITY
                                =================================================

                                Supports these Firebase field names:

                                10th:
                                tenthPercentage
                                tenth
                                minimum10th
                                minimumTenth

                                12th:
                                twelfthPercentage
                                twelfth
                                minimum12th
                                minimumTwelfth

                                CGPA:
                                minimumCGPA

                                Education:
                                education

                                Experience:
                                experience

                                Branches:
                                branches
                                */

                                const eligibility =
                                    job.eligibility || {};


                                const minimumTenth =
                                    eligibility.tenthPercentage ??
                                    eligibility.tenth ??
                                    eligibility.minimum10th ??
                                    eligibility.minimumTenth ??
                                    "";


                                const minimumTwelfth =
                                    eligibility.twelfthPercentage ??
                                    eligibility.twelfth ??
                                    eligibility.minimum12th ??
                                    eligibility.minimumTwelfth ??
                                    "";


                                const minimumCGPA =
                                    eligibility.minimumCGPA ??
                                    "";


                                const minimumEducation =
                                    eligibility.education ??
                                    "";


                                const experience =
                                    eligibility.experience ??
                                    "";


                                const branches =
                                    eligibility.branches ??
                                    "";


                                return (

                                    <article
                                        className="job-card"
                                        key={job.id}
                                    >


                                        {/* ==========================
                                            COMPANY
                                        ========================== */}

                                        <div className="job-company">

                                            <div className="company-icon">
                                                <FaBuilding />
                                            </div>

                                            <div className="company-info">

                                                <strong>

                                                    {
                                                        job.companyName ||
                                                        "Unknown Company"
                                                    }

                                                </strong>

                                                <span>
                                                    Placement Opportunity
                                                </span>

                                            </div>

                                        </div>


                                        {/* ==========================
                                            JOB TITLE
                                        ========================== */}

                                        <h2>

                                            {
                                                job.jobTitle ||
                                                "Untitled Job"
                                            }

                                        </h2>


                                        {/* ==========================
                                            DESCRIPTION
                                        ========================== */}

                                        <p className="job-description">

                                            {
                                                job.jobDescription ||
                                                "No description provided."
                                            }

                                        </p>


                                        {/* ==========================
                                            DETAILS
                                        ========================== */}

                                        <div className="job-details">


                                            {/* SALARY */}

                                            <div className="job-detail">

                                                <FaMoneyBillWave />

                                                <span>

                                                    <small>
                                                        Salary
                                                    </small>

                                                    {
                                                        job.salary ||
                                                        "Not specified"
                                                    }

                                                </span>

                                            </div>


                                            {/* LOCATION */}

                                            <div className="job-detail">

                                                <FaMapMarkerAlt />

                                                <span>

                                                    <small>
                                                        Location
                                                    </small>

                                                    {
                                                        job.location ||
                                                        "Not specified"
                                                    }

                                                </span>

                                            </div>


                                            {/* EDUCATION */}

                                            <div className="job-detail">

                                                <FaGraduationCap />

                                                <span>

                                                    <small>
                                                        Education
                                                    </small>

                                                    {
                                                        minimumEducation ||
                                                        "Not specified"
                                                    }

                                                </span>

                                            </div>


                                            {/* DEADLINE */}

                                            <div className="job-detail">

                                                <FaCalendarAlt />

                                                <span>

                                                    <small>
                                                        Deadline
                                                    </small>

                                                    {
                                                        job.deadline ||
                                                        "No deadline"
                                                    }

                                                </span>

                                            </div>

                                        </div>


                                        {/* ==================================================
                                            ELIGIBILITY
                                        ================================================== */}

                                        <div className="job-eligibility">

                                            <strong>
                                                Eligibility
                                            </strong>


                                            <div className="eligibility-items">


                                                {/* 10TH */}

                                                {
                                                    minimumTenth !== "" &&
                                                    minimumTenth !== null &&
                                                    minimumTenth !== undefined && (

                                                        <span>
                                                            10th: {minimumTenth}%
                                                        </span>

                                                    )
                                                }


                                                {/* 12TH */}

                                                {
                                                    minimumTwelfth !== "" &&
                                                    minimumTwelfth !== null &&
                                                    minimumTwelfth !== undefined && (

                                                        <span>
                                                            12th: {minimumTwelfth}%
                                                        </span>

                                                    )
                                                }


                                                {/* CGPA */}

                                                {
                                                    minimumCGPA !== "" &&
                                                    minimumCGPA !== null &&
                                                    minimumCGPA !== undefined && (

                                                        <span>
                                                            CGPA: {minimumCGPA}/10
                                                        </span>

                                                    )
                                                }


                                                {/* EDUCATION */}

                                                {
                                                    minimumEducation && (

                                                        <span>
                                                            Education: {minimumEducation}
                                                        </span>

                                                    )
                                                }


                                                {/* EXPERIENCE */}

                                                {
                                                    experience && (

                                                        <span>
                                                            Experience: {experience}
                                                        </span>

                                                    )
                                                }


                                                {/* BRANCHES */}

                                                {
                                                    branches && (

                                                        <span>
                                                            Branches: {branches}
                                                        </span>

                                                    )
                                                }


                                                {/* NOTHING AVAILABLE */}

                                                {
                                                    !minimumTenth &&
                                                    !minimumTwelfth &&
                                                    !minimumCGPA &&
                                                    !minimumEducation &&
                                                    !experience &&
                                                    !branches && (

                                                        <span>
                                                            Eligibility details not specified
                                                        </span>

                                                    )
                                                }

                                            </div>

                                        </div>


                                        {/* ==================================================
                                            SKILLS
                                        ================================================== */}

                                        {job.skills && (

                                            <div className="job-skills">

                                                <strong>
                                                    Skills
                                                </strong>

                                                <div>

                                                    {
                                                        String(
                                                            job.skills
                                                        )
                                                            .split(",")
                                                            .map(
                                                                (
                                                                    skill,
                                                                    index
                                                                ) => {

                                                                    const cleanSkill =
                                                                        skill.trim();

                                                                    if (!cleanSkill) {
                                                                        return null;
                                                                    }

                                                                    return (

                                                                        <span
                                                                            key={`${cleanSkill}-${index}`}
                                                                        >
                                                                            {
                                                                                cleanSkill
                                                                            }
                                                                        </span>

                                                                    );

                                                                }
                                                            )
                                                    }

                                                </div>

                                            </div>

                                        )}


                                        {/* ==================================================
                                            APPLY BUTTON
                                        ================================================== */}

                                        <button
                                            type="button"
                                            className={
                                                alreadyApplied
                                                    ? "apply-button applied"
                                                    : "apply-button"
                                            }
                                            disabled={
                                                alreadyApplied ||
                                                isApplying
                                            }
                                            onClick={() =>
                                                applyJob(
                                                    job
                                                )
                                            }
                                        >

                                            {isApplying ? (

                                                <>

                                                    <span className="button-spinner"></span>

                                                    Applying...

                                                </>

                                            ) : alreadyApplied ? (

                                                <>

                                                    <FaCheckCircle />

                                                    Applied

                                                </>

                                            ) : (

                                                "Apply Now"

                                            )}

                                        </button>

                                    </article>

                                );

                            }
                        )
                    }

                </div>

            )}

        </div>

    );

}

export default AvailableJobs;