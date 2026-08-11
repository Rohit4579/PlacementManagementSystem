import {
    useEffect,
    useState
} from "react";

import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    deleteDoc
} from "firebase/firestore";

import {
    db
} from "../../firebase/firebaseConfig";

import {
    useAuth
} from "../../context/AuthContext";

import {
    FaBuilding,
    FaMapMarkerAlt,
    FaMoneyBillWave,
    FaCalendarAlt,
    FaBriefcase,
    FaGraduationCap,
    FaCode,
    FaClock,
    FaCheckCircle,
    FaHourglassHalf,
    FaTimesCircle,
    FaEye,
    FaTrash
} from "react-icons/fa";

import "./AppliedJobs.css";


function AppliedJobs() {

    const { user } = useAuth();


    /* =========================================================
       STATES
    ========================================================= */

    const [applications, setApplications] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [deletingId, setDeletingId] = useState(null);


    /* =========================================================
       FORMAT FIREBASE DATE
    ========================================================= */

    const formatDate = (value) => {

        if (!value) {
            return "Not available";
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


            if (value instanceof Date) {

                return value.toLocaleDateString(
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
                return "Not available";
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

            return "Not available";
        }

    };


    /* =========================================================
       STATUS NORMALIZATION
    ========================================================= */

    const normalizeStatus = (status) => {

        if (!status) {
            return "pending";
        }

        return String(status)
            .trim()
            .toLowerCase();

    };


    /* =========================================================
       STATUS INFORMATION
    ========================================================= */

    const getStatusInfo = (status) => {

        const normalized =
            normalizeStatus(status);


        switch (normalized) {

            case "accepted":

            case "selected":

            case "approved":

                return {
                    className: "accepted",
                    icon: <FaCheckCircle />,
                    label: "Accepted"
                };


            case "rejected":

            case "declined":

                return {
                    className: "rejected",
                    icon: <FaTimesCircle />,
                    label: "Rejected"
                };


            case "shortlisted":

                return {
                    className: "shortlisted",
                    icon: <FaEye />,
                    label: "Shortlisted"
                };


            case "applied":

                return {
                    className: "applied",
                    icon: <FaCheckCircle />,
                    label: "Applied"
                };


            case "pending":

            default:

                return {
                    className: "pending",
                    icon: <FaHourglassHalf />,
                    label: "Application Pending"
                };

        }

    };


    /* =========================================================
       GET ORIGINAL JOB
    ========================================================= */

    const getJobById = async (jobId) => {

        if (!jobId) {

            console.warn(
                "Application does not contain jobId."
            );

            return null;
        }


        try {

            const jobReference =
                doc(
                    db,
                    "jobs",
                    jobId
                );


            const jobSnapshot =
                await getDoc(
                    jobReference
                );


            if (!jobSnapshot.exists()) {

                console.warn(
                    "Job not found:",
                    jobId
                );

                return null;
            }


            return {

                id: jobSnapshot.id,

                ...jobSnapshot.data()

            };

        }

        catch (error) {

            console.error(
                "Unable to load job:",
                error
            );

            return null;
        }

    };


    /* =========================================================
       LOAD APPLICATIONS
    ========================================================= */

    useEffect(() => {

        let cancelled = false;


        const fetchApplications = async () => {

            if (!user?.uid) {

                setApplications([]);

                setLoading(false);

                return;
            }


            try {

                setLoading(true);

                setError("");


                const applicationsReference =
                    collection(
                        db,
                        "applications"
                    );


                const applicationsQuery =
                    query(

                        applicationsReference,

                        where(
                            "studentId",
                            "==",
                            user.uid
                        )

                    );


                const snapshot =
                    await getDocs(
                        applicationsQuery
                    );


                if (snapshot.empty) {

                    if (!cancelled) {

                        setApplications([]);

                    }

                    return;
                }


                const applicationPromises =
                    snapshot.docs.map(
                        async (
                            applicationDocument
                        ) => {

                            const applicationData =
                                applicationDocument.data();


                            const job =
                                await getJobById(
                                    applicationData.jobId
                                );


                            if (job) {

                                return {

                                    id:
                                        applicationDocument.id,

                                    ...applicationData,

                                    currentJob:
                                        job,


                                    jobTitle:
                                        job.jobTitle ||
                                        applicationData.jobTitle ||
                                        "Job Position",


                                    jobDescription:
                                        job.jobDescription ||
                                        applicationData.jobDescription ||
                                        "",


                                    salary:
                                        job.salary ||
                                        applicationData.salary ||
                                        "",


                                    location:
                                        job.location ||
                                        applicationData.location ||
                                        "",


                                    deadline:
                                        job.deadline ||
                                        applicationData.deadline ||
                                        "",


                                    skills:
                                        job.skills ||
                                        applicationData.skills ||
                                        "",


                                    companyName:
                                        job.companyName ||
                                        applicationData.companyName ||
                                        "Company",


                                    companyEmail:
                                        job.companyEmail ||
                                        applicationData.companyEmail ||
                                        "",


                                    companyId:
                                        job.companyId ||
                                        applicationData.companyId ||
                                        ""

                                };

                            }


                            return {

                                id:
                                    applicationDocument.id,

                                ...applicationData,

                                currentJob:
                                    null,


                                jobTitle:
                                    applicationData.jobTitle &&
                                    applicationData.jobTitle !== "Unknown Job" &&
                                    applicationData.jobTitle !== "Untitled Job" &&
                                    applicationData.jobTitle !== "Job Position"

                                        ? applicationData.jobTitle

                                        : "Job Position",


                                jobDescription:
                                    applicationData.jobDescription ||
                                    "",


                                salary:
                                    applicationData.salary ||
                                    "",


                                location:
                                    applicationData.location ||
                                    "",


                                deadline:
                                    applicationData.deadline ||
                                    "",


                                skills:
                                    applicationData.skills ||
                                    "",


                                companyName:
                                    applicationData.companyName ||
                                    "Company",


                                companyEmail:
                                    applicationData.companyEmail ||
                                    "",


                                companyId:
                                    applicationData.companyId ||
                                    ""

                            };

                        }
                    );


                const loadedApplications =
                    await Promise.all(
                        applicationPromises
                    );


                if (cancelled) {
                    return;
                }


                loadedApplications.sort(
                    (
                        a,
                        b
                    ) => {

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
                                b.appliedAt
                            ) -
                            getTime(
                                a.appliedAt
                            )
                        );

                    }
                );


                setApplications(
                    loadedApplications
                );

            }

            catch (firebaseError) {

                console.error(
                    "Fetch Applications Error:",
                    firebaseError
                );


                if (!cancelled) {

                    setError(
                        "Unable to load your applications. Please try again."
                    );

                }

            }

            finally {

                if (!cancelled) {

                    setLoading(false);

                }

            }

        };


        fetchApplications();


        return () => {

            cancelled = true;

        };

    }, [user]);


    /* =========================================================
       DELETE APPLICATION
    ========================================================= */

    const deleteApplication = async (
        application
    ) => {

        if (!user?.uid) {

            alert(
                "Please login first."
            );

            return;
        }


        if (!application?.id) {

            alert(
                "Application ID is missing."
            );

            return;
        }


        const confirmed =
            window.confirm(
                `Delete your application for "${application.jobTitle || "this job"}" at "${application.companyName || "this company"}"?`
            );


        if (!confirmed) {
            return;
        }


        try {

            setDeletingId(
                application.id
            );


            const applicationReference =
                doc(
                    db,
                    "applications",
                    application.id
                );


            const applicationSnapshot =
                await getDoc(
                    applicationReference
                );


            if (
                !applicationSnapshot.exists()
            ) {

                alert(
                    "Application was already deleted."
                );


                setApplications(
                    previous =>
                        previous.filter(
                            item =>
                                item.id !==
                                application.id
                        )
                );

                return;
            }


            const applicationData =
                applicationSnapshot.data();


            if (
                applicationData.studentId !==
                user.uid
            ) {

                alert(
                    "You cannot delete this application."
                );

                return;
            }


            await deleteDoc(
                applicationReference
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
                error.message ||
                "Unable to delete application."
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

            <div className="applied-page">

                <div className="applied-loading">

                    <div className="applied-spinner"></div>

                    <h2>
                        Loading your applications
                    </h2>

                    <p>
                        Please wait while we retrieve
                        your application history.
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

            <div className="applied-page">

                <div className="applied-error">

                    <div className="applied-error-icon">
                        ⚠️
                    </div>

                    <h2>
                        Something went wrong
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

        <div className="applied-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="applied-header">

                <div className="applied-header-content">

                    <span className="applied-label">
                        PLACEMENT PORTAL
                    </span>

                    <h1>
                        My Applications
                    </h1>

                    <p>
                        Track the jobs you've applied for
                        and monitor your application status.
                    </p>

                </div>


                <div className="applications-count">

                    <div className="applications-count-icon">

                        <FaBriefcase />

                    </div>


                    <div className="applications-count-text">

                        <strong>
                            {applications.length}
                        </strong>

                        <span>
                            {
                                applications.length === 1
                                    ? "Application"
                                    : "Applications"
                            }
                        </span>

                    </div>

                </div>

            </div>


            {/* =================================================
                EMPTY STATE
            ================================================= */}

            {applications.length === 0 && (

                <div className="empty-state">

                    <div className="empty-icon">

                        <FaBriefcase />

                    </div>

                    <h2>
                        No Applications Yet
                    </h2>

                    <p>
                        You haven't applied for any
                        placement opportunities yet.
                    </p>

                </div>

            )}


            {/* =================================================
                APPLICATION GRID
            ================================================= */}

            {applications.length > 0 && (

                <div className="application-grid">

                    {applications.map(
                        (app) => {

                            const status =
                                getStatusInfo(
                                    app.status
                                );


                            let skills = [];


                            if (
                                Array.isArray(
                                    app.skills
                                )
                            ) {

                                skills =
                                    app.skills
                                        .map(
                                            skill =>
                                                String(
                                                    skill
                                                ).trim()
                                        )
                                        .filter(
                                            Boolean
                                        );

                            }

                            else {

                                skills =
                                    String(
                                        app.skills || ""
                                    )
                                        .split(",")
                                        .map(
                                            skill =>
                                                skill.trim()
                                        )
                                        .filter(
                                            Boolean
                                        );

                            }


                            const jobTitle =
                                app.jobTitle ||
                                "Job Position";


                            const companyName =
                                app.companyName ||
                                "Company";


                            const location =
                                app.location ||
                                "Not specified";


                            const salary =
                                app.salary ||
                                "Not specified";


                            const isDeleting =
                                deletingId ===
                                app.id;


                            return (

                                <article
                                    className="application-card"
                                    key={app.id}
                                >


                                    {/* =================================
                                        CARD TOP
                                    ================================= */}

                                    <div className="application-card-top">

                                        <div className="company-main">

                                            <div className="company-avatar">

                                                <FaBuilding />

                                            </div>


                                            <div className="company-details">

                                                <span>
                                                    COMPANY
                                                </span>

                                                <h2>
                                                    {companyName}
                                                </h2>

                                            </div>

                                        </div>


                                        {/* =================================
                                            FIXED STATUS AREA
                                        ================================= */}

                                        <div
                                            className={
                                                `status-badge ${status.className}`
                                            }
                                        >

                                            {status.icon}

                                            <span>
                                                {status.label}
                                            </span>

                                        </div>

                                    </div>


                                    {/* =================================
                                        JOB TITLE
                                    ================================= */}

                                    <div className="job-heading">

                                        <h3>

                                            <FaBriefcase />

                                            <span>
                                                {jobTitle}
                                            </span>

                                        </h3>

                                    </div>


                                    {/* =================================
                                        JOB DETAILS
                                    ================================= */}

                                    <div className="application-details">


                                        <div className="detail-item">

                                            <div className="detail-icon">

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


                                        <div className="detail-item">

                                            <div className="detail-icon">

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


                                        <div className="detail-item">

                                            <div className="detail-icon">

                                                <FaCalendarAlt />

                                            </div>

                                            <div>

                                                <span>
                                                    Application Deadline
                                                </span>

                                                <strong>
                                                    {
                                                        formatDate(
                                                            app.deadline
                                                        )
                                                    }
                                                </strong>

                                            </div>

                                        </div>


                                        <div className="detail-item">

                                            <div className="detail-icon">

                                                <FaClock />

                                            </div>

                                            <div>

                                                <span>
                                                    Applied On
                                                </span>

                                                <strong>
                                                    {
                                                        formatDate(
                                                            app.appliedAt
                                                        )
                                                    }
                                                </strong>

                                            </div>

                                        </div>

                                    </div>


                                    {/* =================================
                                        DESCRIPTION
                                    ================================= */}

                                    {app.jobDescription && (

                                        <div className="application-description">

                                            <h4>
                                                Job Description
                                            </h4>

                                            <p>
                                                {
                                                    app.jobDescription
                                                }
                                            </p>

                                        </div>

                                    )}


                                    {/* =================================
                                        SKILLS
                                    ================================= */}

                                    {skills.length > 0 && (

                                        <div className="application-skills">

                                            <div className="skills-heading">

                                                <FaCode />

                                                <span>
                                                    Required Skills
                                                </span>

                                            </div>


                                            <div className="skills-list">

                                                {skills.map(
                                                    (
                                                        skill,
                                                        index
                                                    ) => (

                                                        <span
                                                            key={
                                                                `${skill}-${index}`
                                                            }
                                                        >
                                                            {skill}
                                                        </span>

                                                    )
                                                )}

                                            </div>

                                        </div>

                                    )}


                                    {/* =================================
                                        FOOTER
                                    ================================= */}

                                    <div className="application-footer">

                                        <div className="application-id">

                                            <FaGraduationCap />

                                            <span>
                                                Application submitted
                                            </span>

                                        </div>


                                        <div className="application-reference">

                                            ID:{" "}

                                            {
                                                app.id
                                                    .slice(
                                                        0,
                                                        8
                                                    )
                                                    .toUpperCase()
                                            }

                                        </div>

                                    </div>


                                    {/* =================================
                                        DELETE BUTTON
                                    ================================= */}

                                    <button
                                        type="button"
                                        className="delete-application-button"
                                        disabled={isDeleting}
                                        onClick={() =>
                                            deleteApplication(
                                                app
                                            )
                                        }
                                    >

                                        {isDeleting ? (

                                            <>
                                                Deleting...
                                            </>

                                        ) : (

                                            <>
                                                <FaTrash />
                                                Delete Application
                                            </>

                                        )}

                                    </button>


                                </article>

                            );

                        }
                    )}

                </div>

            )}

        </div>

    );

}


export default AppliedJobs;