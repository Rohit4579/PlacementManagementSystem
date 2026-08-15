import { useEffect, useState } from "react";

import {
    collection,
    getDocs,
    query,
    where,
    onSnapshot
} from "firebase/firestore";

import { useNavigate } from "react-router-dom";

import { db } from "../../firebase/firebaseConfig";

import { useAuth } from "../../context/AuthContext";

import {
    FaBriefcase,
    FaFileAlt,
    FaUserCheck,
    FaUser,
    FaGraduationCap,
    FaMapMarkerAlt,
    FaMoneyBillWave,
    FaArrowRight,
    FaBuilding,
    FaCalendarAlt,
    FaCheckCircle,
    FaAward,
    FaExternalLinkAlt
} from "react-icons/fa";

import "./StudentDashboard.css";


/* =========================================================
   STUDENT DASHBOARD
========================================================= */

function StudentDashboard() {

    const { user } = useAuth();

    const navigate = useNavigate();


    /* =====================================================
       STATES
    ===================================================== */

    const [availableJobs, setAvailableJobs] = useState(0);

    const [appliedJobs, setAppliedJobs] = useState(0);

    const [shortlisted, setShortlisted] = useState(0);

    const [placed, setPlaced] = useState(0);

    const [recentJobs, setRecentJobs] = useState([]);

    const [profileCompletion, setProfileCompletion] =
        useState(0);

    const [loading, setLoading] = useState(true);


    /* =====================================================
       PEXELS IMAGE STATES
    ===================================================== */

    const [heroImage, setHeroImage] = useState("");

    const [heroPhotographer, setHeroPhotographer] =
        useState("");

    const [heroPhotographerUrl, setHeroPhotographerUrl] =
        useState("");

    const [heroPexelsUrl, setHeroPexelsUrl] =
        useState("");

    const [imageLoading, setImageLoading] =
        useState(true);


    /* =====================================================
       LOAD PEXELS CAREER IMAGE
    ===================================================== */

    useEffect(() => {

        let cancelled = false;


        const loadCareerImage = async () => {

            const apiKey =
                import.meta.env.VITE_PEXELS_API_KEY;


            /*
             * If API key is not configured,
             * simply use the CSS background design.
             */

            if (!apiKey) {

                console.warn(
                    "VITE_PEXELS_API_KEY is not configured."
                );

                setImageLoading(false);

                return;

            }


            try {

                setImageLoading(true);


                const response = await fetch(
                    "https://api.pexels.com/v1/search?query=college%20students%20career%20technology&orientation=landscape&per_page=10",
                    {
                        headers: {
                            Authorization: apiKey
                        }
                    }
                );


                if (!response.ok) {

                    throw new Error(
                        `Pexels request failed: ${response.status}`
                    );

                }


                const data =
                    await response.json();


                if (
                    cancelled ||
                    !data?.photos?.length
                ) {

                    setImageLoading(false);

                    return;

                }


                /*
                 * Select a random image from the first
                 * few relevant results so the dashboard
                 * doesn't always look identical.
                 */

                const photos =
                    data.photos.slice(0, 6);


                const selectedPhoto =
                    photos[
                        Math.floor(
                            Math.random() *
                            photos.length
                        )
                    ];


                if (!selectedPhoto) {

                    setImageLoading(false);

                    return;

                }


                setHeroImage(
                    selectedPhoto.src?.large2x ||
                    selectedPhoto.src?.large ||
                    selectedPhoto.src?.original ||
                    ""
                );


                setHeroPhotographer(
                    selectedPhoto.photographer ||
                    "Pexels"
                );


                setHeroPhotographerUrl(
                    selectedPhoto.photographer_url ||
                    "https://www.pexels.com/"
                );


                setHeroPexelsUrl(
                    selectedPhoto.url ||
                    "https://www.pexels.com/"
                );

            }

            catch (error) {

                console.error(
                    "Pexels image error:",
                    error
                );

            }

            finally {

                if (!cancelled) {

                    setImageLoading(false);

                }

            }

        };


        loadCareerImage();


        return () => {

            cancelled = true;

        };

    }, []);


    /* =====================================================
       LOAD DASHBOARD
    ===================================================== */

    useEffect(() => {

        if (!user?.uid) {

            setAvailableJobs(0);

            setAppliedJobs(0);

            setShortlisted(0);

            setPlaced(0);

            setRecentJobs([]);

            setProfileCompletion(0);

            setLoading(false);

            return;

        }


        let cancelled = false;

        let unsubscribeApplications = null;


        const loadDashboard = async () => {

            try {

                setLoading(true);


                /* =================================================
                   STUDENT PROFILE
                ================================================= */

                const profileSnap = await getDocs(

                    query(

                        collection(
                            db,
                            "studentProfiles"
                        ),

                        where(
                            "uid",
                            "==",
                            user.uid
                        )

                    )

                );


                if (cancelled) {

                    return;

                }


                if (!profileSnap.empty) {

                    const profile =
                        profileSnap.docs[0].data();


                    let completed = 0;


                    if (profile.phone) {

                        completed++;

                    }


                    if (profile.department) {

                        completed++;

                    }


                    if (
                        profile.cgpa !== undefined &&
                        profile.cgpa !== null &&
                        profile.cgpa !== ""
                    ) {

                        completed++;

                    }


                    if (profile.skills) {

                        completed++;

                    }


                    if (profile.graduationYear) {

                        completed++;

                    }


                    setProfileCompletion(
                        completed * 20
                    );

                }

                else {

                    setProfileCompletion(0);

                }


                /* =================================================
                   JOBS
                ================================================= */

                const jobsSnap = await getDocs(

                    collection(
                        db,
                        "jobs"
                    )

                );


                if (cancelled) {

                    return;

                }


                const jobs =
                    jobsSnap.docs.map(
                        (document) => ({

                            id:
                                document.id,

                            ...document.data()

                        })
                    );


                /* =================================================
                   SORT JOBS
                ================================================= */

                jobs.sort(
                    (a, b) => {

                        const dateA =
                            a.createdAt?.seconds ||
                            0;


                        const dateB =
                            b.createdAt?.seconds ||
                            0;


                        return dateB - dateA;

                    }
                );


                /* =================================================
                   AVAILABLE JOBS
                ================================================= */

                setAvailableJobs(
                    jobs.length
                );


                /* =================================================
                   RECENT JOBS
                ================================================= */

                setRecentJobs(
                    jobs.slice(0, 3)
                );


                /* =================================================
                   APPLICATIONS - REAL TIME
                ================================================= */

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


                unsubscribeApplications =
                    onSnapshot(

                        applicationsQuery,

                        (snapshot) => {

                            if (cancelled) {

                                return;

                            }


                            /* =================================================
                               TOTAL APPLICATIONS
                            ================================================= */

                            setAppliedJobs(
                                snapshot.size
                            );


                            let shortlistedCount = 0;

                            let placedCount = 0;


                            /* =================================================
                               PROCESS APPLICATIONS
                            ================================================= */

                            snapshot.docs.forEach(
                                (document) => {

                                    const application =
                                        document.data();


                                    const status =
                                        String(
                                            application.status ||
                                            "pending"
                                        )
                                            .trim()
                                            .toLowerCase();


                                    /*
                                     * placedStudent is the source
                                     * of truth for placement.
                                     */

                                    const isPlaced =
                                        application.placedStudent === true ||
                                        status === "placed";


                                    /* =================================================
                                       SHORTLISTED
                                    ================================================= */

                                    if (

                                        status === "shortlisted" ||

                                        status === "selected" ||

                                        status === "accepted" ||

                                        isPlaced

                                    ) {

                                        shortlistedCount++;

                                    }


                                    /* =================================================
                                       PLACED
                                    ================================================= */

                                    if (isPlaced) {

                                        placedCount++;

                                    }

                                }
                            );


                            /* =================================================
                               UPDATE UI
                            ================================================= */

                            setShortlisted(
                                shortlistedCount
                            );


                            setPlaced(
                                placedCount
                            );

                        },

                        (error) => {

                            console.error(
                                "Student applications realtime listener error:",
                                error
                            );

                        }

                    );

            }

            catch (error) {

                console.error(
                    "Student Dashboard Error:",
                    error
                );

            }

            finally {

                if (!cancelled) {

                    setLoading(false);

                }

            }

        };


        loadDashboard();


        /* =====================================================
           CLEANUP
        ===================================================== */

        return () => {

            cancelled = true;


            if (
                unsubscribeApplications
            ) {

                unsubscribeApplications();

            }

        };

    }, [user]);


    /* =========================================================
       VIEW JOB
    ========================================================= */

    const handleViewJob = (jobId) => {

        navigate(
            `/student/jobs?job=${jobId}`
        );

    };


    /* =========================================================
       VIEW ALL JOBS
    ========================================================= */

    const handleViewAllJobs = () => {

        navigate(
            "/student/jobs"
        );

    };


    /* =========================================================
       PROFILE
    ========================================================= */

    const handleProfile = () => {

        navigate(
            "/student/profile"
        );

    };


    /* =========================================================
       FORMAT ELIGIBILITY
    ========================================================= */

    const formatEligibility = (
        value,
        suffix = ""
    ) => {

        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {

            return "Not specified";

        }


        return `${value}${suffix}`;

    };


    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {

        return (

            <div className="dashboard-loading">

                <div className="loading-spinner"></div>

                <p>
                    Loading your dashboard...
                </p>

            </div>

        );

    }


    /* =========================================================
       UI
    ========================================================= */

    return (

        <div className="student-dashboard">


            {/* =================================================
                WELCOME HEADER
            ================================================= */}

            <div className="dashboard-header">


                <div className="welcome-content">


                    {/* TEXT */}

                    <div className="welcome-text">

                        <span className="welcome-label">

                            STUDENT DASHBOARD

                        </span>


                        <h1>

                            Welcome back,{" "}

                            {
                                user?.name ||
                                user?.displayName ||
                                "Student"
                            }

                            {" "}👋

                        </h1>


                        <p>

                            Track your placement journey,
                            explore opportunities and stay
                            updated with your applications.

                        </p>


                        {/* QUICK ACTIONS */}

                        <div className="welcome-actions">

                            <button
                                type="button"
                                onClick={handleViewAllJobs}
                            >

                                <FaBriefcase />

                                Explore Jobs

                                <FaArrowRight />

                            </button>


                            <button
                                type="button"
                                className="secondary"
                                onClick={handleProfile}
                            >

                                <FaUser />

                                My Profile

                            </button>

                        </div>

                    </div>


                    {/* =================================================
                        PEXELS IMAGE
                    ================================================= */}

                    <div className="dashboard-hero-visual">


                        {imageLoading ? (

                            <div className="hero-image-loading">

                                <div className="hero-image-spinner"></div>

                            </div>

                        ) : heroImage ? (

                            <img
                                src={heroImage}
                                alt="Students preparing for career opportunities"
                                className="dashboard-hero-image"
                            />

                        ) : (

                            <div className="hero-fallback">

                                <FaGraduationCap />

                                <span>
                                    Build your career
                                </span>

                            </div>

                        )}


                        <div className="hero-image-overlay"></div>


                        <div className="hero-floating-card">

                            <span className="hero-floating-icon">

                                <FaCheckCircle />

                            </span>


                            <div>

                                <strong>
                                    Your career journey
                                </strong>

                                <small>
                                    Starts with the right opportunity
                                </small>

                            </div>

                        </div>


                        {heroImage && (

                            <div className="pexels-credit">

                                Photo by{" "}

                                <a
                                    href={
                                        heroPhotographerUrl ||
                                        "https://www.pexels.com/"
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >

                                    {heroPhotographer}

                                </a>

                                {" "}on{" "}

                                <a
                                    href={
                                        heroPexelsUrl ||
                                        "https://www.pexels.com/"
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >

                                    Pexels
                                    
                                </a>

                            </div>

                        )}

                    </div>

                </div>

            </div>


            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="stats-container">


                {/* AVAILABLE JOBS */}

                <div className="stat-card">

                    <div className="stat-icon blue">

                        <FaBriefcase />

                    </div>


                    <div className="stat-content">

                        <span>
                            Available Jobs
                        </span>


                        <h2>
                            {availableJobs}
                        </h2>


                        <small>
                            Opportunities
                        </small>

                    </div>

                </div>


                {/* APPLICATIONS */}

                <div className="stat-card">

                    <div className="stat-icon purple">

                        <FaFileAlt />

                    </div>


                    <div className="stat-content">

                        <span>
                            Applications
                        </span>


                        <h2>
                            {appliedJobs}
                        </h2>


                        <small>
                            Jobs applied
                        </small>

                    </div>

                </div>


                {/* SHORTLISTED */}

                <div className="stat-card">

                    <div className="stat-icon green">

                        <FaUserCheck />

                    </div>


                    <div className="stat-content">

                        <span>
                            Shortlisted
                        </span>


                        <h2>
                            {shortlisted}
                        </h2>


                        <small>
                            Shortlisted applications
                        </small>

                    </div>

                </div>


                {/* PLACED */}

                <div className="stat-card">

                    <div className="stat-icon placed">

                        <FaAward />

                    </div>


                    <div className="stat-content">

                        <span>
                            Placed
                        </span>


                        <h2>
                            {placed}
                        </h2>


                        <small>
                            Placement confirmed
                        </small>

                    </div>

                </div>


                {/* PROFILE */}

                <div className="stat-card">

                    <div className="stat-icon orange">

                        <FaUser />

                    </div>


                    <div className="stat-content">

                        <span>
                            Profile
                        </span>


                        <h2>
                            {profileCompletion}%
                        </h2>


                        <small>
                            Completion
                        </small>

                    </div>

                </div>

            </div>


            {/* =================================================
                PROFILE COMPLETION
            ================================================= */}

            <div className="profile-card">


                <div className="profile-card-left">


                    <div className="profile-card-icon">

                        {
                            profileCompletion === 100

                                ?

                                <FaCheckCircle />

                                :

                                <FaUser />

                        }

                    </div>


                    <div>

                        <h3>
                            Profile Completion
                        </h3>


                        <p>

                            Complete your profile to
                            improve your placement opportunities.

                        </p>

                    </div>

                </div>


                <div className="profile-progress-area">


                    <div className="progress-header">

                        <span>
                            Profile Progress
                        </span>


                        <strong>
                            {profileCompletion}%
                        </strong>

                    </div>


                    <div className="progress-bar">

                        <div
                            className="progress-fill"
                            style={{
                                width:
                                    `${profileCompletion}%`
                            }}
                        />

                    </div>


                    <button
                        type="button"
                        onClick={handleProfile}
                    >

                        <FaUser />

                        {
                            profileCompletion === 100
                                ? "View Profile"
                                : "Complete Profile"
                        }

                        <FaArrowRight />

                    </button>

                </div>

            </div>


            {/* =================================================
                RECENT JOBS
            ================================================= */}

            <div className="recent-section">


                <div className="section-header">


                    <div>

                        <span className="section-label">

                            OPPORTUNITIES

                        </span>


                        <h2>

                            Recent Job Opportunities

                        </h2>

                    </div>


                    <button
                        type="button"
                        className="view-all-btn"
                        onClick={handleViewAllJobs}
                    >

                        View All

                        <FaArrowRight />

                    </button>

                </div>


                {
                    recentJobs.length === 0

                        ?

                        (

                            <div className="empty-jobs">

                                <FaBriefcase />

                                <h3>
                                    No jobs available
                                </h3>

                                <p>

                                    New placement opportunities
                                    will appear here.

                                </p>

                            </div>

                        )

                        :

                        (

                            <div className="job-container">

                                {
                                    recentJobs.map(
                                        (job) => {

                                            const eligibility =
                                                job.eligibility ||
                                                {};


                                            const minimum10th =
                                                eligibility.minimum10th;


                                            const minimum12th =
                                                eligibility.minimum12th;


                                            const minimumCGPA =
                                                eligibility.minimumCGPA;


                                            return (

                                                <div
                                                    className="job-card"
                                                    key={job.id}
                                                >


                                                    {/* COMPANY */}

                                                    <div className="job-company">


                                                        <div className="company-badge">

                                                            <FaBuilding />

                                                        </div>


                                                        <span>

                                                            {
                                                                job.companyName ||
                                                                "Company"
                                                            }

                                                        </span>

                                                    </div>


                                                    {/* TITLE */}

                                                    <h3>

                                                        {
                                                            job.jobTitle ||
                                                            job.title ||
                                                            "Job Opportunity"
                                                        }

                                                    </h3>


                                                    {/* SKILLS */}

                                                    <p className="job-skills">

                                                        {
                                                            Array.isArray(
                                                                job.skills
                                                            )

                                                                ?

                                                                job.skills.join(
                                                                    ", "
                                                                )

                                                                :

                                                                job.skills ||
                                                                "Skills not specified"
                                                        }

                                                    </p>


                                                    {/* DETAILS */}

                                                    <div className="job-details">


                                                        <span>

                                                            <FaMapMarkerAlt />

                                                            {
                                                                job.location ||
                                                                "Location not specified"
                                                            }

                                                        </span>


                                                        <span>

                                                            <FaMoneyBillWave />

                                                            {
                                                                job.salary ||
                                                                "Salary not specified"
                                                            }

                                                        </span>


                                                        <span>

                                                            <FaCalendarAlt />

                                                            Deadline:{" "}

                                                            {
                                                                job.deadline ||
                                                                "Not specified"
                                                            }

                                                        </span>

                                                    </div>


                                                    {/* ELIGIBILITY */}

                                                    <div className="eligibility-box">


                                                        <div className="eligibility-title">

                                                            <FaGraduationCap />

                                                            Eligibility

                                                        </div>


                                                        <div className="eligibility-items">


                                                            <span>

                                                                10th:

                                                                <strong>

                                                                    {
                                                                        formatEligibility(
                                                                            minimum10th,
                                                                            "%"
                                                                        )
                                                                    }

                                                                </strong>

                                                            </span>


                                                            <span>

                                                                12th:

                                                                <strong>

                                                                    {
                                                                        formatEligibility(
                                                                            minimum12th,
                                                                            "%"
                                                                        )
                                                                    }

                                                                </strong>

                                                            </span>


                                                            <span>

                                                                CGPA:

                                                                <strong>

                                                                    {
                                                                        formatEligibility(
                                                                            minimumCGPA
                                                                        )
                                                                    }

                                                                </strong>

                                                            </span>


                                                        </div>

                                                    </div>


                                                    {/* VIEW JOB */}

                                                    <button
                                                        type="button"
                                                        className="view-job-btn"
                                                        onClick={() =>
                                                            handleViewJob(
                                                                job.id
                                                            )
                                                        }
                                                    >

                                                        View Job

                                                        <FaArrowRight />

                                                    </button>

                                                </div>

                                            );

                                        }
                                    )
                                }

                            </div>

                        )
                }

            </div>

        </div>

    );

}


export default StudentDashboard;