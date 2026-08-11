import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import {
    collection,
    getDocs,
    deleteDoc,
    doc,
    orderBy,
    query
} from "firebase/firestore";

import {
    FaBriefcase,
    FaBuilding,
    FaMapMarkerAlt,
    FaMoneyBillWave,
    FaCalendarAlt,
    FaGraduationCap,
    FaCode,
    FaUserTie,
    FaEnvelope,
    FaClock,
    FaEye,
    FaTrash,
    FaTimes,
    FaSearch,
    FaSyncAlt,
    FaCheckCircle,
    FaLayerGroup,
    FaChartLine
} from "react-icons/fa";

import { db } from "../../firebase/firebaseConfig";

import "./ManageJobs.css";

function ManageJobs() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [deletingId, setDeletingId] = useState(null);
    const [selectedJob, setSelectedJob] = useState(null);

    /* =====================================================
       NORMALIZE VALUE
    ===================================================== */

    const normalize = useCallback((value) => {
        if (value === undefined || value === null) {
            return "";
        }

        if (Array.isArray(value)) {
            return value.join(", ");
        }

        if (
            typeof value === "object" &&
            typeof value.toDate === "function"
        ) {
            return value.toDate().toISOString();
        }

        return String(value);
    }, []);

    /* =====================================================
       FETCH JOBS
    ===================================================== */

    const fetchJobs = useCallback(async () => {
        try {
            setLoading(true);

            const jobsRef = collection(db, "jobs");
            let jobsData = [];

            try {
                const jobsQuery = query(
                    jobsRef,
                    orderBy("createdAt", "desc")
                );

                const snapshot = await getDocs(jobsQuery);

                jobsData = snapshot.docs.map((item) => ({
                    id: item.id,
                    ...item.data()
                }));
            } catch (orderedError) {
                console.warn(
                    "Ordered query failed. Using fallback:",
                    orderedError
                );

                const snapshot = await getDocs(jobsRef);

                jobsData = snapshot.docs.map((item) => ({
                    id: item.id,
                    ...item.data()
                }));

                jobsData.sort((a, b) => {
                    const getTime = (value) => {
                        if (
                            value &&
                            typeof value.toDate === "function"
                        ) {
                            return value.toDate().getTime();
                        }

                        if (value && value.seconds) {
                            return Number(value.seconds) * 1000;
                        }

                        const date = new Date(value);

                        return Number.isNaN(date.getTime())
                            ? 0
                            : date.getTime();
                    };

                    return (
                        getTime(b.createdAt) -
                        getTime(a.createdAt)
                    );
                });
            }

            setJobs(jobsData);
        } catch (error) {
            console.error("Jobs Fetch Error:", error);
            setJobs([]);
        } finally {
            setLoading(false);
        }
    }, []);

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

        window.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, []);

    /* =====================================================
       DELETE JOB
    ===================================================== */

    const deleteJob = async (jobId) => {
        if (!jobId) return;

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this job?"
        );

        if (!confirmDelete) return;

        try {
            setDeletingId(jobId);

            await deleteDoc(
                doc(db, "jobs", jobId)
            );

            setJobs((previousJobs) =>
                previousJobs.filter(
                    (job) => job.id !== jobId
                )
            );

            if (selectedJob?.id === jobId) {
                setSelectedJob(null);
            }

            window.alert(
                "Job deleted successfully."
            );
        } catch (error) {
            console.error(
                "Delete Job Error:",
                error
            );

            window.alert(
                error?.message ||
                "Unable to delete job."
            );
        } finally {
            setDeletingId(null);
        }
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

            if (value.seconds !== undefined) {
                return new Date(
                    Number(value.seconds) * 1000
                ).toLocaleDateString(
                    "en-IN",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    }
                );
            }

            const date = new Date(value);

            if (!Number.isNaN(date.getTime())) {
                return date.toLocaleDateString(
                    "en-IN",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    }
                );
            }

            return String(value);
        } catch {
            return "Not Available";
        }
    };

    /* =====================================================
       FORMAT DATE TIME
    ===================================================== */

    const formatDateTime = (value) => {
        if (!value) {
            return "Not Available";
        }

        try {
            let date;

            if (
                value &&
                typeof value.toDate === "function"
            ) {
                date = value.toDate();
            } else if (
                value &&
                value.seconds !== undefined
            ) {
                date = new Date(
                    Number(value.seconds) * 1000
                );
            } else {
                date = new Date(value);
            }

            if (Number.isNaN(date.getTime())) {
                return "Not Available";
            }

            return date.toLocaleString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );
        } catch {
            return "Not Available";
        }
    };

    /* =====================================================
       FILTER JOBS
    ===================================================== */

    const filteredJobs = useMemo(() => {
        const searchText = search
            .trim()
            .toLowerCase();

        return jobs.filter((job) => {
            const eligibility =
                job.eligibility || {};

            const searchableText = [
                job.title,
                job.jobTitle,
                job.companyName,
                job.company,
                job.location,
                job.description,
                job.jobDescription,
                job.skills,
                job.requiredSkills,
                job.salary,
                job.package,
                job.ctc,
                job.jobType,
                job.type,
                eligibility.education,
                eligibility.branches,
                eligibility.experience,
                eligibility.minimum10th,
                eligibility.minimum12th,
                eligibility.minimumCGPA
            ]
                .map(normalize)
                .join(" ")
                .toLowerCase();

            return (
                !searchText ||
                searchableText.includes(searchText)
            );
        });
    }, [
        jobs,
        search,
        normalize
    ]);

    /* =====================================================
       COMPANY COUNT
    ===================================================== */

    const companyCount = useMemo(() => {
        const companies = jobs
            .map((job) => {
                return (
                    normalize(job.companyId).trim() ||
                    normalize(
                        job.companyName ||
                        job.company
                    ).trim()
                );
            })
            .filter(Boolean);

        return new Set(companies).size;
    }, [jobs, normalize]);

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
            <div className="admin-jobs-page">
                <div className="admin-jobs-loading">
                    <div className="loading-spinner"></div>

                    <p>
                        Loading jobs...
                    </p>
                </div>
            </div>
        );
    }

    /* =====================================================
       PAGE
    ===================================================== */

    return (
        <div className="admin-jobs-page">

            {/* HEADER */}

            <div className="admin-jobs-header">

                <div>
                    <span className="admin-page-label">
                        TPO / ADMIN
                    </span>

                    <h1>
                        Manage Jobs
                    </h1>

                    <p>
                        Monitor and manage all
                        job opportunities posted
                        by companies.
                    </p>
                </div>

                <div className="jobs-total">
                    <span>
                        Total Jobs
                    </span>

                    <strong>
                        {jobs.length}
                    </strong>
                </div>

            </div>

            {/* STAT CARDS */}

            <div className="job-stat-grid">

                <div className="job-stat-card">

                    <div className="job-stat-icon blue">
                        <FaBriefcase />
                    </div>

                    <div>
                        <span>
                            Total Jobs
                        </span>

                        <strong>
                            {jobs.length}
                        </strong>
                    </div>

                </div>

                <div className="job-stat-card">

                    <div className="job-stat-icon purple">
                        <FaSearch />
                    </div>

                    <div>
                        <span>
                            Showing
                        </span>

                        <strong>
                            {filteredJobs.length}
                        </strong>
                    </div>

                </div>

                <div className="job-stat-card">

                    <div className="job-stat-icon green">
                        <FaBuilding />
                    </div>

                    <div>
                        <span>
                            Companies
                        </span>

                        <strong>
                            {companyCount}
                        </strong>
                    </div>

                </div>

            </div>

            {/* FILTER BAR */}

            <div className="jobs-filter-card">

                <div className="search-wrapper">

                    <FaSearch className="search-icon" />

                    <input
                        type="text"
                        placeholder="Search by job title, company, location or skills..."
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                    />

                    {search && (
                        <button
                            type="button"
                            className="clear-search-btn"
                            onClick={() =>
                                setSearch("")
                            }
                            aria-label="Clear search"
                        >
                            <FaTimes />
                        </button>
                    )}

                </div>

                <button
                    type="button"
                    className="refresh-btn"
                    onClick={fetchJobs}
                    disabled={loading}
                >
                    <FaSyncAlt />
                    Refresh
                </button>

            </div>

            {/* EMPTY */}

            {filteredJobs.length === 0 && (
                <div className="jobs-empty">

                    <div className="empty-icon">
                        <FaBriefcase />
                    </div>

                    <h2>
                        No Jobs Found
                    </h2>

                    <p>
                        {jobs.length === 0
                            ? "No companies have posted any jobs yet."
                            : "No jobs match your current search."
                        }
                    </p>

                    {search && (
                        <button
                            type="button"
                            className="empty-clear-btn"
                            onClick={() =>
                                setSearch("")
                            }
                        >
                            Clear Search
                        </button>
                    )}

                </div>
            )}

            {/* TABLE */}

            {filteredJobs.length > 0 && (
                <div className="jobs-table-card">

                    <div className="table-header">

                        <div>
                            <h2>
                                Job Listings
                            </h2>

                            <p>
                                View complete job information
                                or remove a listing.
                            </p>
                        </div>

                        <span>
                            {filteredJobs.length}{" "}
                            job
                            {filteredJobs.length !== 1
                                ? "s"
                                : ""}
                        </span>

                    </div>

                    <div className="table-wrapper">

                        <table>

                            {/* =================================================
                                FIXED COLUMN WIDTHS
                            ================================================= */}

                            <colgroup>
                                <col className="job-col" />
                                <col className="company-col" />
                                <col className="location-col" />
                                <col className="salary-col" />
                                <col className="deadline-col" />
                                <col className="action-col" />
                            </colgroup>

                            <thead>
                                <tr>

                                    <th>
                                        Job
                                    </th>

                                    <th>
                                        Company
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

                                    <th className="action-header">
                                        Action
                                    </th>

                                </tr>
                            </thead>

                            <tbody>

                                {filteredJobs.map(
                                    (job) => {

                                        const title =
                                            normalize(
                                                job.title ||
                                                job.jobTitle
                                            ) ||
                                            "Untitled Job";

                                        const company =
                                            normalize(
                                                job.companyName ||
                                                job.company
                                            ) ||
                                            "Unknown Company";

                                        const location =
                                            normalize(
                                                job.location
                                            ) ||
                                            "Not Available";

                                        const salary =
                                            normalize(
                                                job.salary ||
                                                job.package ||
                                                job.ctc
                                            ) ||
                                            "Not Available";

                                        const deadline =
                                            job.deadline ||
                                            job.lastDate ||
                                            job.applicationDeadline;

                                        return (
                                            <tr key={job.id}>

                                                {/* JOB */}

                                                <td>
                                                    <div className="job-title-cell">

                                                        <div className="job-icon">
                                                            <FaBriefcase />
                                                        </div>

                                                        <div>
                                                            <strong>
                                                                {title}
                                                            </strong>
                                                        </div>

                                                    </div>
                                                </td>

                                                {/* COMPANY */}

                                                <td>
                                                    <div className="company-cell">

                                                        <strong>
                                                            {company}
                                                        </strong>

                                                        <small>
                                                            {normalize(
                                                                job.companyEmail
                                                            ) ||
                                                                "Email unavailable"}
                                                        </small>

                                                    </div>
                                                </td>

                                                {/* LOCATION */}

                                                <td>
                                                    <span className="location-text">

                                                        <FaMapMarkerAlt />

                                                        {location}

                                                    </span>
                                                </td>

                                                {/* SALARY */}

                                                <td>
                                                    <span className="salary-cell">

                                                        <FaMoneyBillWave />

                                                        {salary}

                                                    </span>
                                                </td>

                                                {/* DEADLINE */}

                                                <td>
                                                    <span className="deadline-cell">

                                                        <FaCalendarAlt />

                                                        {formatDate(
                                                            deadline
                                                        )}

                                                    </span>
                                                </td>

                                                {/* ACTION */}

                                                <td className="action-cell">

                                                    <div className="job-actions">

                                                        <button
                                                            type="button"
                                                            className="view-job-btn"
                                                            onClick={() =>
                                                                viewJob(job)
                                                            }
                                                            title="View complete job details"
                                                        >
                                                            <FaEye />

                                                            <span>
                                                                View
                                                            </span>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="delete-job-btn"
                                                            onClick={() =>
                                                                deleteJob(
                                                                    job.id
                                                                )
                                                            }
                                                            disabled={
                                                                deletingId ===
                                                                job.id
                                                            }
                                                            title="Delete job"
                                                        >
                                                            <FaTrash />

                                                            <span>
                                                                {deletingId ===
                                                                job.id
                                                                    ? "Deleting..."
                                                                    : "Delete"}
                                                            </span>
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>
                                        );
                                    }
                                )}

                            </tbody>

                        </table>

                    </div>

                </div>
            )}

            {/* =====================================================
                VIEW JOB MODAL
            ===================================================== */}

            {selectedJob && (
                <div
                    className="job-modal-overlay"
                    onClick={() =>
                        setSelectedJob(null)
                    }
                >

                    <div
                        className="job-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        {/* MODAL HEADER */}

                        <div className="job-modal-header">

                            <div className="modal-title-area">

                                <div className="modal-job-icon">
                                    <FaBriefcase />
                                </div>

                                <div>

                                    <span>
                                        JOB DETAILS
                                    </span>

                                    <h2>
                                        {normalize(
                                            selectedJob.jobTitle ||
                                            selectedJob.title
                                        ) ||
                                            "Untitled Job"}
                                    </h2>

                                    <p>
                                        {normalize(
                                            selectedJob.companyName ||
                                            selectedJob.company
                                        ) ||
                                            "Unknown Company"}
                                    </p>

                                </div>

                            </div>

                            <button
                                type="button"
                                className="modal-close-btn"
                                onClick={() =>
                                    setSelectedJob(null)
                                }
                                aria-label="Close"
                            >
                                <FaTimes />
                            </button>

                        </div>

                        {/* MODAL BODY */}

                        <div className="job-modal-body">

                            {/* JOB INFORMATION */}

                            <div className="modal-section">

                                <div className="modal-section-title">

                                    <div>
                                        <FaBriefcase />
                                    </div>

                                    <div>
                                        <h3>
                                            Job Information
                                        </h3>

                                        <p>
                                            Basic details about
                                            the position.
                                        </p>
                                    </div>

                                </div>

                                <div className="detail-grid">

                                    <div className="detail-item">

                                        <span>
                                            <FaBriefcase />
                                            Job Title
                                        </span>

                                        <strong>
                                            {normalize(
                                                selectedJob.jobTitle ||
                                                selectedJob.title
                                            ) ||
                                                "Not Available"}
                                        </strong>

                                    </div>

                                    <div className="detail-item">

                                        <span>
                                            <FaMapMarkerAlt />
                                            Location
                                        </span>

                                        <strong>
                                            {normalize(
                                                selectedJob.location
                                            ) ||
                                                "Not Available"}
                                        </strong>

                                    </div>

                                    <div className="detail-item">

                                        <span>
                                            <FaMoneyBillWave />
                                            Salary / Package
                                        </span>

                                        <strong className="salary-highlight">
                                            {normalize(
                                                selectedJob.salary ||
                                                selectedJob.package ||
                                                selectedJob.ctc
                                            ) ||
                                                "Not Available"}
                                        </strong>

                                    </div>

                                    <div className="detail-item">

                                        <span>
                                            <FaCalendarAlt />
                                            Application Deadline
                                        </span>

                                        <strong>
                                            {formatDate(
                                                selectedJob.deadline ||
                                                selectedJob.lastDate ||
                                                selectedJob.applicationDeadline
                                            )}
                                        </strong>

                                    </div>

                                    <div className="detail-item full-detail">

                                        <span>
                                            <FaCode />
                                            Required Skills
                                        </span>

                                        <strong>
                                            {normalize(
                                                selectedJob.skills ||
                                                selectedJob.requiredSkills
                                            ) ||
                                                "Not Available"}
                                        </strong>

                                    </div>

                                    <div className="detail-item full-detail description-item">

                                        <span>
                                            Job Description
                                        </span>

                                        <div className="description-text">
                                            {normalize(
                                                selectedJob.jobDescription ||
                                                selectedJob.description
                                            ) ||
                                                "No job description provided."}
                                        </div>

                                    </div>

                                </div>

                            </div>

                            {/* ELIGIBILITY */}

                            <div className="modal-section">

                                <div className="modal-section-title">

                                    <div className="eligibility-icon">
                                        <FaGraduationCap />
                                    </div>

                                    <div>
                                        <h3>
                                            Eligibility Criteria
                                        </h3>

                                        <p>
                                            Academic and experience
                                            requirements.
                                        </p>
                                    </div>

                                </div>

                                <div className="eligibility-grid">

                                    <div className="eligibility-card">

                                        <FaGraduationCap />

                                        <span>
                                            Minimum Education
                                        </span>

                                        <strong>
                                            {normalize(
                                                selectedJob
                                                    .eligibility
                                                    ?.education
                                            ) ||
                                                "Not Specified"}
                                        </strong>

                                    </div>

                                    <div className="eligibility-card">

                                        <FaUserTie />

                                        <span>
                                            Experience
                                        </span>

                                        <strong>
                                            {normalize(
                                                selectedJob
                                                    .eligibility
                                                    ?.experience
                                            ) ||
                                                "Not Specified"}
                                        </strong>

                                    </div>

                                    <div className="eligibility-card">

                                        <FaChartLine />

                                        <span>
                                            Minimum 10th
                                        </span>

                                        <strong>
                                            {selectedJob
                                                .eligibility
                                                ?.minimum10th !==
                                            undefined
                                                ? `${selectedJob.eligibility.minimum10th}%`
                                                : "Not Specified"}
                                        </strong>

                                    </div>

                                    <div className="eligibility-card">

                                        <FaChartLine />

                                        <span>
                                            Minimum 12th
                                        </span>

                                        <strong>
                                            {selectedJob
                                                .eligibility
                                                ?.minimum12th !==
                                            undefined
                                                ? `${selectedJob.eligibility.minimum12th}%`
                                                : "Not Specified"}
                                        </strong>

                                    </div>

                                    <div className="eligibility-card">

                                        <FaLayerGroup />

                                        <span>
                                            Minimum CGPA
                                        </span>

                                        <strong>
                                            {selectedJob
                                                .eligibility
                                                ?.minimumCGPA !==
                                            undefined
                                                ? `${selectedJob.eligibility.minimumCGPA} / 10`
                                                : "Not Specified"}
                                        </strong>

                                    </div>

                                    <div className="eligibility-card">

                                        <FaCode />

                                        <span>
                                            Eligible Branches
                                        </span>

                                        <strong>
                                            {normalize(
                                                selectedJob
                                                    .eligibility
                                                    ?.branches
                                            ) ||
                                                "All Branches"}
                                        </strong>

                                    </div>

                                </div>

                            </div>

                            {/* COMPANY */}

                            <div className="modal-section">

                                <div className="modal-section-title">

                                    <div className="company-icon">
                                        <FaBuilding />
                                    </div>

                                    <div>
                                        <h3>
                                            Company Information
                                        </h3>

                                        <p>
                                            Details of the company
                                            that posted this job.
                                        </p>
                                    </div>

                                </div>

                                <div className="detail-grid">

                                    <div className="detail-item">

                                        <span>
                                            <FaBuilding />
                                            Company Name
                                        </span>

                                        <strong>
                                            {normalize(
                                                selectedJob.companyName ||
                                                selectedJob.company
                                            ) ||
                                                "Not Available"}
                                        </strong>

                                    </div>

                                    <div className="detail-item">

                                        <span>
                                            <FaEnvelope />
                                            Company Email
                                        </span>

                                        <strong>
                                            {normalize(
                                                selectedJob.companyEmail
                                            ) ||
                                                "Not Available"}
                                        </strong>

                                    </div>

                                </div>

                            </div>

                            {/* STATUS */}

                            <div className="modal-section">

                                <div className="modal-section-title">

                                    <div className="status-icon">
                                        <FaCheckCircle />
                                    </div>

                                    <div>
                                        <h3>
                                            Job Status
                                        </h3>

                                        <p>
                                            System information
                                            for this job listing.
                                        </p>
                                    </div>

                                </div>

                                <div className="status-grid">

                                    <div className="status-item">

                                        <span>
                                            Status
                                        </span>

                                        <strong className="status-badge">

                                            <FaCheckCircle />

                                            {normalize(
                                                selectedJob.status
                                            ) ||
                                                "Not Specified"}

                                        </strong>

                                    </div>

                                    <div className="status-item">

                                        <span>
                                            Created
                                        </span>

                                        <strong>

                                            <FaClock />

                                            {formatDateTime(
                                                selectedJob.createdAt
                                            )}

                                        </strong>

                                    </div>

                                    <div className="status-item">

                                        <span>
                                            Last Updated
                                        </span>

                                        <strong>

                                            <FaClock />

                                            {formatDateTime(
                                                selectedJob.updatedAt
                                            )}

                                        </strong>

                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* MODAL FOOTER */}

                        <div className="job-modal-footer">

                            <div>

                                <FaCheckCircle />

                                <span>
                                    Admin / TPO can view
                                    all job information.
                                </span>

                            </div>

                            <button
                                type="button"
                                className="modal-close-footer-btn"
                                onClick={() =>
                                    setSelectedJob(null)
                                }
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}

export default ManageJobs;