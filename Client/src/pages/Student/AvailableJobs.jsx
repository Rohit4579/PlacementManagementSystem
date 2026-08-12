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

import sendEmail from "../../services/emailService";

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


        try {

            if (
                value &&
                typeof value.toDate === "function"
            ) {

                return value
                    .toDate()
                    .getTime();

            }


            if (value instanceof Date) {

                return value.getTime();

            }


            const date =
                new Date(value);


            return isNaN(
                date.getTime()
            )
                ? 0
                : date.getTime();

        }

        catch {

            return 0;

        }

    };


    /* =========================================================
       CHECK JOB STATUS
    ========================================================= */

    const isJobActive = (job) => {

        if (!job) {
            return false;
        }


        /*
         * Jobs without a status are treated as active.
         *
         * This keeps compatibility with your existing
         * Firestore documents.
         */

        if (!job.status) {
            return true;
        }


        return (
            String(job.status)
                .toLowerCase()
                .trim() === "active"
        );

    };


    /* =========================================================
       LOAD AVAILABLE JOBS - REAL TIME
       
       THIS IS THE IMPORTANT PART.
       
       Firestore onSnapshot() listens continuously.
       
       If company executes:
       
           deleteDoc(
               doc(db, "jobs", jobId)
           )
       
       the deleted document disappears from
       snapshot.docs automatically.
       
       We then REPLACE the entire jobs state.
       
       We do NOT merge with the previous state.
    ========================================================= */

    useEffect(() => {

        setLoading(true);

        setError("");


        const jobsRef =
            collection(
                db,
                "jobs"
            );


        const unsubscribe =
            onSnapshot(

                jobsRef,

                (snapshot) => {

                    /*
                     * Build the job list ONLY from the
                     * CURRENT Firestore snapshot.
                     */

                    const currentJobs =
                        snapshot.docs
                            .map(
                                (document) => ({

                                    id:
                                        document.id,

                                    ...document.data()

                                })
                            )
                            .filter(
                                (job) =>
                                    isJobActive(job)
                            );


                    /*
                     * Sort newest jobs first.
                     */

                    currentJobs.sort(
                        (a, b) => {

                            const dateA =
                                getDateValue(
                                    a.createdAt ||
                                    a.postedAt
                                );


                            const dateB =
                                getDateValue(
                                    b.createdAt ||
                                    b.postedAt
                                );


                            return (
                                dateB -
                                dateA
                            );

                        }
                    );


                    /*
                     * CRITICAL:
                     *
                     * Replace the entire array.
                     *
                     * Do NOT do:
                     *
                     * setJobs(previous => [...previous, ...newJobs])
                     *
                     * because that can keep deleted jobs.
                     */

                    setJobs(
                        currentJobs
                    );


                    setLoading(false);

                    setError("");

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


        /*
         * Remove Firestore listener when component
         * unmounts.
         */

        return () => {

            unsubscribe();

        };

    }, []);


    /* =========================================================
       LOAD STUDENT APPLICATIONS - REAL TIME
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
                            ...new Set(
                                jobIds
                            )
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

    }, [user?.uid]);


    /* =========================================================
       FILTER JOBS
    ========================================================= */

    useEffect(() => {

        const searchValue =
            search
                .toLowerCase()
                .trim();


        if (!searchValue) {

            setFilteredJobs(
                jobs
            );

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
                        Array.isArray(
                            job.skills
                        )
                            ? job.skills
                                .join(" ")
                                .toLowerCase()
                            : String(
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


        setFilteredJobs(
            filtered
        );

    }, [jobs, search]);


    /* =========================================================
       CHECK STUDENT PROFILE
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


                if (
                    !profileSnapshot.exists()
                ) {

                    return {

                        complete: false,

                        reason:
                            "missing_profile"

                    };

                }


                const profile =
                    profileSnapshot.data();


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


                const missingFields =
                    requiredFields
                        .filter(
                            (field) => {

                                const value =
                                    profile[
                                        field.key
                                    ];


                                return (

                                    value ===
                                        undefined ||

                                    value ===
                                        null ||

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
                    return;
                }


                if (!job?.companyId) {

                    console.error(
                        "Company notification skipped: companyId missing.",
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

            }

            catch (error) {

                console.error(
                    "Company notification error:",
                    error
                );

            }

        };


    /* =========================================================
       SEND APPLICATION EMAIL
    ========================================================= */

    const sendApplicationEmailToCompany =
        async (job) => {

            try {

                const companyEmail =
                    String(
                        job?.companyEmail ||
                        ""
                    ).trim();


                if (!companyEmail) {

                    console.warn(
                        "Application email skipped: company email not available."
                    );


                    return {

                        success: false,

                        skipped: true

                    };

                }


                const studentName =
                    user?.name ||
                    user?.displayName ||
                    "Student";


                const studentEmail =
                    user?.email ||
                    "Not available";


                const subject =
                    `New Job Application - ${job.jobTitle || "Job Application"}`;


                const message = `
A new student has applied for your job.

Student Details

Name: ${studentName}
Email: ${studentEmail}

Job Title: ${job.jobTitle || "Not specified"}
Company: ${job.companyName || "Your Company"}
Location: ${job.location || "Not specified"}
Salary / Package: ${job.salary || "Not specified"}
Application Deadline: ${job.deadline || "Not specified"}

The student has successfully submitted an application through the Placement Management System.

Please login to your company dashboard to review the student's application.

Placement Management System
`.trim();


                const result =
                    await sendEmail({

                        to:
                            companyEmail,

                        subject:
                            subject,

                        message:
                            message

                    });


                return {

                    success: true,

                    result

                };

            }

            catch (error) {

                console.error(
                    "Application email could not be sent:",
                    error
                );


                return {

                    success: false,

                    error

                };

            }

        };


    /* =========================================================
       APPLY FOR JOB
       
       IMPORTANT:
       
       Before creating an application:
       
       1. Fetch the job directly from Firestore.
       2. Make sure the document still exists.
       3. Make sure it is still active.
       4. Then create the application.
       
       This protects against:
       
       Student opens page
       ->
       Company deletes job
       ->
       Student clicks Apply
       
       The application will NOT be created.
    ========================================================= */

    const applyJob =
        async (selectedJob) => {

            if (!user?.uid) {

                alert(
                    "Please login as a student before applying."
                );

                return;

            }


            if (
                user.role &&
                String(user.role)
                    .toLowerCase() !==
                "student"
            ) {

                alert(
                    "Only students can apply for jobs."
                );

                return;

            }


            if (!selectedJob?.id) {

                alert(
                    "This job is invalid or has already been deleted."
                );

                return;

            }


            if (
                applyingJobId ===
                selectedJob.id
            ) {

                return;

            }


            try {

                setApplyingJobId(
                    selectedJob.id
                );


                /* =================================================
                   STEP 1
                   FETCH LATEST JOB
                ================================================= */

                const jobReference =
                    doc(
                        db,
                        "jobs",
                        selectedJob.id
                    );


                const latestJobSnapshot =
                    await getDoc(
                        jobReference
                    );


                /* =================================================
                   STEP 2
                   JOB WAS DELETED
                ================================================= */

                if (
                    !latestJobSnapshot.exists()
                ) {

                    /*
                     * Remove stale job immediately from
                     * the student's UI.
                     */

                    setJobs(
                        (previous) =>
                            previous.filter(
                                (item) =>
                                    item.id !==
                                    selectedJob.id
                            )
                    );


                    setFilteredJobs(
                        (previous) =>
                            previous.filter(
                                (item) =>
                                    item.id !==
                                    selectedJob.id
                            )
                    );


                    alert(
                        "This job is no longer available. The company has deleted it."
                    );


                    return;

                }


                /* =================================================
                   STEP 3
                   USE LATEST JOB DATA
                ================================================= */

                const latestJob = {

                    id:
                        latestJobSnapshot.id,

                    ...latestJobSnapshot.data()

                };


                /* =================================================
                   STEP 4
                   CHECK STATUS
                ================================================= */

                if (
                    !isJobActive(
                        latestJob
                    )
                ) {

                    setJobs(
                        (previous) =>
                            previous.filter(
                                (item) =>
                                    item.id !==
                                    selectedJob.id
                            )
                    );


                    setFilteredJobs(
                        (previous) =>
                            previous.filter(
                                (item) =>
                                    item.id !==
                                    selectedJob.id
                            )
                    );


                    alert(
                        "This job is no longer available."
                    );


                    return;

                }


                /*
                 * From this point onward always use the
                 * latest Firestore version.
                 */

                const job =
                    latestJob;


                /* =================================================
                   STEP 5
                   CHECK PROFILE
                ================================================= */

                const profileCheck =
                    await checkStudentProfileCompletion();


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
                            "Unable to verify your Student Profile right now.\n\nPlease try again."
                        );


                        return;

                    }


                    return;

                }


                /* =================================================
                   STEP 6
                   COMPANY VALIDATION
                ================================================= */

                if (!job.companyId) {

                    alert(
                        "This job does not have a valid company."
                    );


                    console.error(
                        "Job companyId missing:",
                        job
                    );


                    return;

                }


                /* =================================================
                   STEP 7
                   DUPLICATE APPLICATION CHECK
                ================================================= */

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


                /* =================================================
                   STEP 8
                   CREATE APPLICATION
                ================================================= */

                const applicationData = {

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

                    eligibility:
                        job.eligibility ||
                        null,

                    status:
                        "Applied",

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


                setAppliedJobs(
                    (previous) => [

                        ...new Set([
                            ...previous,
                            job.id
                        ])

                    ]
                );


                /* =================================================
                   STEP 9
                   NOTIFICATIONS
                ================================================= */

                await Promise.all([

                    createStudentNotification(
                        job
                    ),

                    createCompanyNotification(
                        job
                    )

                ]);


                /* =================================================
                   STEP 10
                   EMAIL
                ================================================= */

                const emailResult =
                    await sendApplicationEmailToCompany(
                        job
                    );


                if (
                    emailResult?.success
                ) {

                    alert(
                        "Application submitted successfully!\n\nThe company has also been notified by email."
                    );

                }

                else {

                    alert(
                        "Application submitted successfully!\n\nThe application was saved and the company was notified in the system, but the email could not be sent."
                    );

                }

            }

            catch (error) {

                console.error(
                    "Application error:",
                    error
                );


                alert(
                    error?.message ||
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

    const retryJobs = () => {

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

                <span
                    className="search-icon-wrapper"
                    aria-hidden="true"
                >

                    <FaSearch className="search-icon" />

                </span>


                <input
                    type="text"
                    className="jobs-search-input"
                    placeholder="Search by company, job, skill or location..."
                    value={search}
                    onChange={(e) =>
                        setSearch(
                            e.target.value
                        )
                    }
                    aria-label="Search available jobs"
                    autoComplete="off"
                />


                {search && (

                    <button
                        type="button"
                        className="clear-search"
                        onClick={() =>
                            setSearch("")
                        }
                        aria-label="Clear search"
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


                                const eligibility =
                                    job.eligibility ||
                                    {};


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


                                        {/* COMPANY */}

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


                                        {/* JOB TITLE */}

                                        <h2>

                                            {
                                                job.jobTitle ||
                                                "Untitled Job"
                                            }

                                        </h2>


                                        {/* DESCRIPTION */}

                                        <p className="job-description">

                                            {
                                                job.jobDescription ||
                                                "No description provided."
                                            }

                                        </p>


                                        {/* DETAILS */}

                                        <div className="job-details">


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


                                        {/* ELIGIBILITY */}

                                        <div className="job-eligibility">

                                            <strong>
                                                Eligibility
                                            </strong>


                                            <div className="eligibility-items">


                                                {
                                                    minimumTenth !== "" &&
                                                    minimumTenth !== null &&
                                                    minimumTenth !== undefined && (

                                                        <span>
                                                            10th: {minimumTenth}%
                                                        </span>

                                                    )
                                                }


                                                {
                                                    minimumTwelfth !== "" &&
                                                    minimumTwelfth !== null &&
                                                    minimumTwelfth !== undefined && (

                                                        <span>
                                                            12th: {minimumTwelfth}%
                                                        </span>

                                                    )
                                                }


                                                {
                                                    minimumCGPA !== "" &&
                                                    minimumCGPA !== null &&
                                                    minimumCGPA !== undefined && (

                                                        <span>
                                                            CGPA: {minimumCGPA}/10
                                                        </span>

                                                    )
                                                }


                                                {
                                                    minimumEducation && (

                                                        <span>
                                                            Education: {minimumEducation}
                                                        </span>

                                                    )
                                                }


                                                {
                                                    experience && (

                                                        <span>
                                                            Experience: {experience}
                                                        </span>

                                                    )
                                                }


                                                {
                                                    branches && (

                                                        <span>
                                                            Branches: {branches}
                                                        </span>

                                                    )
                                                }


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


                                        {/* SKILLS */}

                                        {job.skills && (

                                            <div className="job-skills">

                                                <strong>
                                                    Skills
                                                </strong>


                                                <div>

                                                    {
                                                        (
                                                            Array.isArray(
                                                                job.skills
                                                            )
                                                                ? job.skills
                                                                : String(
                                                                    job.skills
                                                                ).split(",")
                                                        )
                                                            .map(
                                                                (
                                                                    skill,
                                                                    index
                                                                ) => {

                                                                    const cleanSkill =
                                                                        String(
                                                                            skill
                                                                        ).trim();


                                                                    if (
                                                                        !cleanSkill
                                                                    ) {

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


                                        {/* APPLY BUTTON */}

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