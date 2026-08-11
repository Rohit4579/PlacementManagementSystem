
import { useEffect, useState } from "react";

import {
    collection,
    query,
    where,
    getDocs,
    deleteDoc,
    doc
} from "firebase/firestore";

import {
    db
} from "../../firebase/firebaseConfig";

import {
    useAuth
} from "../../context/AuthContext";

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
                .map(skill =>
                    String(skill).trim()
                )
                .filter(Boolean);

        }


        if (!skills) {
            return [];
        }


        return String(skills)
            .split(",")
            .map(skill =>
                skill.trim()
            )
            .filter(Boolean);

    };


    /* =========================================================
       FETCH JOBS
    ========================================================= */

    const fetchJobs = async () => {

        if (!user?.uid) {

            setJobs([]);

            setLoading(false);

            return;

        }


        try {

            setLoading(true);

            setError("");


            const jobsQuery = query(

                collection(
                    db,
                    "jobs"
                ),

                where(
                    "companyId",
                    "==",
                    user.uid
                )

            );


            const snapshot =
                await getDocs(
                    jobsQuery
                );


            const jobList =
                snapshot.docs.map(
                    item => ({

                        id: item.id,

                        ...item.data()

                    })
                );


            /* =================================================
               SORT NEWEST FIRST
            ================================================= */

            jobList.sort(
                (a, b) => {

                    const getTime =
                        (value) => {

                            if (
                                value &&
                                typeof value.toDate === "function"
                            ) {

                                return value
                                    .toDate()
                                    .getTime();

                            }


                            const date =
                                new Date(value);


                            return isNaN(
                                date.getTime()
                            )
                                ? 0
                                : date.getTime();

                        };


                    return (
                        getTime(
                            b.createdAt ||
                            b.postedAt
                        ) -
                        getTime(
                            a.createdAt ||
                            a.postedAt
                        )
                    );

                }
            );


            setJobs(jobList);

        }

        catch (error) {

            console.error(
                "Fetch jobs error:",
                error
            );


            setError(
                "Unable to load your jobs. Please try again."
            );

        }

        finally {

            setLoading(false);

        }

    };


    /* =========================================================
       LOAD JOBS
    ========================================================= */

    useEffect(() => {

        fetchJobs();

    }, [user]);


    /* =========================================================
       DELETE JOB
    ========================================================= */

    const deleteJob = async (job) => {

        if (!user?.uid) {

            alert(
                "Please login first."
            );

            return;

        }


        const jobTitle =
            getJobTitle(job);


        const confirmDelete =
            window.confirm(
                `Are you sure you want to delete "${jobTitle}"?`
            );


        if (!confirmDelete) {
            return;
        }


        try {

            setDeletingId(
                job.id
            );


            const jobReference =
                doc(
                    db,
                    "jobs",
                    job.id
                );


            await deleteDoc(
                jobReference
            );


            setJobs(
                previous =>
                    previous.filter(
                        item =>
                            item.id !== job.id
                    )
            );


        }

        catch (error) {

            console.error(
                "Delete job error:",
                error
            );


            alert(
                error.message ||
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
                        onClick={fetchJobs}
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
                            deletingId === job.id;


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
                                        disabled={isDeleting}
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

