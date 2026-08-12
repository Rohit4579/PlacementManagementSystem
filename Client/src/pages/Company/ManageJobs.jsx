import { useEffect, useState } from "react";

import {
    collection,
    query,
    where,
    getDocs,
    onSnapshot,
    deleteDoc,
    doc
} from "firebase/firestore";

import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../context/AuthContext";

import {
    FaBriefcase,
    FaMapMarkerAlt,
    FaMoneyBillWave,
    FaCode,
    FaCalendarAlt,
    FaTrash,
    FaBuilding,
    FaClock,
    FaClipboardList,
    FaCheckCircle,
    FaExclamationTriangle
} from "react-icons/fa";

import "./ManageJobs.css";


function ManageJobs() {

    const { user } = useAuth();


    /* =========================================================
       STATES
    ========================================================= */

    const [jobs, setJobs] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [deletingId, setDeletingId] = useState(null);


    /* =========================================================
       FORMAT DATE
    ========================================================= */

    const formatDate = (value) => {

        if (!value) {
            return "Not specified";
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
                return "Not specified";
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

        catch (error) {

            console.error(
                "Date formatting error:",
                error
            );

            return "Not specified";

        }

    };


    /* =========================================================
       GET JOB TITLE
    ========================================================= */

    const getJobTitle = (job) => {

        return (
            job.jobTitle ||
            job.title ||
            job.position ||
            job.role ||
            "Untitled Job"
        );

    };


    /* =========================================================
       GET DESCRIPTION
    ========================================================= */

    const getDescription = (job) => {

        return (
            job.jobDescription ||
            job.description ||
            job.details ||
            "No job description available."
        );

    };


    /* =========================================================
       GET SKILLS
    ========================================================= */

    const getSkills = (skills) => {

        if (Array.isArray(skills)) {

            return skills
                .map((skill) =>
                    String(skill).trim()
                )
                .filter(Boolean);

        }


        if (!skills) {
            return [];
        }


        return String(skills)
            .split(",")
            .map((skill) =>
                skill.trim()
            )
            .filter(Boolean);

    };


    /* =========================================================
       GET JOB DATE
    ========================================================= */

    const getJobTime = (value) => {

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
       CHECK WHETHER THIS JOB BELONGS TO CURRENT COMPANY
       
       NEW JOBS:
           companyId === user.uid

       OLD JOBS:
           companyEmail === user.email
       
       This allows older jobs created before companyId
       was added to still be managed and deleted.
    ========================================================= */

    const belongsToCurrentCompany = (job) => {

        if (!job || !user?.uid) {
            return false;
        }


        /* =================================================
           NEW JOB FORMAT
        ================================================= */

        if (
            job.companyId &&
            String(job.companyId) ===
            String(user.uid)
        ) {

            return true;

        }


        /* =================================================
           OLD JOB FORMAT
           
           Older jobs may not have companyId but may have
           companyEmail.
        ================================================= */

        const jobCompanyEmail =
            String(
                job.companyEmail ||
                ""
            )
                .trim()
                .toLowerCase();


        const currentUserEmail =
            String(
                user.email ||
                ""
            )
                .trim()
                .toLowerCase();


        if (
            jobCompanyEmail &&
            currentUserEmail &&
            jobCompanyEmail ===
            currentUserEmail
        ) {

            return true;

        }


        return false;

    };


    /* =========================================================
       LOAD COMPANY JOBS
       
       We use TWO queries:
       
       1. New jobs:
          companyId == user.uid

       2. Legacy jobs:
          companyEmail == user.email

       Then combine them without duplicates.
    ========================================================= */

    useEffect(() => {

        if (!user?.uid) {

            setJobs([]);

            setLoading(false);

            return;

        }


        let unsubscribeCompanyId = null;

        let unsubscribeCompanyEmail = null;


        setLoading(true);

        setError("");


        const jobsRef =
            collection(
                db,
                "jobs"
            );


        /* =====================================================
           NEW JOBS QUERY
        ===================================================== */

        const companyIdQuery =
            query(
                jobsRef,
                where(
                    "companyId",
                    "==",
                    user.uid
                )
            );


        /* =====================================================
           LEGACY JOBS QUERY
           
           Older jobs created before companyId was added
           may contain companyEmail.
        ===================================================== */

        const companyEmail =
            String(
                user.email ||
                ""
            )
                .trim()
                .toLowerCase();


        let companyEmailQuery = null;


        if (companyEmail) {

            companyEmailQuery =
                query(
                    jobsRef,
                    where(
                        "companyEmail",
                        "==",
                        companyEmail
                    )
                );

        }


        /* =====================================================
           COMBINE SNAPSHOTS
        ===================================================== */

        let companyIdJobs = [];

        let companyEmailJobs = [];


        const rebuildJobs = () => {

            const combinedJobs = [

                ...companyIdJobs,

                ...companyEmailJobs

            ];


            /* =================================================
               REMOVE DUPLICATES
            ================================================= */

            const uniqueJobsMap =
                new Map();


            combinedJobs.forEach(
                (job) => {

                    if (!job?.id) {
                        return;
                    }


                    /*
                     * Extra ownership validation.
                     */

                    if (
                        belongsToCurrentCompany(
                            job
                        )
                    ) {

                        uniqueJobsMap.set(
                            job.id,
                            job
                        );

                    }

                }
            );


            const jobList =
                Array.from(
                    uniqueJobsMap.values()
                );


            /* =================================================
               SORT NEWEST FIRST
            ================================================= */

            jobList.sort(
                (a, b) => {

                    const timeA =
                        getJobTime(
                            a.createdAt ||
                            a.postedAt
                        );


                    const timeB =
                        getJobTime(
                            b.createdAt ||
                            b.postedAt
                        );


                    return (
                        timeB -
                        timeA
                    );

                }
            );


            setJobs(jobList);

            setLoading(false);

            setError("");

        };


        /* =====================================================
           LISTEN TO NEW JOB FORMAT
        ===================================================== */

        unsubscribeCompanyId =
            onSnapshot(

                companyIdQuery,

                (snapshot) => {

                    companyIdJobs =
                        snapshot.docs.map(
                            (document) => ({

                                id:
                                    document.id,

                                ...document.data()

                            })
                        );


                    rebuildJobs();

                },

                (firebaseError) => {

                    console.error(
                        "Company ID jobs listener error:",
                        firebaseError
                    );


                    setError(
                        "Unable to load your jobs. Please try again."
                    );

                    setLoading(false);

                }

            );


        /* =====================================================
           LISTEN TO OLD JOB FORMAT
        ===================================================== */

        if (companyEmailQuery) {

            unsubscribeCompanyEmail =
                onSnapshot(

                    companyEmailQuery,

                    (snapshot) => {

                        companyEmailJobs =
                            snapshot.docs.map(
                                (document) => ({

                                    id:
                                        document.id,

                                    ...document.data()

                                })
                            );


                        rebuildJobs();

                    },

                    (firebaseError) => {

                        console.error(
                            "Legacy company email jobs listener error:",
                            firebaseError
                        );

                        /*
                         * Don't destroy the entire page if the
                         * legacy query has a problem.
                         *
                         * New companyId jobs can still work.
                         */

                        rebuildJobs();

                    }

                );

        }
        else {

            rebuildJobs();

        }


        /* =====================================================
           CLEANUP
        ===================================================== */

        return () => {

            if (
                unsubscribeCompanyId
            ) {

                unsubscribeCompanyId();

            }


            if (
                unsubscribeCompanyEmail
            ) {

                unsubscribeCompanyEmail();

            }

        };

    }, [
        user?.uid,
        user?.email
    ]);


    /* =========================================================
       DELETE JOB
       
       IMPORTANT:
       
       This deletes the actual Firestore document:
       
           jobs/{jobId}
       
       It is NOT just hiding the job.
       
       Student AvailableJobs uses onSnapshot(), so after
       deleteDoc() the student page receives the updated
       jobs collection automatically.
    ========================================================= */

    const deleteJob = async (job) => {

        if (!user?.uid) {

            alert(
                "Please login first."
            );

            return;

        }


        if (!job?.id) {

            alert(
                "Invalid job selected."
            );

            return;

        }


        /* =================================================
           SECURITY CHECK
        ================================================= */

        if (
            !belongsToCurrentCompany(
                job
            )
        ) {

            alert(
                "You are not authorized to delete this job."
            );

            return;

        }


        const jobTitle =
            getJobTitle(job);


        const confirmDelete =
            window.confirm(
                `Are you sure you want to permanently delete "${jobTitle}"?\n\nThis job will be removed from Firestore and will disappear from the student job listings.`
            );


        if (!confirmDelete) {
            return;
        }


        try {

            setDeletingId(
                job.id
            );


            /* =================================================
               DELETE FIRESTORE DOCUMENT
            ================================================= */

            const jobReference =
                doc(
                    db,
                    "jobs",
                    job.id
                );


            await deleteDoc(
                jobReference
            );


            /*
             * Remove locally immediately.
             *
             * The onSnapshot listener will also update
             * automatically.
             */

            setJobs(
                (previous) =>
                    previous.filter(
                        (item) =>
                            item.id !==
                            job.id
                    )
            );


            console.log(
                "Job permanently deleted:",
                job.id
            );


        }

        catch (error) {

            console.error(
                "Delete job error:",
                error
            );


            alert(
                error?.message ||
                "Unable to delete this job."
            );

        }

        finally {

            setDeletingId(
                null
            );

        }

    };


    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {

        return (

            <div className="manage-jobs-page">

                <div className="manage-loading">

                    <div className="manage-spinner"></div>

                    <h2>
                        Loading your jobs
                    </h2>

                    <p>
                        Please wait while we retrieve
                        your posted opportunities.
                    </p>

                </div>

            </div>

        );

    }


    /* =========================================================
       ERROR
    ========================================================= */

    if (error) {

        return (

            <div className="manage-jobs-page">

                <div className="manage-error">

                    <div className="manage-error-icon">
                        <FaExclamationTriangle />
                    </div>

                    <h2>
                        Unable to Load Jobs
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            window.location.reload()
                        }
                    >
                        Try Again
                    </button>

                </div>

            </div>

        );

    }


    /* =========================================================
       MAIN PAGE
    ========================================================= */

    return (

        <div className="manage-jobs-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="manage-header">

                <div className="manage-header-content">

                    <span className="manage-label">
                        COMPANY DASHBOARD
                    </span>

                    <h1>
                        Manage Jobs
                    </h1>

                    <p>
                        View, monitor and manage all
                        job opportunities posted by your company.
                    </p>

                </div>


                <div className="manage-header-summary">

                    <div className="summary-icon">
                        <FaBriefcase />
                    </div>

                    <div className="summary-content">

                        <strong>
                            {jobs.length}
                        </strong>

                        <span>
                            {jobs.length === 1
                                ? "Posted Job"
                                : "Posted Jobs"}
                        </span>

                    </div>

                </div>

            </div>


            {/* =================================================
                EMPTY STATE
            ================================================= */}

            {jobs.length === 0 && (

                <div className="empty-jobs">

                    <div className="empty-jobs-icon">
                        <FaClipboardList />
                    </div>

                    <h2>
                        No Jobs Posted Yet
                    </h2>

                    <p>
                        Your posted job opportunities
                        will appear here once you create them.
                    </p>

                </div>

            )}


            {/* =================================================
                JOB GRID
            ================================================= */}

            {jobs.length > 0 && (

                <div className="jobs-grid">

                    {jobs.map((job) => {

                        const title =
                            getJobTitle(job);


                        const description =
                            getDescription(job);


                        const skills =
                            getSkills(
                                job.skills
                            );


                        const location =
                            job.location ||
                            job.jobLocation ||
                            "Not specified";


                        const salary =
                            job.salary ||
                            job.package ||
                            job.ctc ||
                            "Not specified";


                        const company =
                            job.companyName ||
                            job.company ||
                            "Company";


                        const deadline =
                            job.deadline ||
                            job.applicationDeadline;


                        const postedDate =
                            job.createdAt ||
                            job.postedAt;


                        const isDeleting =
                            deletingId ===
                            job.id;


                        /*
                         * Show legacy badge if job does not
                         * contain companyId.
                         */

                        const isLegacyJob =
                            !job.companyId;


                        return (

                            <article
                                className="job-card"
                                key={job.id}
                            >


                                {/* =================================
                                    CARD TOP
                                ================================= */}

                                <div className="job-card-top">

                                    <div className="job-company-icon">

                                        <FaBuilding />

                                    </div>


                                    <div className="job-company-info">

                                        <span>
                                            COMPANY
                                        </span>

                                        <strong>
                                            {company}
                                        </strong>

                                    </div>


                                    <div className="job-active-badge">

                                        <FaCheckCircle />

                                        Active

                                    </div>

                                </div>


                                {/* =================================
                                    LEGACY JOB NOTICE
                                ================================= */}

                                {isLegacyJob && (

                                    <div
                                        style={{
                                            marginTop: "10px",
                                            padding: "8px 12px",
                                            borderRadius: "8px",
                                            background: "#fff7ed",
                                            color: "#c2410c",
                                            fontSize: "12px",
                                            fontWeight: "600"
                                        }}
                                    >
                                        Legacy Job — can still be deleted
                                    </div>

                                )}


                                {/* =================================
                                    JOB TITLE
                                ================================= */}

                                <div className="job-title-section">

                                    <h2>
                                        {title}
                                    </h2>

                                </div>


                                {/* =================================
                                    DESCRIPTION
                                ================================= */}

                                <div className="job-description">

                                    <p>
                                        {description}
                                    </p>

                                </div>


                                {/* =================================
                                    JOB DETAILS
                                ================================= */}

                                <div className="job-details">


                                    {/* LOCATION */}

                                    <div className="job-detail">

                                        <div className="job-detail-icon">

                                            <FaMapMarkerAlt />

                                        </div>

                                        <div>

                                            <span>
                                                Location
                                            </span>

                                            <strong>
                                                {location}
                                            </strong>

                                        </div>

                                    </div>


                                    {/* SALARY */}

                                    <div className="job-detail">

                                        <div className="job-detail-icon">

                                            <FaMoneyBillWave />

                                        </div>

                                        <div>

                                            <span>
                                                Salary / Package
                                            </span>

                                            <strong>
                                                {salary}
                                            </strong>

                                        </div>

                                    </div>


                                    {/* DEADLINE */}

                                    <div className="job-detail">

                                        <div className="job-detail-icon">

                                            <FaCalendarAlt />

                                        </div>

                                        <div>

                                            <span>
                                                Application Deadline
                                            </span>

                                            <strong>
                                                {formatDate(
                                                    deadline
                                                )}
                                            </strong>

                                        </div>

                                    </div>


                                    {/* POSTED */}

                                    <div className="job-detail">

                                        <div className="job-detail-icon">

                                            <FaClock />

                                        </div>

                                        <div>

                                            <span>
                                                Posted On
                                            </span>

                                            <strong>
                                                {formatDate(
                                                    postedDate
                                                )}
                                            </strong>

                                        </div>

                                    </div>

                                </div>


                                {/* =================================
                                    SKILLS
                                ================================= */}

                                <div className="job-skills">

                                    <div className="job-skills-title">

                                        <FaCode />

                                        Required Skills

                                    </div>


                                    {skills.length > 0 ? (

                                        <div className="skills-list">

                                            {skills.map(
                                                (
                                                    skill,
                                                    index
                                                ) => (

                                                    <span
                                                        key={`${skill}-${index}`}
                                                    >
                                                        {skill}
                                                    </span>

                                                )
                                            )}

                                        </div>

                                    ) : (

                                        <span className="no-skills">
                                            No specific skills listed
                                        </span>

                                    )}

                                </div>


                                {/* =================================
                                    FOOTER
                                ================================= */}

                                <div className="job-card-footer">

                                    <div className="job-reference">

                                        <FaBriefcase />

                                        <span>
                                            Job ID:
                                        </span>

                                        <strong>
                                            {job.id
                                                .slice(
                                                    0,
                                                    8
                                                )
                                                .toUpperCase()}
                                        </strong>

                                    </div>


                                    <button
                                        type="button"
                                        className="delete-job-button"
                                        disabled={
                                            isDeleting
                                        }
                                        onClick={() =>
                                            deleteJob(
                                                job
                                            )
                                        }
                                    >

                                        <FaTrash />

                                        {isDeleting
                                            ? "Deleting..."
                                            : "Delete Job"}

                                    </button>

                                </div>


                            </article>

                        );

                    })}

                </div>

            )}

        </div>

    );

}


export default ManageJobs;