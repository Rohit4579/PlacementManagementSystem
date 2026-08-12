import { useEffect, useState } from "react";

import {
    collection,
    query,
    where,
    getDocs,
    updateDoc,
    deleteDoc,
    doc
} from "firebase/firestore";

import {
    getStorage,
    ref,
    getDownloadURL
} from "firebase/storage";

import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../context/AuthContext";

import sendEmail from "../../services/emailService";

import "./Applicants.css";

/* =========================================================
   APPLICANTS
========================================================= */

function Applicants() {

    const { user } = useAuth();

    /* =========================================================
       STATES
    ========================================================= */

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const [selectedApplicant, setSelectedApplicant] =
        useState(null);

    /* =========================================================
       FIREBASE STORAGE
    ========================================================= */

    const storage = getStorage();

    /* =========================================================
       GET FIRST AVAILABLE VALUE
    ========================================================= */

    const getFirstValue = (
        profile,
        fields,
        fallback = "Not Available"
    ) => {

        if (!profile) {
            return fallback;
        }

        for (const field of fields) {

            const value = profile?.[field];

            if (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            ) {
                return value;
            }
        }

        return fallback;
    };

    /* =========================================================
       EXTRACT IMAGE VALUE
    ========================================================= */

    const extractImageValue = (value) => {

        if (!value) {
            return "";
        }

        if (typeof value === "string") {

            const cleanValue = value.trim();

            if (!cleanValue) {
                return "";
            }

            return cleanValue;
        }

        if (
            typeof value === "object" &&
            !Array.isArray(value)
        ) {

            const possibleKeys = [
                "url",
                "URL",
                "downloadURL",
                "downloadUrl",
                "imageURL",
                "imageUrl",
                "photoURL",
                "photoUrl",
                "profilePhoto",
                "profilePhotoURL",
                "profilePhotoUrl",
                "profileImage",
                "profileImageURL",
                "profileImageUrl",
                "profilePicture",
                "profilePictureURL",
                "profilePictureUrl",
                "src",
                "path",
                "fullPath",
                "storagePath"
            ];

            for (const key of possibleKeys) {

                const nestedValue = value?.[key];

                if (
                    nestedValue !== undefined &&
                    nestedValue !== null &&
                    String(nestedValue).trim() !== ""
                ) {

                    return String(nestedValue).trim();
                }
            }
        }

        return "";
    };

    /* =========================================================
       PHOTO FIELDS
    ========================================================= */

    const photoFields = [
        "photoURL",
        "photoUrl",
        "photo",
        "profilePhoto",
        "profilePhotoURL",
        "profilePhotoUrl",
        "profileImage",
        "profileImageURL",
        "profileImageUrl",
        "profilePicture",
        "profilePictureURL",
        "profilePictureUrl",
        "avatar",
        "avatarURL",
        "avatarUrl",
        "image",
        "imageURL",
        "imageUrl",
        "picture",
        "pictureURL",
        "pictureUrl",
        "photoPath",
        "profilePhotoPath",
        "profileImagePath",
        "profilePicturePath",
        "storagePath",
        "imagePath"
    ];

    /* =========================================================
       SEARCH PHOTO IN OBJECT
    ========================================================= */

    const searchPhotoInObject = (object) => {

        if (!object) {
            return "";
        }

        for (const field of photoFields) {

            const result =
                extractImageValue(
                    object?.[field]
                );

            if (result) {
                return result;
            }
        }

        const nestedObjects = [
            object.profile,
            object.personalInfo,
            object.personalInformation,
            object.user,
            object.userData,
            object.account,
            object.student,
            object.studentProfile,
            object.personal,
            object.basicInfo,
            object.contactInfo
        ];

        for (const nestedObject of nestedObjects) {

            if (!nestedObject) {
                continue;
            }

            for (const field of photoFields) {

                const result =
                    extractImageValue(
                        nestedObject?.[field]
                    );

                if (result) {
                    return result;
                }
            }
        }

        return "";
    };

    /* =========================================================
       GET PROFILE PHOTO VALUE
    ========================================================= */

    const getProfilePhotoValue = (
        profile,
        application,
        userProfile
    ) => {

        const profilePhoto =
            searchPhotoInObject(profile);

        if (profilePhoto) {
            return profilePhoto;
        }

        const userPhoto =
            searchPhotoInObject(userProfile);

        if (userPhoto) {
            return userPhoto;
        }

        const applicationPhoto =
            searchPhotoInObject(application);

        if (applicationPhoto) {
            return applicationPhoto;
        }

        return "";
    };

    /* =========================================================
       RESOLVE PROFILE PHOTO
    ========================================================= */

    const resolveProfilePhoto = async (
        photoValue
    ) => {

        if (!photoValue) {
            return "";
        }

        const value =
            String(photoValue).trim();

        if (!value) {
            return "";
        }

        if (
            value.startsWith("data:image/")
        ) {
            return value;
        }

        if (
            value.startsWith("http://") ||
            value.startsWith("https://")
        ) {
            return value;
        }

        try {

            const storageReference =
                ref(
                    storage,
                    value
                );

            const downloadURL =
                await getDownloadURL(
                    storageReference
                );

            return downloadURL;

        } catch (error) {

            console.warn(
                "Could not resolve Firebase Storage profile photo:",
                value,
                error
            );

            return "";
        }
    };

    /* =========================================================
       FIND PROFILE BY MULTIPLE IDENTIFIERS
    ========================================================= */

    const findStudentProfile = (
        application,
        profilesById,
        profilesByUid,
        profilesByEmail,
        profilesByStudentId,
        profilesByUserId
    ) => {

        const possibleIds = [
            application.studentId,
            application.uid,
            application.userId,
            application.studentUid,
            application.studentUID,
            application.userUid,
            application.userUID
        ]
            .filter(Boolean)
            .map(value =>
                String(value).trim()
            );

        for (const id of possibleIds) {

            if (profilesById[id]) {
                return profilesById[id];
            }
        }

        for (const id of possibleIds) {

            if (profilesByUid[id]) {
                return profilesByUid[id];
            }
        }

        for (const id of possibleIds) {

            if (profilesByStudentId[id]) {
                return profilesByStudentId[id];
            }
        }

        for (const id of possibleIds) {

            if (profilesByUserId[id]) {
                return profilesByUserId[id];
            }
        }

        const possibleEmails = [
            application.email,
            application.studentEmail,
            application.userEmail,
            application.applicantEmail
        ]
            .filter(Boolean)
            .map(value =>
                String(value)
                    .trim()
                    .toLowerCase()
            );

        for (const email of possibleEmails) {

            if (profilesByEmail[email]) {
                return profilesByEmail[email];
            }
        }

        return null;
    };

    /* =========================================================
       FETCH ON USER CHANGE
    ========================================================= */

    useEffect(() => {

        if (user?.uid) {

            fetchApplicants();

        } else {

            setApplications([]);
            setLoading(false);
        }

    }, [user]);

    /* =========================================================
       CLOSE OVERLAY WITH ESCAPE
    ========================================================= */

    useEffect(() => {

        const handleKeyDown = (event) => {

            if (
                event.key === "Escape" &&
                selectedApplicant
            ) {

                setSelectedApplicant(null);
            }
        };

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {

            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };

    }, [selectedApplicant]);

    /* =========================================================
       LOCK BODY WHEN OVERLAY OPEN
    ========================================================= */

    useEffect(() => {

        if (selectedApplicant) {

            document.body.style.overflow =
                "hidden";

        } else {

            document.body.style.overflow =
                "";
        }

        return () => {

            document.body.style.overflow =
                "";
        };

    }, [selectedApplicant]);

    /* =========================================================
       FETCH APPLICANTS
       
       IMPORTANT:
       Only applications belonging to the logged-in
       company are queried.
    ========================================================= */

    const fetchApplicants = async () => {

        if (!user?.uid) {

            setApplications([]);
            setLoading(false);

            return;
        }

        try {

            setLoading(true);

            /* =================================================
               1. GET ONLY THIS COMPANY'S APPLICATIONS
            ================================================= */

            const applicationsQuery =
                query(
                    collection(
                        db,
                        "applications"
                    ),
                    where(
                        "companyId",
                        "==",
                        user.uid
                    )
                );

            const snapshot =
                await getDocs(
                    applicationsQuery
                );

            /* =================================================
               2. LOAD STUDENT PROFILES
            ================================================= */

            const profilesSnapshot =
                await getDocs(
                    collection(
                        db,
                        "studentProfiles"
                    )
                );

            const profilesById = {};
            const profilesByUid = {};
            const profilesByEmail = {};
            const profilesByStudentId = {};
            const profilesByUserId = {};

            profilesSnapshot.docs.forEach(
                profileDocument => {

                    const profile =
                        profileDocument.data();

                    const profileData = {
                        id: profileDocument.id,
                        ...profile
                    };

                    profilesById[
                        profileDocument.id
                    ] = profileData;

                    const uid =
                        profile.uid ||
                        profile.userUid ||
                        profile.userUID;

                    if (uid) {

                        profilesByUid[
                            String(uid)
                        ] = profileData;
                    }

                    const email =
                        profile.email ||
                        profile.studentEmail ||
                        profile.emailAddress;

                    if (email) {

                        profilesByEmail[
                            String(email)
                                .trim()
                                .toLowerCase()
                        ] = profileData;
                    }

                    const studentId =
                        profile.studentId ||
                        profile.studentID;

                    if (studentId) {

                        profilesByStudentId[
                            String(studentId)
                        ] = profileData;
                    }

                    const userId =
                        profile.userId ||
                        profile.userID;

                    if (userId) {

                        profilesByUserId[
                            String(userId)
                        ] = profileData;
                    }
                }
            );

            /* =================================================
               3. LOAD USERS
            ================================================= */

            let usersById = {};
            let usersByEmail = {};

            try {

                const usersSnapshot =
                    await getDocs(
                        collection(
                            db,
                            "users"
                        )
                    );

                usersSnapshot.docs.forEach(
                    userDocument => {

                        const userData = {
                            id: userDocument.id,
                            ...userDocument.data()
                        };

                        usersById[
                            userDocument.id
                        ] = userData;

                        const email =
                            userData.email ||
                            userData.studentEmail ||
                            userData.emailAddress;

                        if (email) {

                            usersByEmail[
                                String(email)
                                    .trim()
                                    .toLowerCase()
                            ] = userData;
                        }
                    }
                );

            } catch (usersError) {

                console.warn(
                    "Users collection could not be loaded:",
                    usersError
                );
            }

            /* =================================================
               4. PROCESS APPLICATIONS
            ================================================= */

            const data = [];

            for (
                const item of snapshot.docs
            ) {

                const application = {
                    id: item.id,
                    ...item.data()
                };

                /*
                 * Extra ownership protection.
                 *
                 * Even though the Firestore query already uses
                 * companyId == user.uid, do not place an
                 * incorrectly owned document into local state.
                 */

                if (
                    application.companyId !==
                    user.uid
                ) {
                    continue;
                }

                application.phone =
                    application.phone ||
                    application.mobile ||
                    "Not Available";

                application.department =
                    application.department ||
                    application.branch ||
                    "Not Available";

                application.degree =
                    application.degree ||
                    application.course ||
                    application.program ||
                    application.qualification ||
                    "Not Available";

                application.email =
                    application.email ||
                    application.studentEmail ||
                    application.userEmail ||
                    "";

                application.studentEmail =
                    application.studentEmail ||
                    application.email ||
                    "";

                application.skills =
                    application.skills ||
                    "Not Available";

                application.cgpa =
                    application.cgpa ??
                    application.CGPA ??
                    "Not Available";

                application.tenthPercentage =
                    application.tenthPercentage ??
                    application.percentage10th ??
                    application.tenThPercentage ??
                    application.tenthPercent ??
                    application.minimum10th ??
                    application["10thPercentage"] ??
                    application["10th"] ??
                    "Not Available";

                application.twelfthPercentage =
                    application.twelfthPercentage ??
                    application.percentage12th ??
                    application.twelveThPercentage ??
                    application.twelfthPercent ??
                    application.minimum12th ??
                    application["12thPercentage"] ??
                    application["12th"] ??
                    "Not Available";

                application.resumeURL =
                    application.resumeURL ||
                    application.resumeUrl ||
                    application.resume ||
                    "";

                application.college =
                    application.college ||
                    application.collegeName ||
                    "Not Available";

                /* =================================================
                   PLACEMENT
                ================================================= */

                application.placedStudent =
                    application.placedStudent === true;

                application.placementActivity =
                    application.placementActivity ||
                    (
                        application.placedStudent
                            ? "Placed"
                            : "Shortlisted"
                    );

                /* =================================================
                   FIND STUDENT PROFILE
                ================================================= */

                const profile =
                    findStudentProfile(
                        application,
                        profilesById,
                        profilesByUid,
                        profilesByEmail,
                        profilesByStudentId,
                        profilesByUserId
                    );

                /* =================================================
                   FIND USER PROFILE
                ================================================= */

                let userProfile = null;

                const possibleUserIds = [
                    application.studentId,
                    application.uid,
                    application.userId,
                    application.studentUid,
                    application.studentUID,
                    profile?.uid,
                    profile?.userId
                ]
                    .filter(Boolean)
                    .map(value =>
                        String(value)
                    );

                for (
                    const possibleId
                    of possibleUserIds
                ) {

                    if (
                        usersById[
                            possibleId
                        ]
                    ) {

                        userProfile =
                            usersById[
                                possibleId
                            ];

                        break;
                    }
                }

                if (!userProfile) {

                    const possibleEmails = [
                        application.email,
                        application.studentEmail,
                        profile?.email,
                        profile?.studentEmail
                    ]
                        .filter(Boolean)
                        .map(value =>
                            String(value)
                                .trim()
                                .toLowerCase()
                        );

                    for (
                        const email
                        of possibleEmails
                    ) {

                        if (
                            usersByEmail[
                                email
                            ]
                        ) {

                            userProfile =
                                usersByEmail[
                                    email
                                ];

                            break;
                        }
                    }
                }

                /* =================================================
                   PROFILE DATA
                ================================================= */

                if (profile) {

                    application.phone =
                        getFirstValue(
                            profile,
                            [
                                "phone",
                                "mobile",
                                "mobileNumber",
                                "phoneNumber",
                                "contactNumber"
                            ],
                            application.phone
                        );

                    application.department =
                        getFirstValue(
                            profile,
                            [
                                "department",
                                "branch",
                                "stream",
                                "specialization"
                            ],
                            application.department
                        );

                    application.degree =
                        getFirstValue(
                            profile,
                            [
                                "degree",
                                "course",
                                "program",
                                "qualification",
                                "education",
                                "highestQualification",
                                "degreeName",
                                "courseName",
                                "programName"
                            ],
                            application.degree
                        );

                    application.email =
                        getFirstValue(
                            profile,
                            [
                                "email",
                                "studentEmail",
                                "emailAddress"
                            ],
                            application.email
                        );

                    application.studentEmail =
                        application.email;

                    application.skills =
                        getFirstValue(
                            profile,
                            [
                                "skills",
                                "skill",
                                "technicalSkills"
                            ],
                            application.skills
                        );

                    application.cgpa =
                        getFirstValue(
                            profile,
                            [
                                "cgpa",
                                "CGPA",
                                "cGPA",
                                "currentCGPA"
                            ],
                            application.cgpa
                        );

                    application.tenthPercentage =
                        getFirstValue(
                            profile,
                            [
                                "tenthPercentage",
                                "percentage10th",
                                "tenThPercentage",
                                "tenthPercent",
                                "minimum10th",
                                "10thPercentage",
                                "10th",
                                "tenth",
                                "sscPercentage",
                                "ssc"
                            ],
                            application.tenthPercentage
                        );

                    application.twelfthPercentage =
                        getFirstValue(
                            profile,
                            [
                                "twelfthPercentage",
                                "percentage12th",
                                "twelveThPercentage",
                                "twelfthPercent",
                                "minimum12th",
                                "12thPercentage",
                                "12th",
                                "twelfth",
                                "hscPercentage",
                                "hsc"
                            ],
                            application.twelfthPercentage
                        );

                    application.resumeURL =
                        getFirstValue(
                            profile,
                            [
                                "resumeURL",
                                "resumeUrl",
                                "resume",
                                "resumeLink"
                            ],
                            application.resumeURL
                        );

                    application.college =
                        getFirstValue(
                            profile,
                            [
                                "college",
                                "collegeName",
                                "college_name",
                                "institute",
                                "instituteName",
                                "university",
                                "universityName",
                                "institution",
                                "institutionName"
                            ],
                            application.college
                        );

                    application.studentName =
                        getFirstValue(
                            profile,
                            [
                                "studentName",
                                "name",
                                "fullName",
                                "displayName"
                            ],
                            application.studentName ||
                            application.name ||
                            "Student"
                        );
                }

                /* =================================================
                   USER PROFILE FALLBACK
                ================================================= */

                if (userProfile) {

                    application.studentName =
                        application.studentName &&
                        application.studentName !==
                            "Student"
                            ? application.studentName
                            : getFirstValue(
                                userProfile,
                                [
                                    "studentName",
                                    "name",
                                    "fullName",
                                    "displayName"
                                ],
                                application.studentName ||
                                "Student"
                            );

                    application.email =
                        application.email ||
                        getFirstValue(
                            userProfile,
                            [
                                "email",
                                "studentEmail",
                                "emailAddress"
                            ],
                            ""
                        );

                    application.studentEmail =
                        application.studentEmail ||
                        application.email;

                    application.phone =
                        application.phone !==
                            "Not Available"
                            ? application.phone
                            : getFirstValue(
                                userProfile,
                                [
                                    "phone",
                                    "mobile",
                                    "mobileNumber",
                                    "phoneNumber",
                                    "contactNumber"
                                ],
                                application.phone
                            );
                }

                /* =================================================
                   PROFILE PHOTO
                ================================================= */

                const rawPhoto =
                    getProfilePhotoValue(
                        profile,
                        application,
                        userProfile
                    );

                application.profilePhoto =
                    await resolveProfilePhoto(
                        rawPhoto
                    );

                /* =================================================
                   SAVE REFERENCES
                ================================================= */

                application.studentProfile =
                    profile || null;

                application.userProfile =
                    userProfile || null;

                application.studentProfileId =
                    profile?.id || null;

                /* =================================================
                   FALLBACKS
                ================================================= */

                application.studentName =
                    application.studentName ||
                    application.name ||
                    "Student";

                application.studentEmail =
                    application.studentEmail ||
                    application.email ||
                    "";

                application.college =
                    application.college ||
                    "Not Available";

                application.degree =
                    application.degree ||
                    "Not Available";

                application.department =
                    application.department ||
                    application.branch ||
                    "Not Available";

                application.phone =
                    application.phone ||
                    "Not Available";

                application.skills =
                    application.skills ||
                    "Not Available";

                data.push(application);
            }

            /* =================================================
               NEWEST FIRST
            ================================================= */

            data.sort((a, b) => {

                const getTime = (value) => {

                    if (
                        value &&
                        typeof value.toDate ===
                            "function"
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

                const dateA =
                    getTime(
                        a.appliedAt ||
                        a.createdAt
                    );

                const dateB =
                    getTime(
                        b.appliedAt ||
                        b.createdAt
                    );

                return dateB - dateA;
            });

            setApplications(data);

        } catch (error) {

            console.error(
                "Applicants Error:",
                error
            );

            setApplications([]);

        } finally {

            setLoading(false);
        }
    };

    /* =========================================================
       EMAIL HELPER
    ========================================================= */

    const getStudentEmail = (application) => {

        return String(
            application?.studentEmail ||
            application?.email ||
            ""
        )
            .trim()
            .toLowerCase();
    };

    /* =========================================================
       ESCAPE HTML
       
       Prevent student/company/job names from injecting HTML
       into the email body.
    ========================================================= */

    const escapeHtml = (value) => {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    /* =========================================================
       SEND SELECTED EMAIL
    ========================================================= */

    const sendSelectedEmail = async (
        application
    ) => {

        const studentEmail =
            getStudentEmail(application);

        if (!studentEmail) {

            console.warn(
                "Selection email not sent because student email is missing."
            );

            return {
                success: false,
                reason: "missing-email"
            };
        }

        const studentName =
            escapeHtml(
                application?.studentName ||
                "Student"
            );

        const jobTitle =
            escapeHtml(
                application?.jobTitle ||
                "the position"
            );

        const companyName =
            escapeHtml(
                application?.companyName ||
                application?.company ||
                "the company"
            );

        const subject =
            "Application Update - Selected for Placement Activity";

        const htmlMessage = `
            <div style="
                font-family:Arial,Helvetica,sans-serif;
                background:#f4f7fb;
                padding:35px 15px;
                color:#1f2937;
            ">

                <div style="
                    max-width:650px;
                    margin:0 auto;
                    background:#ffffff;
                    border-radius:16px;
                    overflow:hidden;
                    box-shadow:0 8px 30px rgba(0,0,0,0.08);
                ">

                    <div style="
                        background:#667eea;
                        padding:30px;
                        color:#ffffff;
                    ">

                        <h1 style="
                            margin:0;
                            font-size:26px;
                        ">
                            Application Update
                        </h1>

                        <p style="
                            margin:8px 0 0;
                            font-size:14px;
                        ">
                            Placement Management System
                        </p>

                    </div>

                    <div style="padding:30px;">

                        <h2 style="
                            margin-top:0;
                            color:#111827;
                        ">
                            Congratulations, ${studentName}!
                        </h2>

                        <p style="
                            font-size:16px;
                            line-height:1.7;
                        ">
                            We are pleased to inform you that your
                            application for
                            <strong>${jobTitle}</strong>
                            at
                            <strong>${companyName}</strong>
                            has been selected for the next
                            placement activity.
                        </p>

                        <div style="
                            margin:25px 0;
                            padding:20px;
                            background:#f0fdf4;
                            border:1px solid #bbf7d0;
                            border-radius:12px;
                        ">

                            <p style="
                                margin:0;
                                color:#166534;
                                font-size:15px;
                                line-height:1.6;
                            ">
                                <strong>Status:</strong>
                                Selected for Placement Activity
                            </p>

                        </div>

                        <p style="
                            font-size:15px;
                            line-height:1.7;
                        ">
                            Please log in to the Placement Management
                            System regularly for further updates,
                            instructions and placement-related
                            activities.
                        </p>

                        <p style="
                            margin-top:28px;
                            color:#6b7280;
                            font-size:13px;
                            line-height:1.6;
                        ">
                            This is an automated email from the
                            Placement Management System.
                        </p>

                    </div>

                </div>

            </div>
        `;

        try {

            await sendEmail({
                to: studentEmail,
                subject,
                message: htmlMessage
            });

            console.log(
                "Selected email sent:",
                studentEmail
            );

            return {
                success: true,
                email: studentEmail
            };

        } catch (error) {

            console.error(
                "Selected email failed:",
                error
            );

            return {
                success: false,
                email: studentEmail,
                error
            };
        }
    };

    /* =========================================================
       SEND REJECTED EMAIL
    ========================================================= */

    const sendRejectedEmail = async (
        application
    ) => {

        const studentEmail =
            getStudentEmail(application);

        if (!studentEmail) {

            console.warn(
                "Rejected email not sent because student email is missing."
            );

            return {
                success: false,
                reason: "missing-email"
            };
        }

        const studentName =
            escapeHtml(
                application?.studentName ||
                "Student"
            );

        const jobTitle =
            escapeHtml(
                application?.jobTitle ||
                "the position"
            );

        const companyName =
            escapeHtml(
                application?.companyName ||
                application?.company ||
                "the company"
            );

        const subject =
            "Application Update - Application Status";

        const htmlMessage = `
            <div style="
                font-family:Arial,Helvetica,sans-serif;
                background:#f4f7fb;
                padding:35px 15px;
                color:#1f2937;
            ">

                <div style="
                    max-width:650px;
                    margin:0 auto;
                    background:#ffffff;
                    border-radius:16px;
                    overflow:hidden;
                    box-shadow:0 8px 30px rgba(0,0,0,0.08);
                ">

                    <div style="
                        background:#dc2626;
                        padding:30px;
                        color:#ffffff;
                    ">

                        <h1 style="
                            margin:0;
                            font-size:26px;
                        ">
                            Application Update
                        </h1>

                        <p style="
                            margin:8px 0 0;
                            font-size:14px;
                        ">
                            Placement Management System
                        </p>

                    </div>

                    <div style="padding:30px;">

                        <h2 style="
                            margin-top:0;
                            color:#111827;
                        ">
                            Dear ${studentName},
                        </h2>

                        <p style="
                            font-size:16px;
                            line-height:1.7;
                        ">
                            Thank you for your interest in the
                            <strong>${jobTitle}</strong> position at
                            <strong>${companyName}</strong>.
                        </p>

                        <p style="
                            font-size:16px;
                            line-height:1.7;
                        ">
                            After careful consideration, we regret
                            to inform you that your application has
                            not been selected for this opportunity.
                        </p>

                        <div style="
                            margin:25px 0;
                            padding:20px;
                            background:#fef2f2;
                            border:1px solid #fecaca;
                            border-radius:12px;
                        ">

                            <p style="
                                margin:0;
                                color:#991b1b;
                                font-size:15px;
                                line-height:1.6;
                            ">
                                <strong>Application Status:</strong>
                                Not Selected
                            </p>

                        </div>

                        <p style="
                            font-size:15px;
                            line-height:1.7;
                        ">
                            Please do not be discouraged. We encourage
                            you to continue exploring other placement
                            opportunities available through the
                            Placement Management System.
                        </p>

                        <p style="
                            font-size:15px;
                            line-height:1.7;
                        ">
                            We wish you all the best in your future
                            career opportunities.
                        </p>

                        <div style="
                            margin-top:30px;
                            padding-top:20px;
                            border-top:1px solid #e5e7eb;
                        ">

                            <p style="
                                margin:0;
                                color:#6b7280;
                                font-size:13px;
                                line-height:1.6;
                            ">
                                This is an automated email from the
                                Placement Management System.
                            </p>

                        </div>

                    </div>

                </div>

            </div>
        `;

        try {

            await sendEmail({
                to: studentEmail,
                subject,
                message: htmlMessage
            });

            console.log(
                "Rejected email sent:",
                studentEmail
            );

            return {
                success: true,
                email: studentEmail
            };

        } catch (error) {

            console.error(
                "Rejected email failed:",
                error
            );

            return {
                success: false,
                email: studentEmail,
                error
            };
        }
    };

    /* =========================================================
       SEND PLACED EMAIL
    ========================================================= */

    const sendPlacedEmail = async (
        application
    ) => {

        const studentEmail =
            getStudentEmail(application);

        if (!studentEmail) {

            console.warn(
                "Placed email not sent because student email is missing."
            );

            return {
                success: false,
                reason: "missing-email"
            };
        }

        const studentName =
            escapeHtml(
                application?.studentName ||
                "Student"
            );

        const jobTitle =
            escapeHtml(
                application?.jobTitle ||
                "the position"
            );

        const companyName =
            escapeHtml(
                application?.companyName ||
                application?.company ||
                "the company"
            );

        const subject =
            "Congratulations! You Have Been Placed";

        const htmlMessage = `
            <div style="
                font-family:Arial,Helvetica,sans-serif;
                background:#f4f7fb;
                padding:35px 15px;
                color:#1f2937;
            ">

                <div style="
                    max-width:650px;
                    margin:0 auto;
                    background:#ffffff;
                    border-radius:16px;
                    overflow:hidden;
                    box-shadow:0 8px 30px rgba(0,0,0,0.08);
                ">

                    <div style="
                        background:#16a34a;
                        padding:32px;
                        color:#ffffff;
                        text-align:center;
                    ">

                        <div style="
                            font-size:42px;
                            margin-bottom:10px;
                        ">
                            🎉
                        </div>

                        <h1 style="
                            margin:0;
                            font-size:28px;
                        ">
                            Congratulations!
                        </h1>

                        <p style="
                            margin:8px 0 0;
                            font-size:15px;
                        ">
                            Placement Confirmation
                        </p>

                    </div>

                    <div style="padding:32px;">

                        <h2 style="
                            margin-top:0;
                            color:#111827;
                        ">
                            Dear ${studentName},
                        </h2>

                        <p style="
                            font-size:16px;
                            line-height:1.7;
                        ">
                            We are delighted to inform you that
                            you have been
                            <strong>officially placed</strong>
                            for
                            <strong>${jobTitle}</strong>
                            at
                            <strong>${companyName}</strong>.
                        </p>

                        <div style="
                            margin:28px 0;
                            padding:22px;
                            background:#f0fdf4;
                            border:1px solid #86efac;
                            border-radius:12px;
                            text-align:center;
                        ">

                            <div style="
                                color:#15803d;
                                font-size:14px;
                                margin-bottom:8px;
                            ">
                                PLACEMENT STATUS
                            </div>

                            <div style="
                                color:#166534;
                                font-size:24px;
                                font-weight:700;
                            ">
                                ✓ PLACED
                            </div>

                        </div>

                        <p style="
                            font-size:15px;
                            line-height:1.7;
                        ">
                            Please keep checking the Placement
                            Management System for further
                            instructions and important information
                            regarding your placement.
                        </p>

                        <p style="
                            font-size:15px;
                            line-height:1.7;
                        ">
                            We wish you great success in your
                            professional journey!
                        </p>

                        <div style="
                            margin-top:30px;
                            padding-top:20px;
                            border-top:1px solid #e5e7eb;
                        ">

                            <p style="
                                margin:0;
                                color:#6b7280;
                                font-size:13px;
                                line-height:1.6;
                            ">
                                This is an automated email from the
                                Placement Management System.
                            </p>

                        </div>

                    </div>

                </div>

            </div>
        `;

        try {

            await sendEmail({
                to: studentEmail,
                subject,
                message: htmlMessage
            });

            console.log(
                "Placed email sent:",
                studentEmail
            );

            return {
                success: true,
                email: studentEmail
            };

        } catch (error) {

            console.error(
                "Placed email failed:",
                error
            );

            return {
                success: false,
                email: studentEmail,
                error
            };
        }
    };

    /* =========================================================
       VERIFY COMPANY OWNERSHIP
       
       This is an additional client-side protection.
       Firestore rules are still required for real security.
    ========================================================= */

    const verifyApplicationOwnership = (
        application
    ) => {

        if (!user?.uid) {
            return false;
        }

        if (!application) {
            return false;
        }

        return (
            application.companyId ===
            user.uid
        );
    };

    /* =========================================================
       UPDATE APPLICATION STATUS
       
       ACCEPT:
       1. Verify ownership
       2. Update Firestore
       3. Send selection email
       4. Email failure does NOT rollback

       REJECT:
       1. Verify ownership
       2. Update Firestore
       3. Send rejection email
       4. Email failure does NOT rollback
    ========================================================= */

    const updateStatus = async (
        id,
        status
    ) => {

        if (!user?.uid) {

            alert(
                "You must be logged in."
            );

            return;
        }

        const currentApplication =
            applications.find(
                item =>
                    item.id === id
            );

        if (!currentApplication) {

            alert(
                "Application could not be found."
            );

            return;
        }

        /* =====================================================
           OWNERSHIP CHECK
        ===================================================== */

        if (
            !verifyApplicationOwnership(
                currentApplication
            )
        ) {

            alert(
                "You cannot manage an application belonging to another company."
            );

            return;
        }

        if (
            status !== "Accepted" &&
            status !== "Rejected"
        ) {

            alert(
                "Invalid application status."
            );

            return;
        }

        try {

            setUpdatingId(id);

            const applicationReference =
                doc(
                    db,
                    "applications",
                    id
                );

            /* =================================================
               ACCEPT
            ================================================= */

            if (
                status === "Accepted"
            ) {

                /*
                 * IMPORTANT:
                 * Firestore is updated BEFORE sending email.
                 */

                await updateDoc(
                    applicationReference,
                    {
                        status: "Accepted",
                        placedStudent: false,
                        placementActivity:
                            "Shortlisted"
                    }
                );

                /*
                 * Email is deliberately isolated.
                 *
                 * If email fails, the Firestore status remains
                 * Accepted.
                 */

                try {

                    const emailResult =
                        await sendSelectedEmail(
                            currentApplication
                        );

                    if (
                        !emailResult.success
                    ) {

                        console.warn(
                            "Application accepted, but selection email could not be sent.",
                            emailResult
                        );
                    }

                } catch (emailError) {

                    console.error(
                        "Selection email error after successful Firestore update:",
                        emailError
                    );
                }
            }

            /* =================================================
               REJECT
            ================================================= */

            if (
                status === "Rejected"
            ) {

                /*
                 * IMPORTANT:
                 * Firestore rejection happens FIRST.
                 */

                await updateDoc(
                    applicationReference,
                    {
                        status: "Rejected",
                        placedStudent: false,
                        placementActivity: ""
                    }
                );

                /*
                 * Rejection email cannot undo the Firestore
                 * rejection if sending fails.
                 */

                try {

                    const emailResult =
                        await sendRejectedEmail(
                            currentApplication
                        );

                    if (
                        !emailResult.success
                    ) {

                        console.warn(
                            "Application rejected, but rejection email could not be sent.",
                            emailResult
                        );
                    }

                } catch (emailError) {

                    console.error(
                        "Rejection email error after successful Firestore update:",
                        emailError
                    );
                }
            }

            /* =================================================
               UPDATE LOCAL STATE
            ================================================= */

            const updatedApplication = {
                ...currentApplication,
                status,
                placedStudent: false,
                placementActivity:
                    status === "Accepted"
                        ? "Shortlisted"
                        : ""
            };

            setApplications(
                previous =>
                    previous.map(
                        item =>
                            item.id === id
                                ? updatedApplication
                                : item
                    )
            );

            setSelectedApplicant(
                previous =>
                    previous &&
                    previous.id === id
                        ? updatedApplication
                        : previous
            );

        } catch (error) {

            console.error(
                "Status Update Error:",
                error
            );

            if (
                error?.code ===
                "permission-denied"
            ) {

                alert(
                    "You do not have permission to update this application."
                );

            } else {

                alert(
                    "Unable to update application status. Please try again."
                );
            }

        } finally {

            setUpdatingId(null);
        }
    };

    /* =========================================================
       DELETE APPLICATION
       
       REQUIREMENT:
       Delete still works AND sends rejection email.

       IMPORTANT:
       1. Verify company ownership
       2. Delete Firestore document
       3. Send rejection email
       
       Email failure does NOT restore the deleted document.
    ========================================================= */

    const deleteApplication = async (
        application
    ) => {

        if (!user?.uid) {

            alert(
                "You must be logged in."
            );

            return;
        }

        /* =====================================================
           OWNERSHIP CHECK
        ===================================================== */

        if (
            !verifyApplicationOwnership(
                application
            )
        ) {

            alert(
                "You cannot delete an application belonging to another company."
            );

            return;
        }

        const studentName =
            application.studentName ||
            "this student";

        const confirmed =
            window.confirm(
                `Delete the application from ${studentName}?\n\nThe student will receive a rejection email.\n\nThis action cannot be undone.`
            );

        if (!confirmed) {
            return;
        }

        try {

            setDeletingId(
                application.id
            );

            /* =================================================
               DELETE FIRST
            ================================================= */

            await deleteDoc(
                doc(
                    db,
                    "applications",
                    application.id
                )
            );

            /* =================================================
               UPDATE LOCAL STATE IMMEDIATELY
            ================================================= */

            setApplications(
                previous =>
                    previous.filter(
                        item =>
                            item.id !==
                            application.id
                    )
            );

            if (
                selectedApplicant?.id ===
                application.id
            ) {

                setSelectedApplicant(null);
            }

            /* =================================================
               SEND REJECTION EMAIL AFTER DELETE
               
               The deleted application object is still available
               in memory, so its email/name/job information can
               be used.
            ================================================= */

            try {

                const emailResult =
                    await sendRejectedEmail(
                        application
                    );

                if (
                    !emailResult.success
                ) {

                    console.warn(
                        "Application deleted, but rejection email could not be sent.",
                        emailResult
                    );
                }

            } catch (emailError) {

                console.error(
                    "Rejection email failed after application deletion:",
                    emailError
                );
            }

        } catch (error) {

            console.error(
                "Delete Application Error:",
                error
            );

            if (
                error?.code ===
                "permission-denied"
            ) {

                alert(
                    "Unable to delete this application because Firestore permissions are blocking the operation."
                );

            } else {

                alert(
                    "Unable to delete this application. Please try again."
                );
            }

        } finally {

            setDeletingId(null);
        }
    };

    /* =========================================================
       UPDATE PLACED STUDENT
       
       REQUIREMENT:
       Mark as Placed
       → Firestore first
       → placement email
       → email failure does NOT rollback
    ========================================================= */

    const updatePlacedStudent = async (
        application,
        placed
    ) => {

        if (!user?.uid) {

            alert(
                "You must be logged in."
            );

            return;
        }

        /* =====================================================
           OWNERSHIP CHECK
        ===================================================== */

        if (
            !verifyApplicationOwnership(
                application
            )
        ) {

            alert(
                "You cannot manage an application belonging to another company."
            );

            return;
        }

        try {

            setUpdatingId(
                application.id
            );

            const currentStatus =
                String(
                    application.status || ""
                )
                    .trim()
                    .toLowerCase();

            if (
                currentStatus !== "accepted" &&
                currentStatus !== "selected"
            ) {

                alert(
                    "Student must be accepted before placement."
                );

                return;
            }

            /* =================================================
               FIRESTORE UPDATE FIRST
            ================================================= */

            await updateDoc(
                doc(
                    db,
                    "applications",
                    application.id
                ),
                {
                    status: "Accepted",

                    placedStudent:
                        placed,

                    placementActivity:
                        placed
                            ? "Placed"
                            : "Shortlisted"
                }
            );

            /* =================================================
               SEND PLACEMENT EMAIL ONLY WHEN PLACED
               
               Firestore update has already succeeded.
            ================================================= */

            if (placed) {

                try {

                    const emailResult =
                        await sendPlacedEmail(
                            application
                        );

                    if (
                        !emailResult.success
                    ) {

                        console.warn(
                            "Student was marked placed but placement email could not be sent.",
                            emailResult
                        );
                    }

                } catch (emailError) {

                    console.error(
                        "Placement email failed after successful Firestore update:",
                        emailError
                    );
                }
            }

            /* =================================================
               UPDATE LOCAL STATE
            ================================================= */

            const updatedApplication = {
                ...application,
                status: "Accepted",
                placedStudent: placed,
                placementActivity:
                    placed
                        ? "Placed"
                        : "Shortlisted"
            };

            setApplications(
                previous =>
                    previous.map(
                        item =>
                            item.id ===
                            application.id
                                ? updatedApplication
                                : item
                    )
            );

            setSelectedApplicant(
                previous =>
                    previous &&
                    previous.id ===
                        application.id
                        ? updatedApplication
                        : previous
            );

        } catch (error) {

            console.error(
                "Placed Student Error:",
                error
            );

            if (
                error?.code ===
                "permission-denied"
            ) {

                alert(
                    "You do not have permission to update this application."
                );

            } else {

                alert(
                    "Unable to update placement status. Please try again."
                );
            }

        } finally {

            setUpdatingId(null);
        }
    };

    /* =========================================================
       FORMAT ACADEMIC VALUE
    ========================================================= */

    const formatAcademicValue = (
        value,
        suffix = ""
    ) => {

        if (
            value === undefined ||
            value === null ||
            String(value).trim() === "" ||
            String(value).trim() ===
                "Not Available"
        ) {

            return "Not Available";
        }

        return `${value}${suffix}`;
    };

    /* =========================================================
       OPEN PROFILE OVERLAY
    ========================================================= */

    const openApplicantProfile = (
        application
    ) => {

        setSelectedApplicant(
            application
        );
    };

    /* =========================================================
       STUDENT AVATAR
    ========================================================= */

    const StudentAvatar = ({
        application,
        large = false
    }) => {

        const photo =
            application?.profilePhoto
                ? String(
                    application.profilePhoto
                ).trim()
                : "";

        const name =
            application?.studentName ||
            "Student";

        const firstLetter =
            String(name)
                .charAt(0)
                .toUpperCase();

        return (
            <div
                className={`applicant-avatar ${
                    large
                        ? "applicant-avatar-large"
                        : ""
                } ${
                    photo
                        ? "has-profile-photo"
                        : "applicant-avatar-fallback"
                }`}
                title={name}
                aria-label={`${name} profile`}
            >

                {photo ? (

                    <img
                        src={photo}
                        alt={`${name} profile`}
                        className="applicant-profile-photo"
                        loading="lazy"
                        onError={(event) => {

                            console.error(
                                "Applicant image failed:",
                                photo
                            );

                            event.currentTarget.style.display =
                                "none";

                            const parent =
                                event.currentTarget
                                    .parentElement;

                            if (parent) {

                                parent.classList.remove(
                                    "has-profile-photo"
                                );

                                parent.classList.add(
                                    "applicant-avatar-fallback"
                                );
                            }
                        }}
                    />

                ) : (

                    firstLetter

                )}

            </div>
        );
    };

    /* =========================================================
       PROFILE PHOTO FOR OVERLAY
    ========================================================= */

    const OverlayProfilePhoto = ({
        application
    }) => {

        const [imageFailed, setImageFailed] =
            useState(false);

        const photo =
            application?.profilePhoto;

        const name =
            application?.studentName ||
            "Student";

        const firstLetter =
            String(name)
                .charAt(0)
                .toUpperCase();

        if (!photo || imageFailed) {

            return (
                <div className="overlay-profile-fallback">
                    {firstLetter}
                </div>
            );
        }

        return (
            <img
                src={photo}
                alt={`${name} profile`}
                className="overlay-profile-image"
                onError={() =>
                    setImageFailed(true)
                }
            />
        );
    };

    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {

        return (
            <div className="applicants-loading">

                <div className="loading-spinner"></div>

                <span>
                    Loading applicants...
                </span>

            </div>
        );
    }

    /* =========================================================
       RENDER
    ========================================================= */

    return (

        <div className="applicants-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="applicants-header">

                <div className="applicants-header-content">

                    <span className="applicants-label">
                        APPLICATION MANAGEMENT
                    </span>

                    <h1>
                        Applicants
                    </h1>

                    <p>
                        Review student applications,
                        manage applicant status and
                        placement information.
                    </p>

                </div>

                <div className="applicants-header-summary">

                    <div className="summary-number">
                        {applications.length}
                    </div>

                    <div className="summary-label">
                        Total Applicants
                    </div>

                </div>

            </div>

            {/* =================================================
                GRID
            ================================================= */}

            <div className="applicants-grid">

                {applications.length === 0 ? (

                    <div className="empty-applicants">

                        <div className="empty-icon">
                            👨‍🎓
                        </div>

                        <h3>
                            No Applications Found
                        </h3>

                        <p>
                            Students who apply for your
                            jobs will appear here.
                        </p>

                    </div>

                ) : (

                    applications.map(
                        (app) => {

                            const status =
                                String(
                                    app.status ||
                                    "Applied"
                                );

                            const normalizedStatus =
                                status
                                    .trim()
                                    .toLowerCase();

                            const statusClass =
                                normalizedStatus ===
                                "accepted"
                                    ? "status-accepted"
                                    : normalizedStatus ===
                                      "rejected"
                                        ? "status-rejected"
                                        : "status-pending";

                            const skillsText =
                                Array.isArray(
                                    app.skills
                                )
                                    ? app.skills.join(
                                        ", "
                                    )
                                    : app.skills;

                            const isAccepted =
                                normalizedStatus ===
                                "accepted";

                            const isRejected =
                                normalizedStatus ===
                                "rejected";

                            const isPlaced =
                                app.placedStudent ===
                                true;

                            const isUpdating =
                                updatingId ===
                                app.id;

                            const isDeleting =
                                deletingId ===
                                app.id;

                            return (

                                <div
                                    className="applicant-card"
                                    key={app.id}
                                    onClick={() =>
                                        openApplicantProfile(
                                            app
                                        )
                                    }
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(event) => {

                                        if (
                                            event.key ===
                                                "Enter" ||
                                            event.key ===
                                                " "
                                        ) {

                                            event.preventDefault();

                                            openApplicantProfile(
                                                app
                                            );
                                        }
                                    }}
                                >

                                    {/* TOP */}

                                    <div className="applicant-top">

                                        <div className="applicant-identity">

                                            <StudentAvatar
                                                application={
                                                    app
                                                }
                                            />

                                            <div className="applicant-name">

                                                <h2>
                                                    {
                                                        app.studentName ||
                                                        "Student"
                                                    }
                                                </h2>

                                                <span>
                                                    {
                                                        app.studentEmail ||
                                                        app.email ||
                                                        "Email not available"
                                                    }
                                                </span>

                                            </div>

                                        </div>

                                        <span
                                            className={`status-badge ${statusClass}`}
                                        >

                                            <span className="status-dot"></span>

                                            {status}

                                        </span>

                                    </div>

                                    {/* JOB */}

                                    <div className="applicant-job">

                                        <div className="applicant-job-icon">
                                            💼
                                        </div>

                                        <div className="applicant-job-text">

                                            <span className="applicant-job-label">
                                                Applied For
                                            </span>

                                            <span className="applicant-job-title">
                                                {
                                                    app.jobTitle ||
                                                    "Job Not Available"
                                                }
                                            </span>

                                        </div>

                                    </div>

                                    {/* INFORMATION */}

                                    <div className="applicant-info">

                                        <div className="info-item">

                                            <span className="info-label">
                                                Phone
                                            </span>

                                            <span className="info-value">
                                                {
                                                    app.phone ||
                                                    "Not Available"
                                                }
                                            </span>

                                        </div>

                                        <div className="info-item academic-info">

                                            <span className="info-label">
                                                Degree
                                            </span>

                                            <span className="info-value academic-value">
                                                {
                                                    app.degree ||
                                                    "Not Available"
                                                }
                                            </span>

                                        </div>

                                        <div className="info-item">

                                            <span className="info-label">
                                                Department / Branch
                                            </span>

                                            <span className="info-value">
                                                {
                                                    app.department ||
                                                    "Not Available"
                                                }
                                            </span>

                                        </div>

                                        <div className="info-item academic-info">

                                            <span className="info-label">
                                                10th Percentage
                                            </span>

                                            <span className="info-value academic-value">
                                                {
                                                    formatAcademicValue(
                                                        app.tenthPercentage,
                                                        "%"
                                                    )
                                                }
                                            </span>

                                        </div>

                                        <div className="info-item academic-info">

                                            <span className="info-label">
                                                12th Percentage
                                            </span>

                                            <span className="info-value academic-value">
                                                {
                                                    formatAcademicValue(
                                                        app.twelfthPercentage,
                                                        "%"
                                                    )
                                                }
                                            </span>

                                        </div>

                                        <div className="info-item academic-info">

                                            <span className="info-label">
                                                CGPA
                                            </span>

                                            <span className="info-value academic-value">
                                                {
                                                    app.cgpa ||
                                                    "Not Available"
                                                }
                                            </span>

                                        </div>

                                        <div className="info-item college-info">

                                            <span className="info-label">
                                                College / Institute
                                            </span>

                                            <span className="info-value college-value">
                                                {
                                                    app.college ||
                                                    "Not Available"
                                                }
                                            </span>

                                        </div>

                                    </div>

                                    {/* SKILLS */}

                                    <div className="applicant-skills">

                                        <div className="applicant-skills-title">
                                            Skills
                                        </div>

                                        <div className="skills-text">
                                            {
                                                skillsText ||
                                                "Not Available"
                                            }
                                        </div>

                                    </div>

                                    {/* EMAIL */}

                                    <div className="applicant-skills">

                                        <div className="applicant-skills-title">
                                            Email
                                        </div>

                                        <div className="skills-text email-text">
                                            {
                                                app.studentEmail ||
                                                app.email ||
                                                "Not Available"
                                            }
                                        </div>

                                    </div>

                                    {/* RESUME */}

                                    {app.resumeURL && (

                                        <a
                                            href={
                                                app.resumeURL
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="resume-btn"
                                            onClick={(event) =>
                                                event.stopPropagation()
                                            }
                                        >

                                            <span>
                                                📄
                                            </span>

                                            View Resume

                                        </a>

                                    )}

                                    {/* PLACEMENT */}

                                    {isAccepted && (

                                        <div
                                            className="placement-section"
                                            onClick={(event) =>
                                                event.stopPropagation()
                                            }
                                        >

                                            <div className="placement-section-header">

                                                <div className="placement-icon">
                                                    🎯
                                                </div>

                                                <div>

                                                    <h3>
                                                        Placement
                                                    </h3>

                                                    <p>
                                                        Manage the student's
                                                        placement status.
                                                    </p>

                                                </div>

                                            </div>

                                            <div className="placement-status-card">

                                                <div className="placement-status-left">

                                                    <span className="placement-status-label">
                                                        Current Status
                                                    </span>

                                                    <div className="placement-status-value">

                                                        <span
                                                            className={`placement-status-dot ${
                                                                isPlaced
                                                                    ? "is-placed"
                                                                    : ""
                                                            }`}
                                                        ></span>

                                                        {
                                                            isPlaced
                                                                ? "Placed"
                                                                : "Shortlisted"
                                                        }

                                                    </div>

                                                </div>

                                                <div className="placement-status-badge">

                                                    {
                                                        isPlaced
                                                            ? "Completed"
                                                            : "In Progress"
                                                    }

                                                </div>

                                            </div>

                                            <div className="placed-student-field">

                                                <div className="placed-student-text">

                                                    <span className="placed-student-title">
                                                        Mark as Placed
                                                    </span>

                                                    <span className="placed-student-description">
                                                        Confirm when this student
                                                        has officially been placed.
                                                    </span>

                                                </div>

                                                <label
                                                    className={`placement-switch ${
                                                        isUpdating
                                                            ? "switch-disabled"
                                                            : ""
                                                    }`}
                                                >

                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            isPlaced
                                                        }
                                                        disabled={
                                                            isUpdating
                                                        }
                                                        onChange={
                                                            event =>
                                                                updatePlacedStudent(
                                                                    app,
                                                                    event
                                                                        .target
                                                                        .checked
                                                                )
                                                        }
                                                    />

                                                    <span className="placement-slider"></span>

                                                </label>

                                            </div>

                                            {isPlaced && (

                                                <div className="placed-success">

                                                    <span className="success-check">
                                                        ✓
                                                    </span>

                                                    Student is officially placed

                                                </div>

                                            )}

                                        </div>
                                    )}

                                    {/* ACTION BUTTONS */}

                                    <div
                                        className="action-buttons"
                                        onClick={(event) =>
                                            event.stopPropagation()
                                        }
                                    >

                                        <button
                                            className="accept"
                                            type="button"
                                            disabled={
                                                isUpdating ||
                                                isDeleting ||
                                                isAccepted ||
                                                isPlaced
                                            }
                                            onClick={() =>
                                                updateStatus(
                                                    app.id,
                                                    "Accepted"
                                                )
                                            }
                                        >

                                            {
                                                isUpdating
                                                    ? "Updating..."
                                                    : isAccepted
                                                        ? "✓ Accepted"
                                                        : "✓ Accept"
                                            }

                                        </button>

                                        <button
                                            className="reject"
                                            type="button"
                                            disabled={
                                                isUpdating ||
                                                isDeleting ||
                                                isPlaced ||
                                                isRejected
                                            }
                                            onClick={() =>
                                                updateStatus(
                                                    app.id,
                                                    "Rejected"
                                                )
                                            }
                                        >

                                            {
                                                isRejected
                                                    ? "✕ Rejected"
                                                    : "✕ Reject"
                                            }

                                        </button>

                                        <button
                                            className="delete-application"
                                            type="button"
                                            disabled={
                                                isUpdating ||
                                                isDeleting ||
                                                isPlaced
                                            }
                                            onClick={() =>
                                                deleteApplication(
                                                    app
                                                )
                                            }
                                        >

                                            {isDeleting ? (

                                                <>
                                                    <span className="delete-spinner"></span>
                                                    Deleting...
                                                </>

                                            ) : (

                                                <>
                                                    🗑 Delete
                                                </>

                                            )}

                                        </button>

                                    </div>

                                </div>
                            );
                        }
                    )
                )}

            </div>

            {/* =========================================================
                APPLICANT PROFILE OVERLAY
            ========================================================= */}

            {selectedApplicant && (

                <div
                    className="applicant-overlay"
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {

                            setSelectedApplicant(
                                null
                            );
                        }
                    }}
                >

                    <div
                        className="applicant-modal"
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >

                        {/* MODAL HEADER */}

                        <div className="applicant-modal-header">

                            <div>

                                <span className="modal-eyebrow">
                                    APPLICANT PROFILE
                                </span>

                                <h2>
                                    Student Details
                                </h2>

                            </div>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={() =>
                                    setSelectedApplicant(
                                        null
                                    )
                                }
                                aria-label="Close profile"
                            >
                                ×
                            </button>

                        </div>

                        {/* PROFILE HERO */}

                        <div className="applicant-modal-hero">

                            <div className="modal-photo-wrapper">

                                <OverlayProfilePhoto
                                    application={
                                        selectedApplicant
                                    }
                                />

                                <div className="modal-photo-ring"></div>

                            </div>

                            <div className="modal-profile-main">

                                <h3>
                                    {
                                        selectedApplicant.studentName ||
                                        "Student"
                                    }
                                </h3>

                                <p className="modal-email">
                                    {
                                        selectedApplicant.studentEmail ||
                                        selectedApplicant.email ||
                                        "Email not available"
                                    }
                                </p>

                                <div className="modal-hero-meta">

                                    <span
                                        className={`status-badge ${
                                            String(
                                                selectedApplicant.status ||
                                                "Applied"
                                            )
                                                .trim()
                                                .toLowerCase() ===
                                                "accepted"
                                                ? "status-accepted"
                                                : String(
                                                    selectedApplicant.status ||
                                                    "Applied"
                                                )
                                                    .trim()
                                                    .toLowerCase() ===
                                                    "rejected"
                                                    ? "status-rejected"
                                                    : "status-pending"
                                        }`}
                                    >

                                        <span className="status-dot"></span>

                                        {
                                            selectedApplicant.status ||
                                            "Applied"
                                        }

                                    </span>

                                    <span className="modal-job-chip">
                                        💼{" "}
                                        {
                                            selectedApplicant.jobTitle ||
                                            "Job Not Available"
                                        }
                                    </span>

                                </div>

                            </div>

                        </div>

                        {/* MODAL CONTENT */}

                        <div className="applicant-modal-content">

                            {/* Academic */}

                            <div className="modal-section">

                                <div className="modal-section-heading">

                                    <span className="modal-section-icon">
                                        🎓
                                    </span>

                                    <div>

                                        <h4>
                                            Academic Information
                                        </h4>

                                        <p>
                                            Education and academic performance
                                        </p>

                                    </div>

                                </div>

                                <div className="modal-detail-grid">

                                    <div className="modal-detail">

                                        <span>
                                            Degree
                                        </span>

                                        <strong>
                                            {
                                                selectedApplicant.degree ||
                                                "Not Available"
                                            }
                                        </strong>

                                    </div>

                                    <div className="modal-detail">

                                        <span>
                                            Department
                                        </span>

                                        <strong>
                                            {
                                                selectedApplicant.department ||
                                                "Not Available"
                                            }
                                        </strong>

                                    </div>

                                    <div className="modal-detail">

                                        <span>
                                            10th Percentage
                                        </span>

                                        <strong>
                                            {
                                                formatAcademicValue(
                                                    selectedApplicant.tenthPercentage,
                                                    "%"
                                                )
                                            }
                                        </strong>

                                    </div>

                                    <div className="modal-detail">

                                        <span>
                                            12th Percentage
                                        </span>

                                        <strong>
                                            {
                                                formatAcademicValue(
                                                    selectedApplicant.twelfthPercentage,
                                                    "%"
                                                )
                                            }
                                        </strong>

                                    </div>

                                    <div className="modal-detail">

                                        <span>
                                            CGPA
                                        </span>

                                        <strong>
                                            {
                                                selectedApplicant.cgpa ||
                                                "Not Available"
                                            }
                                        </strong>

                                    </div>

                                    <div className="modal-detail modal-detail-wide">

                                        <span>
                                            College / Institute
                                        </span>

                                        <strong>
                                            {
                                                selectedApplicant.college ||
                                                "Not Available"
                                            }
                                        </strong>

                                    </div>

                                </div>

                            </div>

                            {/* Contact */}

                            <div className="modal-section">

                                <div className="modal-section-heading">

                                    <span className="modal-section-icon">
                                        👤
                                    </span>

                                    <div>

                                        <h4>
                                            Contact Information
                                        </h4>

                                        <p>
                                            Student contact details
                                        </p>

                                    </div>

                                </div>

                                <div className="modal-detail-grid">

                                    <div className="modal-detail">

                                        <span>
                                            Email
                                        </span>

                                        <strong className="modal-blue">
                                            {
                                                selectedApplicant.studentEmail ||
                                                selectedApplicant.email ||
                                                "Not Available"
                                            }
                                        </strong>

                                    </div>

                                    <div className="modal-detail">

                                        <span>
                                            Phone
                                        </span>

                                        <strong>
                                            {
                                                selectedApplicant.phone ||
                                                "Not Available"
                                            }
                                        </strong>

                                    </div>

                                </div>

                            </div>

                            {/* Skills */}

                            <div className="modal-section">

                                <div className="modal-section-heading">

                                    <span className="modal-section-icon">
                                        ⚡
                                    </span>

                                    <div>

                                        <h4>
                                            Skills
                                        </h4>

                                        <p>
                                            Technical skills and expertise
                                        </p>

                                    </div>

                                </div>

                                <div className="modal-skills">

                                    {Array.isArray(
                                        selectedApplicant.skills
                                    ) ? (

                                        selectedApplicant.skills.map(
                                            (skill, index) => (

                                                <span
                                                    className="modal-skill"
                                                    key={`${skill}-${index}`}
                                                >
                                                    {skill}
                                                </span>

                                            )
                                        )

                                    ) : (

                                        <span className="modal-skills-text">
                                            {
                                                selectedApplicant.skills ||
                                                "Not Available"
                                            }
                                        </span>

                                    )}

                                </div>

                            </div>

                            {/* Resume */}

                            {selectedApplicant.resumeURL && (

                                <div className="modal-section">

                                    <div className="modal-section-heading">

                                        <span className="modal-section-icon">
                                            📄
                                        </span>

                                        <div>

                                            <h4>
                                                Resume
                                            </h4>

                                            <p>
                                                Student's uploaded resume
                                            </p>

                                        </div>

                                    </div>

                                    <a
                                        href={
                                            selectedApplicant.resumeURL
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="modal-resume-btn"
                                    >

                                        <span>
                                            📄
                                        </span>

                                        View Student Resume

                                        <span className="resume-arrow">
                                            ↗
                                        </span>

                                    </a>

                                </div>

                            )}

                        </div>

                        {/* MODAL FOOTER */}

                        <div className="applicant-modal-footer">

                            <button
                                type="button"
                                className="modal-secondary-btn"
                                onClick={() =>
                                    setSelectedApplicant(
                                        null
                                    )
                                }
                            >
                                Close
                            </button>

                            <button
                                type="button"
                                className="modal-primary-btn"
                                onClick={() =>
                                    setSelectedApplicant(
                                        null
                                    )
                                }
                            >
                                Done
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}

export default Applicants;