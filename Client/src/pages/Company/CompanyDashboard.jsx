import { useEffect, useState } from "react";

import {
    collection,
    getDocs,
    query,
    where,
    onSnapshot
} from "firebase/firestore";

import {
    FaBriefcase,
    FaUsers,
    FaUserCheck,
    FaClock,
    FaPlus,
    FaArrowRight,
    FaMapMarkerAlt,
    FaCalendarAlt,
    FaMoneyBillWave,
    FaChartLine,
    FaGraduationCap
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

import { db } from "../../firebase/firebaseConfig";

import { useAuth } from "../../context/AuthContext";

import "./CompanyDashboard.css";

/* =========================================================
   COMPANY DASHBOARD
========================================================= */

function CompanyDashboard() {

    const { user } = useAuth();

    const navigate = useNavigate();


    /* =====================================================
       STATES
    ===================================================== */

    const [totalJobs, setTotalJobs] = useState(0);

    const [totalApplicants, setTotalApplicants] =
        useState(0);

    const [selected, setSelected] = useState(0);

    const [placed, setPlaced] = useState(0);

    const [pending, setPending] = useState(0);

    const [jobs, setJobs] = useState([]);

    const [loading, setLoading] = useState(true);


    /* =====================================================
       LOAD DASHBOARD
    ===================================================== */

    useEffect(() => {

        if (!user?.uid) {

            setTotalJobs(0);
            setTotalApplicants(0);
            setSelected(0);
            setPlaced(0);
            setPending(0);
            setJobs([]);
            setLoading(false);

            return;

        }


        let cancelled = false;

        let unsubscribeApplications = null;


        const loadDashboard = async () => {

            try {

                setLoading(true);


                /* =================================================
                   COMPANY JOBS
                ================================================= */

                const jobsSnap = await getDocs(

                    query(
                        collection(db, "jobs"),

                        where(
                            "companyId",
                            "==",
                            user.uid
                        )
                    )

                );


                if (cancelled) {
                    return;
                }


                const jobList =
                    jobsSnap.docs.map(
                        (doc) => ({

                            id: doc.id,

                            ...doc.data()

                        })
                    );


                /* =================================================
                   SORT LATEST JOBS FIRST
                ================================================= */

                jobList.sort(
                    (a, b) => {

                        const dateA =
                            a.createdAt?.toDate
                                ? a.createdAt.toDate()
                                : new Date(0);


                        const dateB =
                            b.createdAt?.toDate
                                ? b.createdAt.toDate()
                                : new Date(0);


                        return dateB - dateA;

                    }
                );


                setJobs(jobList);

                setTotalJobs(
                    jobList.length
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
                            "companyId",
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

                            setTotalApplicants(
                                snapshot.size
                            );


                            let selectedCount = 0;

                            let placedCount = 0;

                            let pendingCount = 0;


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
                                     * IMPORTANT:
                                     *
                                     * Placement is controlled by
                                     * placedStudent.
                                     *
                                     * The application status stays
                                     * "Accepted" even after placement.
                                     *
                                     * Therefore DO NOT depend only
                                     * on status === "placed".
                                     */


                                    const isPlaced =
                                        application.placedStudent === true ||
                                        status === "placed";


                                    const isSelected =
                                        status === "selected" ||
                                        status === "accepted";


                                    const isPending =
                                        status === "applied" ||
                                        status === "pending";


                                    /* =================================================
                                       SELECTED
                                    ================================================= */

                                    if (isSelected) {

                                        selectedCount++;

                                    }


                                    /* =================================================
                                       PLACED
                                       
                                       IMPORTANT FIX
                                    ================================================= */

                                    if (isPlaced) {

                                        placedCount++;

                                    }


                                    /* =================================================
                                       PENDING
                                    ================================================= */

                                    if (
                                        isPending &&
                                        !isSelected
                                    ) {

                                        pendingCount++;

                                    }

                                }
                            );


                            /* =================================================
                               UPDATE DASHBOARD
                            ================================================= */

                            setSelected(
                                selectedCount
                            );


                            setPlaced(
                                placedCount
                            );


                            setPending(
                                pendingCount
                            );


                            console.log(
                                "Company dashboard applications updated:",
                                snapshot.docs.map(
                                    (doc) => ({
                                        id: doc.id,
                                        ...doc.data()
                                    })
                                )
                            );

                        },


                        (error) => {

                            console.error(
                                "Company applications realtime listener error:",
                                error
                            );

                        }

                    );

            }

            catch (error) {

                console.error(
                    "Company dashboard error:",
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
           CLEANUP FIREBASE LISTENER
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
       LOADING
    ========================================================= */

    if (loading) {

        return (

            <div className="company-dashboard">

                <div className="company-loading">

                    <div className="company-spinner"></div>

                    <p>
                        Loading dashboard...
                    </p>

                </div>

            </div>

        );

    }


    /* =========================================================
       RETURN
    ========================================================= */

    return (

        <div className="company-dashboard">


            {/* =================================================
                HEADER
            ================================================= */}

            <section className="company-header">

                <div className="company-welcome">

                    <div>

                        <span className="company-label">

                            COMPANY DASHBOARD

                        </span>


                        <h1>

                            Welcome back,{" "}

                            {
                                user?.name ||
                                "Company"
                            }

                            {" "}👋

                        </h1>


                        <p>

                            Manage your job postings,
                            review applicants and build
                            your next great team.

                        </p>

                    </div>


                    <div className="header-actions">

                        <button
                            type="button"
                            className="add-job-btn"
                            onClick={() =>
                                navigate(
                                    "/company/add-job"
                                )
                            }
                        >

                            <FaPlus />

                            Post New Job

                        </button>

                    </div>

                </div>

            </section>



            {/* =================================================
                STATISTICS
            ================================================= */}

            <section className="company-cards">


                {/* TOTAL JOBS */}

                <div className="company-card">

                    <div className="company-card-icon blue">

                        <FaBriefcase />

                    </div>


                    <div className="company-card-content">

                        <span>
                            Total Jobs
                        </span>

                        <h3>
                            {totalJobs}
                        </h3>

                        <small>
                            Active job postings
                        </small>

                    </div>

                </div>



                {/* APPLICANTS */}

                <div className="company-card">

                    <div className="company-card-icon purple">

                        <FaUsers />

                    </div>


                    <div className="company-card-content">

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

                <div className="company-card">

                    <div className="company-card-icon green">

                        <FaUserCheck />

                    </div>


                    <div className="company-card-content">

                        <span>
                            Selected
                        </span>

                        <h3>
                            {selected}
                        </h3>

                        <small>
                            Successful candidates
                        </small>

                    </div>

                </div>



                {/* PLACED */}

                <div className="company-card">

                    <div className="company-card-icon placed">

                        <FaGraduationCap />

                    </div>


                    <div className="company-card-content">

                        <span>
                            Placed
                        </span>

                        <h3>
                            {placed}
                        </h3>

                        <small>
                            Placed candidates
                        </small>

                    </div>

                </div>



                {/* PENDING */}

                <div className="company-card">

                    <div className="company-card-icon orange">

                        <FaClock />

                    </div>


                    <div className="company-card-content">

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
                OVERVIEW BANNER
            ================================================= */}

            <section className="company-overview">

                <div className="overview-icon">

                    <FaChartLine />

                </div>


                <div className="overview-content">

                    <h3>
                        Recruitment Overview
                    </h3>


                    <p>

                        You currently have{" "}

                        <strong>
                            {totalApplicants}
                        </strong>{" "}

                        applications across{" "}

                        <strong>
                            {totalJobs}
                        </strong>{" "}

                        job posting
                        {totalJobs !== 1
                            ? "s"
                            : ""}.

                        {" "}

                        <strong>
                            {placed}
                        </strong>{" "}

                        candidate
                        {placed !== 1
                            ? "s are"
                            : " is"}{" "}
                        placed.

                    </p>

                </div>


                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            "/company/applicants"
                        )
                    }
                >

                    View Applicants

                    <FaArrowRight />

                </button>

            </section>



            {/* =================================================
                RECENT JOBS
            ================================================= */}

            <section className="recent-jobs">


                <div className="section-header">

                    <div>

                        <span className="section-label">

                            JOB MANAGEMENT

                        </span>


                        <h2>
                            Recent Job Posts
                        </h2>


                        <p>
                            Keep track of your latest
                            recruitment opportunities.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="view-all-btn"
                        onClick={() =>
                            navigate(
                                "/company/jobs"
                            )
                        }
                    >

                        View All Jobs

                        <FaArrowRight />

                    </button>

                </div>



                {jobs.length === 0 ? (

                    <div className="empty-jobs">

                        <div className="empty-icon">

                            <FaBriefcase />

                        </div>


                        <h3>
                            No job posts yet
                        </h3>


                        <p>

                            Start your recruitment
                            journey by posting your
                            first job opportunity.

                        </p>


                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/company/add-job"
                                )
                            }
                        >

                            <FaPlus />

                            Post Your First Job

                        </button>

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
                                                key={job.id}
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
                                                                    "Your Company"
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
                                                            job.deadline ||
                                                            "Not specified"
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


export default CompanyDashboard;