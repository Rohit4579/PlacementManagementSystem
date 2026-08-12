import { useCallback, useEffect, useMemo, useState } from "react";

import {
    collection,
    getDocs,
    orderBy,
    query,
    limit
} from "firebase/firestore";

import {
    FaBriefcase,
    FaBuilding,
    FaEnvelope,
    FaMapMarkerAlt,
    FaMoneyBillWave,
    FaCalendarAlt,
    FaEye,
    FaSearch,
    FaTimes,
    FaCheckCircle,
    FaAlignLeft,
    FaSyncAlt,
    FaUserTie,
    FaGraduationCap,
    FaTools
} from "react-icons/fa";

import { db } from "../../firebase/firebaseConfig";

import "./ManageJobs.css";

/* =========================================================
   CONSTANTS
========================================================= */

const MAX_JOBS = 500;

const SEARCH_FIELDS = [
    "jobTitle",
    "companyName",
    "companyEmail",
    "location",
    "salary",
    "deadline",
    "education",
    "skills",
    "description",
    "requirements"
];

/* =========================================================
   SAFE VALUE NORMALIZATION
========================================================= */

const normalize = (value) => {
    if (value === undefined || value === null) {
        return "";
    }

    if (typeof value === "string") {
        return value.trim();
    }

    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }

    if (Array.isArray(value)) {
        return value
            .map((item) => normalize(item))
            .filter(Boolean)
            .join(", ");
    }

    /* Firestore Timestamp */
    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {
        try {
            return value.toDate().toISOString();
        } catch {
            return "";
        }
    }

    /* Firestore Timestamp-like object */
    if (
        typeof value === "object" &&
        typeof value.seconds === "number"
    ) {
        try {
            return new Date(
                value.seconds * 1000
            ).toISOString();
        } catch {
            return "";
        }
    }

    /* Avoid [object Object] */
    if (typeof value === "object") {
        try {
            return JSON.stringify(value);
        } catch {
            return "";
        }
    }

    return String(value);
};

/* =========================================================
   FIRST AVAILABLE FIELD
========================================================= */

const getFirstValue = (data, fields) => {
    for (const field of fields) {
        const value = data?.[field];

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {
            return normalize(value);
        }
    }

    return "";
};

/* =========================================================
   DATE FORMAT
========================================================= */

const formatDate = (value) => {
    if (!value) {
        return "Not specified";
    }

    try {
        let date;

        if (
            typeof value === "object" &&
            typeof value.toDate === "function"
        ) {
            date = value.toDate();
        } else if (
            typeof value === "object" &&
            typeof value.seconds === "number"
        ) {
            date = new Date(value.seconds * 1000);
        } else {
            date = new Date(value);
        }

        if (Number.isNaN(date.getTime())) {
            return normalize(value) || "Not specified";
        }

        return date.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    } catch {
        return normalize(value) || "Not specified";
    }
};

/* =========================================================
   SALARY FORMAT
========================================================= */

const formatSalary = (salary) => {
    const value = normalize(salary);

    return value || "Not specified";
};

/* =========================================================
   JOB INITIAL
========================================================= */

const getJobInitial = (title) => {
    const name = normalize(title);

    return name
        ? name.charAt(0).toUpperCase()
        : "J";
};

/* =========================================================
   NORMALIZE FIRESTORE JOB
========================================================= */

const normalizeJob = (firestoreDoc) => {
    const data = firestoreDoc.data() || {};

    return {
        id: firestoreDoc.id,

        jobTitle: getFirstValue(
            data,
            [
                "jobTitle",
                "title",
                "jobName",
                "position",
                "role"
            ]
        ),

        companyName: getFirstValue(
            data,
            [
                "companyName",
                "company",
                "company_name",
                "organization"
            ]
        ),

        companyEmail: getFirstValue(
            data,
            [
                "companyEmail",
                "email",
                "company_email"
            ]
        ),

        location: getFirstValue(
            data,
            [
                "location",
                "jobLocation",
                "city",
                "place"
            ]
        ),

        salary: getFirstValue(
            data,
            [
                "salary",
                "package",
                "ctc",
                "salaryPackage",
                "pay"
            ]
        ),

        deadline: getFirstValue(
            data,
            [
                "deadline",
                "applicationDeadline",
                "lastDate",
                "lastDateToApply",
                "closingDate"
            ]
        ),

        education: getFirstValue(
            data,
            [
                "education",
                "qualification",
                "qualificationRequired",
                "educationalQualification"
            ]
        ),

        skills: getFirstValue(
            data,
            [
                "skills",
                "requiredSkills",
                "technicalSkills",
                "skill"
            ]
        ),

        description: getFirstValue(
            data,
            [
                "description",
                "jobDescription",
                "aboutJob",
                "details"
            ]
        ),

        requirements: getFirstValue(
            data,
            [
                "requirements",
                "jobRequirements",
                "responsibilities",
                "eligibility"
            ]
        )
    };
};

/* =========================================================
   COMPONENT
========================================================= */

function ManageJobs() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [search, setSearch] = useState("");
    const [selectedJob, setSelectedJob] = useState(null);

    const [error, setError] = useState("");

    /* =====================================================
       FETCH JOBS
    ===================================================== */

    const fetchJobs = useCallback(
        async ({ silent = false } = {}) => {
            try {
                setError("");

                if (silent) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                const jobsRef = collection(db, "jobs");

                const jobsQuery = query(
                    jobsRef,
                    orderBy("createdAt", "desc"),
                    limit(MAX_JOBS)
                );

                const snapshot = await getDocs(jobsQuery);

                const jobsData = snapshot.docs.map(normalizeJob);

                setJobs(jobsData);
            } catch (error) {
                console.error(
                    "Manage Jobs fetch error:",
                    error
                );

                setError(
                    error?.code === "permission-denied"
                        ? "You do not have permission to view job listings."
                        : "Unable to load job listings."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );

    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    /* =====================================================
       ESCAPE MODAL
    ===================================================== */

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setSelectedJob(null);
            }
        };

        if (selectedJob) {
            document.addEventListener(
                "keydown",
                handleEscape
            );
        }

        return () => {
            document.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, [selectedJob]);

    /* =====================================================
       BODY SCROLL LOCK
    ===================================================== */

    useEffect(() => {
        if (!selectedJob) {
            return;
        }

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow =
                previousOverflow;
        };
    }, [selectedJob]);

    /* =====================================================
       SEARCH
    ===================================================== */

    const filteredJobs = useMemo(() => {
        const searchText = search
            .trim()
            .toLocaleLowerCase();

        if (!searchText) {
            return jobs;
        }

        return jobs.filter((job) => {
            const searchableText = SEARCH_FIELDS
                .map((field) =>
                    normalize(job[field])
                )
                .join(" ")
                .toLocaleLowerCase();

            return searchableText.includes(searchText);
        });
    }, [jobs, search]);

    /* =====================================================
       VIEW JOB
    ===================================================== */

    const viewJob = (job) => {
        setSelectedJob(job);
    };

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <div className="manage-jobs-page">
                <div className="jobs-loading-state">
                    <div
                        className="jobs-loading-spinner"
                        aria-hidden="true"
                    />

                    <h3>
                        Loading Jobs
                    </h3>

                    <p>
                        Fetching registered job listings...
                    </p>
                </div>
            </div>
        );
    }

    /* =====================================================
       PAGE
    ===================================================== */

    return (
        <div className="manage-jobs-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="jobs-page-header">

                <div className="jobs-header-content">

                    <span className="jobs-page-eyebrow">
                        TPO / ADMIN
                    </span>

                    <h1>
                        Manage Jobs
                    </h1>

                    <p>
                        View, search and manage all registered
                        job listings.
                    </p>

                </div>

                <div className="jobs-total-card">

                    <div className="jobs-total-icon">
                        <FaBriefcase />
                    </div>

                    <div className="jobs-total-content">

                        <span>
                            Total Jobs
                        </span>

                        <strong>
                            {jobs.length}
                        </strong>

                    </div>

                </div>

            </header>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div
                    className="jobs-error-banner"
                    role="alert"
                >
                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() => fetchJobs()}
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* =================================================
                SEARCH TOOLBAR
            ================================================= */}

            <section
                className="jobs-toolbar"
                aria-label="Job search controls"
            >

                <div className="jobs-search-wrapper">

                    <div className="jobs-search-box">

                        <span
                            className="jobs-search-icon-container"
                            aria-hidden="true"
                        >
                            <FaSearch />
                        </span>

                        <input
                            id="job-search"
                            type="search"
                            value={search}
                            placeholder="Search jobs, companies, locations, skills..."
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                            aria-label="Search jobs"
                            autoComplete="off"
                            spellCheck="false"
                        />

                        {search && (
                            <button
                                type="button"
                                className="jobs-clear-search"
                                onClick={() =>
                                    setSearch("")
                                }
                                aria-label="Clear search"
                            >
                                <FaTimes />
                            </button>
                        )}

                    </div>

                    {search && (
                        <span className="jobs-search-hint">
                            Searching {filteredJobs.length} matching
                            job{filteredJobs.length === 1 ? "" : "s"}.
                        </span>
                    )}

                </div>

                <div className="jobs-toolbar-right">

                    <div
                        className="jobs-result-text"
                        aria-live="polite"
                    >
                        <span>
                            Showing
                        </span>

                        <strong>
                            {filteredJobs.length}
                        </strong>

                        <span>
                            of
                        </span>

                        <strong>
                            {jobs.length}
                        </strong>

                        <span>
                            jobs
                        </span>
                    </div>

                    <button
                        type="button"
                        className="jobs-refresh-btn"
                        onClick={() =>
                            fetchJobs({
                                silent: true
                            })
                        }
                        disabled={refreshing}
                    >
                        <FaSyncAlt
                            className={
                                refreshing
                                    ? "jobs-refresh-spinning"
                                    : ""
                            }
                        />

                        <span>
                            {refreshing
                                ? "Refreshing..."
                                : "Refresh"}
                        </span>
                    </button>

                </div>

            </section>

            {/* =================================================
                EMPTY
            ================================================= */}

            {filteredJobs.length === 0 && (
                <div className="jobs-empty-state">

                    <div className="jobs-empty-icon">
                        <FaBriefcase />
                    </div>

                    <h3>
                        No Jobs Found
                    </h3>

                    <p>
                        {jobs.length === 0
                            ? "No jobs have been registered yet."
                            : "No jobs match your current search."
                        }
                    </p>

                    {search && (
                        <button
                            type="button"
                            className="jobs-empty-clear"
                            onClick={() =>
                                setSearch("")
                            }
                        >
                            Clear Search
                        </button>
                    )}

                </div>
            )}

            {/* =================================================
                DESKTOP TABLE
            ================================================= */}

            {filteredJobs.length > 0 && (
                <section className="jobs-table-card">

                    <div className="jobs-table-scroll">

                        <table className="jobs-table">

                            {/* Explicit column sizing keeps
                                Actions/View perfectly aligned. */}
                            <colgroup>
                                <col className="job-col" />
                                <col className="company-col" />
                                <col className="location-col" />
                                <col className="salary-col" />
                                <col className="deadline-col" />
                                <col className="actions-col" />
                            </colgroup>

                            <thead>
                                <tr>

                                    <th className="job-column">
                                        Job
                                    </th>

                                    <th className="company-column">
                                        Company
                                    </th>

                                    <th className="location-column">
                                        Location
                                    </th>

                                    <th className="salary-column">
                                        Salary
                                    </th>

                                    <th className="deadline-column">
                                        Deadline
                                    </th>

                                    <th className="actions-column">
                                        Actions
                                    </th>

                                </tr>
                            </thead>

                            <tbody>

                                {filteredJobs.map((job) => (
                                    <tr key={job.id}>

                                        {/* JOB */}

                                        <td className="job-column">

                                            <div className="job-table-profile">

                                                <div className="job-table-avatar">
                                                    {getJobInitial(
                                                        job.jobTitle
                                                    )}
                                                </div>

                                                <div className="job-table-name">

                                                    <strong
                                                        title={
                                                            job.jobTitle ||
                                                            "Untitled Job"
                                                        }
                                                    >
                                                        {job.jobTitle ||
                                                            "Untitled Job"}
                                                    </strong>

                                                    <span>
                                                        Job listing
                                                    </span>

                                                </div>

                                            </div>

                                        </td>

                                        {/* COMPANY */}

                                        <td className="company-column">

                                            <div className="job-company-info">

                                                <div className="job-company-name">

                                                    <FaBuilding />

                                                    <strong
                                                        title={
                                                            job.companyName ||
                                                            "Not specified"
                                                        }
                                                    >
                                                        {job.companyName ||
                                                            "Not specified"}
                                                    </strong>

                                                </div>

                                                {job.companyEmail && (
                                                    <div
                                                        className="job-company-email"
                                                        title={
                                                            job.companyEmail
                                                        }
                                                    >
                                                        <FaEnvelope />

                                                        <span>
                                                            {
                                                                job.companyEmail
                                                            }
                                                        </span>
                                                    </div>
                                                )}

                                            </div>

                                        </td>

                                        {/* LOCATION */}

                                        <td className="location-column">

                                            {job.location ? (
                                                <div
                                                    className="job-location"
                                                    title={
                                                        job.location
                                                    }
                                                >
                                                    <FaMapMarkerAlt />

                                                    <span>
                                                        {
                                                            job.location
                                                        }
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="job-muted-text">
                                                    Not available
                                                </span>
                                            )}

                                        </td>

                                        {/* SALARY */}

                                        <td className="salary-column">

                                            <span
                                                className="job-salary-badge"
                                                title={
                                                    formatSalary(
                                                        job.salary
                                                    )
                                                }
                                            >
                                                <FaMoneyBillWave />

                                                <span>
                                                    {
                                                        formatSalary(
                                                            job.salary
                                                        )
                                                    }
                                                </span>
                                            </span>

                                        </td>

                                        {/* DEADLINE */}

                                        <td className="deadline-column">

                                            <div className="job-deadline">

                                                <FaCalendarAlt />

                                                <span>
                                                    {
                                                        formatDate(
                                                            job.deadline
                                                        )
                                                    }
                                                </span>

                                            </div>

                                        </td>

                                        {/* ACTIONS */}

                                        <td className="actions-column">

                                            <div className="job-action-buttons">

                                                <button
                                                    type="button"
                                                    className="job-view-btn"
                                                    onClick={() =>
                                                        viewJob(job)
                                                    }
                                                    aria-label={`View ${job.jobTitle || "job"} details`}
                                                >
                                                    <FaEye />

                                                    <span>
                                                        View
                                                    </span>
                                                </button>

                                            </div>

                                        </td>

                                    </tr>
                                ))}

                            </tbody>

                        </table>

                    </div>

                </section>
            )}

            {/* =================================================
                MOBILE CARDS
            ================================================= */}

            {filteredJobs.length > 0 && (
                <section className="jobs-mobile-list">

                    {filteredJobs.map((job) => (
                        <article
                            className="job-mobile-card"
                            key={job.id}
                        >

                            <div className="job-mobile-top">

                                <div className="job-mobile-profile">

                                    <div className="job-mobile-avatar">
                                        {getJobInitial(
                                            job.jobTitle
                                        )}
                                    </div>

                                    <div>

                                        <h3>
                                            {job.jobTitle ||
                                                "Untitled Job"}
                                        </h3>

                                        <span>
                                            {job.companyName ||
                                                "Company not specified"}
                                        </span>

                                    </div>

                                </div>

                                <span className="job-status-badge">

                                    <FaCheckCircle />

                                    Active

                                </span>

                            </div>

                            <div className="job-mobile-details">

                                <div className="mobile-job-detail-item">

                                    <span className="mobile-job-detail-label">
                                        <FaBuilding />
                                        Company
                                    </span>

                                    <strong>
                                        {job.companyName ||
                                            "Not available"}
                                    </strong>

                                </div>

                                <div className="mobile-job-detail-item">

                                    <span className="mobile-job-detail-label">
                                        <FaMapMarkerAlt />
                                        Location
                                    </span>

                                    <strong>
                                        {job.location ||
                                            "Not available"}
                                    </strong>

                                </div>

                                <div className="mobile-job-detail-item">

                                    <span className="mobile-job-detail-label">
                                        <FaMoneyBillWave />
                                        Salary
                                    </span>

                                    <strong>
                                        {
                                            formatSalary(
                                                job.salary
                                            )
                                        }
                                    </strong>

                                </div>

                                <div className="mobile-job-detail-item">

                                    <span className="mobile-job-detail-label">
                                        <FaCalendarAlt />
                                        Deadline
                                    </span>

                                    <strong>
                                        {
                                            formatDate(
                                                job.deadline
                                            )
                                        }
                                    </strong>

                                </div>

                                <div className="mobile-job-detail-item mobile-job-full-width">

                                    <span className="mobile-job-detail-label">
                                        <FaEnvelope />
                                        Company Email
                                    </span>

                                    <strong>
                                        {job.companyEmail ||
                                            "Not available"}
                                    </strong>

                                </div>

                            </div>

                            <div className="job-mobile-actions">

                                <button
                                    type="button"
                                    className="job-view-btn"
                                    onClick={() =>
                                        viewJob(job)
                                    }
                                    aria-label={`View ${job.jobTitle || "job"} details`}
                                >
                                    <FaEye />

                                    <span>
                                        View Details
                                    </span>
                                </button>

                            </div>

                        </article>
                    ))}

                </section>
            )}

            {/* =================================================
                JOB MODAL
            ================================================= */}

            {selectedJob && (
                <div
                    className="job-modal-overlay"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setSelectedJob(null);
                        }
                    }}
                    role="presentation"
                >

                    <div
                        className="job-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="job-modal-title"
                    >

                        {/* MODAL HEADER */}

                        <div className="job-modal-header">

                            <div className="job-modal-avatar">
                                {getJobInitial(
                                    selectedJob.jobTitle
                                )}
                            </div>

                            <div className="job-modal-title">

                                <span>
                                    JOB LISTING
                                </span>

                                <h2 id="job-modal-title">
                                    {selectedJob.jobTitle ||
                                        "Untitled Job"}
                                </h2>

                                <p>
                                    {selectedJob.companyName ||
                                        "Company not specified"}
                                </p>

                            </div>

                            <button
                                type="button"
                                className="job-modal-close"
                                onClick={() =>
                                    setSelectedJob(null)
                                }
                                aria-label="Close job details"
                            >
                                <FaTimes />
                            </button>

                        </div>

                        {/* MODAL BODY */}

                        <div className="job-modal-body">

                            {/* BASIC INFORMATION */}

                            <section className="job-modal-section">

                                <div className="job-modal-section-heading">

                                    <div className="job-section-icon">
                                        <FaBriefcase />
                                    </div>

                                    <div>
                                        <h3>
                                            Job Information
                                        </h3>

                                        <p>
                                            Basic information about this
                                            job listing.
                                        </p>
                                    </div>

                                </div>

                                <div className="job-detail-grid">

                                    <div className="job-detail-item">

                                        <span>
                                            <FaBriefcase />
                                            Job Title
                                        </span>

                                        <strong>
                                            {selectedJob.jobTitle ||
                                                "Not available"}
                                        </strong>

                                    </div>

                                    <div className="job-detail-item">

                                        <span>
                                            <FaBuilding />
                                            Company
                                        </span>

                                        <strong>
                                            {selectedJob.companyName ||
                                                "Not available"}
                                        </strong>

                                    </div>

                                    <div className="job-detail-item">

                                        <span>
                                            <FaEnvelope />
                                            Company Email
                                        </span>

                                        <strong className="long-value">
                                            {selectedJob.companyEmail ||
                                                "Not available"}
                                        </strong>

                                    </div>

                                    <div className="job-detail-item">

                                        <span>
                                            <FaMapMarkerAlt />
                                            Location
                                        </span>

                                        <strong>
                                            {selectedJob.location ||
                                                "Not available"}
                                        </strong>

                                    </div>

                                    <div className="job-detail-item">

                                        <span>
                                            <FaMoneyBillWave />
                                            Salary
                                        </span>

                                        <strong>
                                            {
                                                formatSalary(
                                                    selectedJob.salary
                                                )
                                            }
                                        </strong>

                                    </div>

                                    <div className="job-detail-item">

                                        <span>
                                            <FaCalendarAlt />
                                            Application Deadline
                                        </span>

                                        <strong>
                                            {
                                                formatDate(
                                                    selectedJob.deadline
                                                )
                                            }
                                        </strong>

                                    </div>

                                    <div className="job-detail-item full-width">

                                        <span>
                                            <FaGraduationCap />
                                            Education / Qualification
                                        </span>

                                        <strong>
                                            {selectedJob.education ||
                                                "Not specified"}
                                        </strong>

                                    </div>

                                </div>

                            </section>

                            {/* SKILLS */}

                            <section className="job-modal-section">

                                <div className="job-modal-section-heading">

                                    <div className="job-section-icon">
                                        <FaTools />
                                    </div>

                                    <div>

                                        <h3>
                                            Required Skills
                                        </h3>

                                        <p>
                                            Skills required for this
                                            position.
                                        </p>

                                    </div>

                                </div>

                                <div className="job-skills-box">

                                    <FaTools />

                                    <p>
                                        {selectedJob.skills ||
                                            "No specific skills have been added."}
                                    </p>

                                </div>

                            </section>

                            {/* DESCRIPTION */}

                            <section className="job-modal-section">

                                <div className="job-modal-section-heading">

                                    <div className="job-section-icon">
                                        <FaAlignLeft />
                                    </div>

                                    <div>

                                        <h3>
                                            Job Description
                                        </h3>

                                        <p>
                                            Description and overview of
                                            this position.
                                        </p>

                                    </div>

                                </div>

                                <div className="job-description">

                                    <FaAlignLeft />

                                    <p>
                                        {selectedJob.description ||
                                            "No job description has been added."}
                                    </p>

                                </div>

                            </section>

                            {/* REQUIREMENTS */}

                            <section className="job-modal-section">

                                <div className="job-modal-section-heading">

                                    <div className="job-section-icon">
                                        <FaUserTie />
                                    </div>

                                    <div>

                                        <h3>
                                            Requirements
                                        </h3>

                                        <p>
                                            Eligibility, responsibilities
                                            and other requirements.
                                        </p>

                                    </div>

                                </div>

                                <div className="job-requirements">

                                    <FaUserTie />

                                    <p>
                                        {selectedJob.requirements ||
                                            "No additional requirements have been added."}
                                    </p>

                                </div>

                            </section>

                        </div>

                        {/* MODAL FOOTER */}

                        <div className="job-modal-footer">

                            <div className="job-modal-status">

                                <FaCheckCircle />

                                <span>
                                    Active job listing
                                </span>

                            </div>

                            <div className="job-modal-actions">

                                <button
                                    type="button"
                                    className="job-modal-close-btn"
                                    onClick={() =>
                                        setSelectedJob(null)
                                    }
                                >
                                    Close
                                </button>

                            </div>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}

export default ManageJobs;