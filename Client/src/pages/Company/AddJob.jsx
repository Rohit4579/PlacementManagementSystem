
import { useState } from "react";

import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    doc,
    getDoc
} from "firebase/firestore";

import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../context/AuthContext";

import sendEmail from "../../services/emailService";

import {
    FaBriefcase,
    FaGraduationCap,
    FaChartLine,
    FaCode,
    FaMapMarkerAlt,
    FaCalendarAlt,
    FaMoneyBillWave,
    FaPaperPlane
} from "react-icons/fa";

import "./AddJob.css";


/* =========================================================
   INITIAL FORM DATA
========================================================= */

const INITIAL_FORM_DATA = {
    jobTitle: "",
    location: "",
    salary: "",
    deadline: "",
    jobDescription: "",
    skills: "",
    education: "Graduate",
    minimum10th: "",
    minimum12th: "",
    minimumCGPA: "",
    branches: "",
    experience: "Fresher"
};


/* =========================================================
   ADD JOB
========================================================= */

function AddJob() {

    const { user } = useAuth();


    /* =====================================================
       STATES
    ===================================================== */

    const [formData, setFormData] =
        useState(INITIAL_FORM_DATA);

    const [loading, setLoading] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [messageType, setMessageType] =
        useState("success");


    /* =====================================================
       INPUT CHANGE
    ===================================================== */

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

    };


    /* =====================================================
       CHECK COMPANY PROFILE
    ===================================================== */

    const checkCompanyProfile = async () => {

        if (!user?.uid) {

            return {
                complete: false,
                reason:
                    "Company information is not available. Please login again."
            };

        }

        try {

            const companyRef =
                doc(
                    db,
                    "companies",
                    user.uid
                );

            const companySnapshot =
                await getDoc(companyRef);


            if (!companySnapshot.exists()) {

                return {
                    complete: false,
                    reason:
                        "Please complete your company profile before posting a job."
                };

            }


            const company =
                companySnapshot.data();


            const requiredFields = [

                {
                    field: "companyName",
                    label: "Company Name"
                },

                {
                    field: "phone",
                    label: "Phone Number"
                },

                {
                    field: "industry",
                    label: "Industry"
                },

                {
                    field: "website",
                    label: "Website"
                },

                {
                    field: "location",
                    label: "Location"
                },

                {
                    field: "description",
                    label: "Company Description"
                }

            ];


            const missingFields =
                requiredFields
                    .filter(
                        (item) =>
                            !String(
                                company[item.field] || ""
                            ).trim()
                    )
                    .map(
                        (item) =>
                            item.label
                    );


            if (missingFields.length > 0) {

                return {

                    complete: false,

                    reason:
                        `Please complete your company profile before posting a job.\n\nMissing information:\n• ${missingFields.join(
                            "\n• "
                        )}`

                };

            }


            return {

                complete: true,

                company

            };

        }

        catch (error) {

            console.error(
                "Company profile check error:",
                error
            );

            return {

                complete: false,

                reason:
                    "Unable to verify your company profile. Please try again."

            };

        }

    };


    /* =====================================================
       CREATE STUDENT + TPO NOTIFICATIONS
    ===================================================== */

    const createJobNotifications = async (job) => {

        try {

            console.log(
                "Starting job notifications..."
            );


            const usersRef =
                collection(
                    db,
                    "users"
                );


            /* =================================================
               GET STUDENTS
            ================================================= */

            const studentQuery =
                query(
                    usersRef,
                    where(
                        "role",
                        "==",
                        "student"
                    )
                );


            /* =================================================
               GET TPO USERS
            ================================================= */

            const tpoQuery =
                query(
                    usersRef,
                    where(
                        "role",
                        "==",
                        "tpo"
                    )
                );


            const [
                studentSnapshot,
                tpoSnapshot
            ] = await Promise.all([

                getDocs(
                    studentQuery
                ),

                getDocs(
                    tpoQuery
                )

            ]);


            console.log(
                "Students found:",
                studentSnapshot.size
            );


            console.log(
                "TPO users found:",
                tpoSnapshot.size
            );


            const notificationsRef =
                collection(
                    db,
                    "notifications"
                );


            const notificationPromises = [];


            /* =================================================
               STUDENT NOTIFICATIONS
            ================================================= */

            studentSnapshot.forEach(
                (studentDocument) => {

                    const studentData =
                        studentDocument.data();


                    const studentId =
                        studentDocument.id;


                    if (!studentId) {
                        return;
                    }


                    const notificationData = {

                        userId:
                            studentId,

                        message:
                            `New job posted: "${job.jobTitle}" at ${job.companyName}. Check the available jobs section for more details.`,

                        type:
                            "new_job",

                        read:
                            false,

                        jobId:
                            job.id,

                        jobTitle:
                            job.jobTitle,

                        jobDescription:
                            job.jobDescription,

                        location:
                            job.location,

                        salary:
                            job.salary,

                        deadline:
                            job.deadline,

                        companyId:
                            job.companyId,

                        companyName:
                            job.companyName,

                        companyEmail:
                            job.companyEmail,

                        studentEmail:
                            studentData.email || "",

                        createdAt:
                            serverTimestamp()

                    };


                    notificationPromises.push(

                        addDoc(
                            notificationsRef,
                            notificationData
                        )

                    );

                }
            );


            /* =================================================
               TPO NOTIFICATIONS
            ================================================= */

            tpoSnapshot.forEach(
                (tpoDocument) => {

                    const tpoData =
                        tpoDocument.data();


                    const tpoId =
                        tpoDocument.id;


                    if (!tpoId) {
                        return;
                    }


                    const notificationData = {

                        userId:
                            tpoId,

                        message:
                            `New placement job posted by ${job.companyName}: "${job.jobTitle}".`,

                        type:
                            "new_job",

                        read:
                            false,

                        jobId:
                            job.id,

                        jobTitle:
                            job.jobTitle,

                        jobDescription:
                            job.jobDescription,

                        location:
                            job.location,

                        salary:
                            job.salary,

                        deadline:
                            job.deadline,

                        companyId:
                            job.companyId,

                        companyName:
                            job.companyName,

                        companyEmail:
                            job.companyEmail,

                        tpoEmail:
                            tpoData.email || "",

                        createdAt:
                            serverTimestamp()

                    };


                    notificationPromises.push(

                        addDoc(
                            notificationsRef,
                            notificationData
                        )

                    );

                }
            );


            /* =================================================
               CREATE ALL NOTIFICATIONS
            ================================================= */

            if (
                notificationPromises.length > 0
            ) {

                await Promise.all(
                    notificationPromises
                );

            }


            console.log(
                `Created ${notificationPromises.length} job notifications.`
            );


            return {

                success: true,

                count:
                    notificationPromises.length,

                students:
                    studentSnapshot.size,

                tpo:
                    tpoSnapshot.size,

                studentSnapshot,

                tpoSnapshot

            };

        }

        catch (error) {

            console.error(
                "Job notification error:",
                error
            );


            return {

                success: false,

                error

            };

        }

    };


    /* =====================================================
       SEND JOB EMAILS
       
       Sends email to:
       - Students
       - TPO users

       Email failure does NOT cancel job posting.
    ===================================================== */

    const sendJobEmails = async (
        job,
        studentSnapshot,
        tpoSnapshot
    ) => {

        try {

            console.log(
                "Starting job email notifications..."
            );


            const emailPromises = [];


            /* =================================================
               EMAIL CONTENT
            ================================================= */

            const subject =
                `New Job Opportunity - ${job.jobTitle}`;


            const htmlMessage = `
                <div
                    style="
                        font-family: Arial, sans-serif;
                        max-width: 650px;
                        margin: 0 auto;
                        padding: 24px;
                        background: #ffffff;
                        color: #222222;
                    "
                >

                    <div
                        style="
                            padding: 20px;
                            background: #667eea;
                            color: #ffffff;
                            border-radius: 10px 10px 0 0;
                        "
                    >

                        <h2
                            style="
                                margin: 0;
                                font-size: 24px;
                            "
                        >
                            New Job Opportunity
                        </h2>

                        <p
                            style="
                                margin: 8px 0 0;
                                font-size: 15px;
                            "
                        >
                            Placement Management System
                        </p>

                    </div>


                    <div
                        style="
                            border: 1px solid #e5e7eb;
                            border-top: none;
                            padding: 24px;
                            border-radius: 0 0 10px 10px;
                        "
                    >

                        <h2
                            style="
                                margin-top: 0;
                                color: #333333;
                            "
                        >
                            ${job.jobTitle}
                        </h2>


                        <p>
                            <strong>Company:</strong>
                            ${job.companyName}
                        </p>


                        <p>
                            <strong>Location:</strong>
                            ${job.location}
                        </p>


                        <p>
                            <strong>Salary / Package:</strong>
                            ${job.salary}
                        </p>


                        <p>
                            <strong>Application Deadline:</strong>
                            ${job.deadline}
                        </p>


                        <hr
                            style="
                                border: none;
                                border-top: 1px solid #eeeeee;
                                margin: 20px 0;
                            "
                        />


                        <h3>
                            Job Description
                        </h3>

                        <p
                            style="
                                line-height: 1.6;
                                white-space: pre-line;
                            "
                        >
                            ${job.jobDescription}
                        </p>


                        <h3>
                            Required Skills
                        </h3>

                        <p>
                            ${job.skills}
                        </p>


                        <h3>
                            Eligibility
                        </h3>

                        <p>
                            <strong>Education:</strong>
                            ${job.eligibility.education}
                        </p>

                        <p>
                            <strong>Minimum 10th:</strong>
                            ${job.eligibility.minimum10th}%
                        </p>

                        <p>
                            <strong>Minimum 12th:</strong>
                            ${job.eligibility.minimum12th}%
                        </p>

                        <p>
                            <strong>Minimum CGPA:</strong>
                            ${job.eligibility.minimumCGPA}/10
                        </p>

                        <p>
                            <strong>Branches:</strong>
                            ${
                                job.eligibility.branches ||
                                "All branches"
                            }
                        </p>

                        <p>
                            <strong>Experience:</strong>
                            ${job.eligibility.experience}
                        </p>


                        <div
                            style="
                                margin-top: 25px;
                                padding: 15px;
                                background: #f5f7ff;
                                border-radius: 8px;
                            "
                        >

                            <p
                                style="
                                    margin: 0;
                                    line-height: 1.6;
                                "
                            >
                                Log in to the Placement Management
                                System to view the complete job
                                details and apply.
                            </p>

                        </div>


                        <p
                            style="
                                margin-top: 25px;
                                color: #666666;
                                font-size: 13px;
                            "
                        >
                            This is an automated email from the
                            Placement Management System.
                        </p>

                    </div>

                </div>
            `;


            /* =================================================
               STUDENT EMAILS
            ================================================= */

            if (studentSnapshot) {

                studentSnapshot.forEach(
                    (studentDocument) => {

                        const studentData =
                            studentDocument.data();


                        const studentEmail =
                            String(
                                studentData.email || ""
                            )
                                .trim()
                                .toLowerCase();


                        if (!studentEmail) {

                            console.log(
                                "Student has no email:",
                                studentDocument.id
                            );

                            return;

                        }


                        emailPromises.push(

                            sendEmail({

                                to:
                                    studentEmail,

                                subject,

                                message:
                                    htmlMessage

                            })
                                .then(() => {

                                    console.log(
                                        "Student email sent:",
                                        studentEmail
                                    );

                                    return {
                                        success: true,
                                        email: studentEmail,
                                        role: "student"
                                    };

                                })
                                .catch((error) => {

                                    console.error(
                                        `Failed to send student email to ${studentEmail}:`,
                                        error
                                    );

                                    return {
                                        success: false,
                                        email: studentEmail,
                                        role: "student",
                                        error
                                    };

                                })

                        );

                    }
                );

            }


            /* =================================================
               TPO EMAILS
            ================================================= */

            if (tpoSnapshot) {

                tpoSnapshot.forEach(
                    (tpoDocument) => {

                        const tpoData =
                            tpoDocument.data();


                        const tpoEmail =
                            String(
                                tpoData.email || ""
                            )
                                .trim()
                                .toLowerCase();


                        if (!tpoEmail) {

                            console.log(
                                "TPO user has no email:",
                                tpoDocument.id
                            );

                            return;

                        }


                        emailPromises.push(

                            sendEmail({

                                to:
                                    tpoEmail,

                                subject:
                                    `New Placement Job Posted - ${job.jobTitle}`,

                                message:
                                    htmlMessage

                            })
                                .then(() => {

                                    console.log(
                                        "TPO email sent:",
                                        tpoEmail
                                    );

                                    return {
                                        success: true,
                                        email: tpoEmail,
                                        role: "tpo"
                                    };

                                })
                                .catch((error) => {

                                    console.error(
                                        `Failed to send TPO email to ${tpoEmail}:`,
                                        error
                                    );

                                    return {
                                        success: false,
                                        email: tpoEmail,
                                        role: "tpo",
                                        error
                                    };

                                })

                        );

                    }
                );

            }


            /* =================================================
               NO EMAILS
            ================================================= */

            if (
                emailPromises.length === 0
            ) {

                console.log(
                    "No user email addresses found."
                );

                return {

                    success: false,

                    total:
                        0,

                    sent:
                        0,

                    failed:
                        0

                };

            }


            /* =================================================
               SEND EMAILS
            ================================================= */

            const results =
                await Promise.all(
                    emailPromises
                );


            const successfulEmails =
                results.filter(
                    (result) =>
                        result.success
                );


            const failedEmails =
                results.filter(
                    (result) =>
                        !result.success
                );


            console.log(
                "================================="
            );

            console.log(
                "JOB EMAIL RESULT"
            );

            console.log(
                "Total:",
                results.length
            );

            console.log(
                "Sent:",
                successfulEmails.length
            );

            console.log(
                "Failed:",
                failedEmails.length
            );

            console.log(
                "================================="
            );


            return {

                success:
                    successfulEmails.length > 0,

                total:
                    results.length,

                sent:
                    successfulEmails.length,

                failed:
                    failedEmails.length,

                results

            };

        }

        catch (error) {

            console.error(
                "Job email notification error:",
                error
            );


            return {

                success: false,

                total: 0,

                sent: 0,

                failed: 0,

                error

            };

        }

    };


    /* =====================================================
       SUBMIT JOB
    ===================================================== */

    const handleSubmit = async (e) => {

        e.preventDefault();


        setMessage("");

        setMessageType("success");


        /* =================================================
           LOGIN CHECK
        ================================================= */

        if (!user?.uid) {

            setMessageType("error");

            setMessage(
                "Company information is not available. Please login again."
            );

            return;

        }


        /* =================================================
           COMPANY PROFILE CHECK
        ================================================= */

        const profileResult =
            await checkCompanyProfile();


        if (!profileResult.complete) {

            setMessageType("error");

            setMessage(
                profileResult.reason
            );


            alert(
                profileResult.reason
            );


            return;

        }


        /* =================================================
           BASIC VALIDATION
        ================================================= */

        if (
            !formData.jobTitle.trim()
        ) {

            setMessageType("error");

            setMessage(
                "Please enter a job title."
            );

            return;

        }


        if (
            !formData.location.trim()
        ) {

            setMessageType("error");

            setMessage(
                "Please enter the job location."
            );

            return;

        }


        if (
            !formData.salary.trim()
        ) {

            setMessageType("error");

            setMessage(
                "Please enter the salary or package."
            );

            return;

        }


        if (!formData.deadline) {

            setMessageType("error");

            setMessage(
                "Please select an application deadline."
            );

            return;

        }


        if (
            !formData.jobDescription.trim()
        ) {

            setMessageType("error");

            setMessage(
                "Please enter the job description."
            );

            return;

        }


        if (
            !formData.skills.trim()
        ) {

            setMessageType("error");

            setMessage(
                "Please enter the required skills."
            );

            return;

        }


        /* =================================================
           NUMBER VALIDATION
        ================================================= */

        const minimum10th =
            formData.minimum10th === ""
                ? 0
                : Number(
                    formData.minimum10th
                );


        const minimum12th =
            formData.minimum12th === ""
                ? 0
                : Number(
                    formData.minimum12th
                );


        const minimumCGPA =
            formData.minimumCGPA === ""
                ? 0
                : Number(
                    formData.minimumCGPA
                );


        if (
            minimum10th < 0 ||
            minimum10th > 100
        ) {

            setMessageType("error");

            setMessage(
                "Minimum 10th percentage must be between 0 and 100."
            );

            return;

        }


        if (
            minimum12th < 0 ||
            minimum12th > 100
        ) {

            setMessageType("error");

            setMessage(
                "Minimum 12th percentage must be between 0 and 100."
            );

            return;

        }


        if (
            minimumCGPA < 0 ||
            minimumCGPA > 10
        ) {

            setMessageType("error");

            setMessage(
                "Minimum CGPA must be between 0 and 10."
            );

            return;

        }


        /* =================================================
           START LOADING
        ================================================= */

        try {

            setLoading(true);


            /* =================================================
               COMPANY PROFILE DATA
            ================================================= */

            const companyProfile =
                profileResult.company;


            /* =================================================
               JOB DATA
            ================================================= */

            const jobData = {

                jobTitle:
                    formData.jobTitle.trim(),

                location:
                    formData.location.trim(),

                salary:
                    formData.salary.trim(),

                deadline:
                    formData.deadline,

                jobDescription:
                    formData.jobDescription.trim(),

                skills:
                    formData.skills.trim(),


                /* ==========================================
                   ELIGIBILITY
                ========================================== */

                eligibility: {

                    education:
                        formData.education,

                    minimum10th:
                        minimum10th,

                    minimum12th:
                        minimum12th,

                    minimumCGPA:
                        minimumCGPA,

                    branches:
                        formData.branches.trim(),

                    experience:
                        formData.experience

                },


                /* ==========================================
                   COMPANY INFORMATION
                ========================================== */

                companyId:
                    user.uid,

                companyName:
                    companyProfile.companyName.trim(),

                companyEmail:
                    companyProfile.email ||
                    user.email ||
                    "",


                /* ==========================================
                   STATUS
                ========================================== */

                status:
                    "active",


                /* ==========================================
                   TIMESTAMPS
                ========================================== */

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            };


            console.log(
                "Creating job:",
                jobData
            );


            /* =================================================
               CREATE JOB
            ================================================= */

            const jobReference =
                await addDoc(

                    collection(
                        db,
                        "jobs"
                    ),

                    jobData

                );


            console.log(
                "Job created:",
                jobReference.id
            );


            /* =================================================
               COMPLETE JOB OBJECT
            ================================================= */

            const createdJob = {

                id:
                    jobReference.id,

                ...jobData

            };


            /* =================================================
               CREATE STUDENT + TPO NOTIFICATIONS
            ================================================= */

            const notificationResult =
                await createJobNotifications(
                    createdJob
                );


            console.log(
                "Notification result:",
                notificationResult
            );


            /* =================================================
               SEND EMAILS
               
               Only after the job is successfully created.
            ================================================= */

            let emailResult = {

                success: false,

                total: 0,

                sent: 0,

                failed: 0

            };


            if (
                notificationResult?.success
            ) {

                emailResult =
                    await sendJobEmails(

                        createdJob,

                        notificationResult.studentSnapshot,

                        notificationResult.tpoSnapshot

                    );

            }


            console.log(
                "Email result:",
                emailResult
            );


            /* =================================================
               SUCCESS MESSAGE
            ================================================= */

            if (
                notificationResult?.success
            ) {

                if (
                    emailResult?.sent > 0
                ) {

                    setMessageType(
                        "success"
                    );

                    setMessage(
                        `Job posted successfully! ${notificationResult.students} student(s) and ${notificationResult.tpo} TPO notification(s) created. ${emailResult.sent} email(s) sent.`
                    );

                }

                else {

                    setMessageType(
                        "success"
                    );

                    setMessage(
                        `Job posted successfully! ${notificationResult.count} notification(s) created, but email notifications could not be sent.`
                    );

                }

            }

            else {

                setMessageType(
                    "success"
                );

                setMessage(
                    "Job posted successfully, but notifications could not be created."
                );

            }


            /* =================================================
               RESET FORM
            ================================================= */

            setFormData({
                ...INITIAL_FORM_DATA
            });

        }

        catch (error) {

            console.error(
                "Error adding job:",
                error
            );


            setMessageType(
                "error"
            );


            setMessage(
                error?.message ||
                "Unable to post job. Please try again."
            );

        }

        finally {

            setLoading(
                false
            );

        }

    };


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <div className="add-job">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="add-job-header">

                <div className="add-job-title">

                    <span className="page-label">
                        JOB MANAGEMENT
                    </span>

                    <h1>
                        Post a New Job
                    </h1>

                    <p>
                        Create a job opportunity and define
                        eligibility criteria for students.
                    </p>

                </div>


                <div className="header-icon">

                    <FaBriefcase />

                </div>

            </div>


            {/* =================================================
                MESSAGE
            ================================================= */}

            {message && (

                <div
                    className={
                        `job-message ${
                            messageType === "error"
                                ? "job-message-error"
                                : "job-message-success"
                        }`
                    }
                >

                    {message}

                </div>

            )}


            {/* =================================================
                FORM
            ================================================= */}

            <form
                className="job-form"
                onSubmit={handleSubmit}
            >


                {/* =================================================
                    JOB INFORMATION
                ================================================= */}

                <section className="form-section">

                    <div className="form-section-header">

                        <div className="section-icon">

                            <FaBriefcase />

                        </div>


                        <div>

                            <h2>
                                Job Information
                            </h2>

                            <p>
                                Provide the basic details
                                about this position.
                            </p>

                        </div>

                    </div>


                    <div className="form-grid">


                        {/* JOB TITLE */}

                        <div className="form-group full">

                            <label htmlFor="jobTitle">
                                Job Title
                            </label>

                            <input
                                id="jobTitle"
                                type="text"
                                name="jobTitle"
                                value={
                                    formData.jobTitle
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="e.g. Software Developer"
                                maxLength={150}
                                required
                            />

                        </div>


                        {/* LOCATION */}

                        <div className="form-group">

                            <label htmlFor="location">

                                <FaMapMarkerAlt />

                                Location

                            </label>

                            <input
                                id="location"
                                type="text"
                                name="location"
                                value={
                                    formData.location
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="e.g. Pune"
                                maxLength={100}
                                required
                            />

                        </div>


                        {/* SALARY */}

                        <div className="form-group">

                            <label htmlFor="salary">

                                <FaMoneyBillWave />

                                Salary / Package

                            </label>

                            <input
                                id="salary"
                                type="text"
                                name="salary"
                                value={
                                    formData.salary
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="e.g. 4 LPA"
                                maxLength={100}
                                required
                            />

                        </div>


                        {/* DEADLINE */}

                        <div className="form-group">

                            <label htmlFor="deadline">

                                <FaCalendarAlt />

                                Application Deadline

                            </label>

                            <input
                                id="deadline"
                                type="date"
                                name="deadline"
                                value={
                                    formData.deadline
                                }
                                onChange={
                                    handleChange
                                }
                                required
                            />

                        </div>


                        {/* SKILLS */}

                        <div className="form-group">

                            <label htmlFor="skills">

                                <FaCode />

                                Required Skills

                            </label>

                            <input
                                id="skills"
                                type="text"
                                name="skills"
                                value={
                                    formData.skills
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="Java, React, SQL"
                                maxLength={300}
                                required
                            />

                            <small>
                                Separate multiple skills using commas.
                            </small>

                        </div>


                        {/* DESCRIPTION */}

                        <div className="form-group full">

                            <label htmlFor="jobDescription">
                                Job Description
                            </label>

                            <textarea
                                id="jobDescription"
                                name="jobDescription"
                                value={
                                    formData.jobDescription
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="Describe responsibilities, requirements and role..."
                                maxLength={3000}
                                required
                            />

                        </div>

                    </div>

                </section>


                {/* =================================================
                    ELIGIBILITY
                ================================================= */}

                <section className="form-section">


                    <div className="form-section-header">

                        <div className="section-icon eligibility">

                            <FaGraduationCap />

                        </div>


                        <div>

                            <h2>
                                Eligibility Criteria
                            </h2>

                            <p>
                                Define the academic requirements
                                students must meet.
                            </p>

                        </div>

                    </div>


                    <div className="criteria-note">

                        <FaChartLine />

                        <span>
                            Students meeting these requirements
                            will be considered eligible for
                            this position.
                        </span>

                    </div>


                    <div className="form-grid">


                        {/* EDUCATION */}

                        <div className="form-group">

                            <label htmlFor="education">

                                Minimum Education

                            </label>

                            <select
                                id="education"
                                name="education"
                                value={
                                    formData.education
                                }
                                onChange={
                                    handleChange
                                }
                            >

                                <option value="10th">
                                    10th Pass
                                </option>

                                <option value="12th">
                                    12th Pass
                                </option>

                                <option value="Diploma">
                                    Diploma
                                </option>

                                <option value="Graduate">
                                    Graduate
                                </option>

                                <option value="Post Graduate">
                                    Post Graduate
                                </option>

                            </select>

                        </div>


                        {/* EXPERIENCE */}

                        <div className="form-group">

                            <label htmlFor="experience">

                                Experience

                            </label>

                            <select
                                id="experience"
                                name="experience"
                                value={
                                    formData.experience
                                }
                                onChange={
                                    handleChange
                                }
                            >

                                <option value="Fresher">
                                    Fresher
                                </option>

                                <option value="0-1">
                                    0 - 1 Years
                                </option>

                                <option value="1-2">
                                    1 - 2 Years
                                </option>

                                <option value="2+">
                                    2+ Years
                                </option>

                            </select>

                        </div>


                        {/* 10TH */}

                        <div className="form-group">

                            <label htmlFor="minimum10th">

                                Minimum 10th %

                            </label>

                            <div className="input-with-suffix">

                                <input
                                    id="minimum10th"
                                    type="number"
                                    name="minimum10th"
                                    value={
                                        formData.minimum10th
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="e.g. 60"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                />

                                <span>
                                    %
                                </span>

                            </div>

                        </div>


                        {/* 12TH */}

                        <div className="form-group">

                            <label htmlFor="minimum12th">

                                Minimum 12th %

                            </label>

                            <div className="input-with-suffix">

                                <input
                                    id="minimum12th"
                                    type="number"
                                    name="minimum12th"
                                    value={
                                        formData.minimum12th
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="e.g. 60"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                />

                                <span>
                                    %
                                </span>

                            </div>

                        </div>


                        {/* CGPA */}

                        <div className="form-group">

                            <label htmlFor="minimumCGPA">

                                Minimum CGPA

                            </label>

                            <div className="input-with-suffix">

                                <input
                                    id="minimumCGPA"
                                    type="number"
                                    name="minimumCGPA"
                                    value={
                                        formData.minimumCGPA
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="e.g. 7.0"
                                    min="0"
                                    max="10"
                                    step="0.1"
                                />

                                <span>
                                    / 10
                                </span>

                            </div>

                        </div>


                        {/* BRANCHES */}

                        <div className="form-group">

                            <label htmlFor="branches">

                                Eligible Branches

                            </label>

                            <input
                                id="branches"
                                type="text"
                                name="branches"
                                value={
                                    formData.branches
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="CSE, IT, ECE"
                                maxLength={300}
                            />

                            <small>
                                Leave empty if all branches are eligible.
                            </small>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    FOOTER
                ================================================= */}

                <div className="form-footer">

                    <p>
                        Please review all information
                        before posting the job.
                    </p>


                    <button
                        type="submit"
                        disabled={loading}
                    >

                        {loading ? (

                            <span>
                                Posting Job...
                            </span>

                        ) : (

                            <>

                                <FaPaperPlane />

                                Post Job

                            </>

                        )}

                    </button>

                </div>

            </form>

        </div>

    );

}

export default AddJob;
