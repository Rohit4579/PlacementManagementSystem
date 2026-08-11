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

    /* Selected applicant for overlay */
    const [selectedApplicant, setSelectedApplicant] = useState(null);

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

        /* ---------------------------------------------
           STRING
        --------------------------------------------- */

        if (typeof value === "string") {

            const cleanValue = value.trim();

            if (!cleanValue) {
                return "";
            }

            return cleanValue;
        }

        /* ---------------------------------------------
           OBJECT
        --------------------------------------------- */

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

                const nestedValue =
                    value?.[key];

                if (
                    nestedValue !== undefined &&
                    nestedValue !== null &&
                    String(nestedValue).trim() !== ""
                ) {

                    return String(
                        nestedValue
                    ).trim();
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

        /* Direct fields */
        for (const field of photoFields) {

            const result =
                extractImageValue(
                    object?.[field]
                );

            if (result) {
                return result;
            }
        }

        /* Nested objects */
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

        /* ---------------------------------------------
           STUDENT PROFILE
        --------------------------------------------- */

        const profilePhoto =
            searchPhotoInObject(profile);

        if (profilePhoto) {
            return profilePhoto;
        }

        /* ---------------------------------------------
           USER PROFILE
        --------------------------------------------- */

        const userPhoto =
            searchPhotoInObject(userProfile);

        if (userPhoto) {
            return userPhoto;
        }

        /* ---------------------------------------------
           APPLICATION
        --------------------------------------------- */

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

        /* ---------------------------------------------
           DATA URL
        --------------------------------------------- */

        if (
            value.startsWith("data:image/")
        ) {
            return value;
        }

        /* ---------------------------------------------
           NORMAL URL
        --------------------------------------------- */

        if (
            value.startsWith("http://") ||
            value.startsWith("https://")
        ) {
            return value;
        }

        /* ---------------------------------------------
           FIREBASE STORAGE
        --------------------------------------------- */

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
            .map(value => String(value).trim());

        /* ---------------------------------------------
           DOCUMENT ID
        --------------------------------------------- */

        for (const id of possibleIds) {

            if (profilesById[id]) {
                return profilesById[id];
            }
        }

        /* ---------------------------------------------
           UID
        --------------------------------------------- */

        for (const id of possibleIds) {

            if (profilesByUid[id]) {
                return profilesByUid[id];
            }
        }

        /* ---------------------------------------------
           STUDENT ID FIELD
        --------------------------------------------- */

        for (const id of possibleIds) {

            if (profilesByStudentId[id]) {
                return profilesByStudentId[id];
            }
        }

        /* ---------------------------------------------
           USER ID FIELD
        --------------------------------------------- */

        for (const id of possibleIds) {

            if (profilesByUserId[id]) {
                return profilesByUserId[id];
            }
        }

        /* ---------------------------------------------
           EMAIL
        --------------------------------------------- */

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
       LOAD APPLICANTS
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
               1. GET COMPANY APPLICATIONS
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

                    /* Document ID */

                    profilesById[
                        profileDocument.id
                    ] = profileData;

                    /* UID */

                    const uid =
                        profile.uid ||
                        profile.userUid ||
                        profile.userUID;

                    if (uid) {

                        profilesByUid[
                            String(uid)
                        ] = profileData;
                    }

                    /* Email */

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

                    /* Student ID */

                    const studentId =
                        profile.studentId ||
                        profile.studentID;

                    if (studentId) {

                        profilesByStudentId[
                            String(studentId)
                        ] = profileData;
                    }

                    /* User ID */

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
               3. ALSO LOAD USERS
               
               This helps when profile photo is stored
               in users/{uid} instead of studentProfiles.
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

                /* =================================================
                   DEFAULT VALUES
                ================================================= */

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
                   USER PROFILE FALLBACK DATA
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
       UPDATE APPLICATION STATUS
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

        try {

            setUpdatingId(id);

            const applicationReference =
                doc(
                    db,
                    "applications",
                    id
                );

            if (
                status === "Accepted"
            ) {

                await updateDoc(
                    applicationReference,
                    {
                        status: "Accepted",
                        placedStudent: false,
                        placementActivity:
                            "Shortlisted"
                    }
                );

            } else {

                await updateDoc(
                    applicationReference,
                    {
                        status: "Rejected",
                        placedStudent: false,
                        placementActivity: ""
                    }
                );
            }

            setApplications(
                previous =>
                    previous.map(
                        item =>
                            item.id === id
                                ? {
                                    ...item,
                                    status,
                                    placedStudent:
                                        false,
                                    placementActivity:
                                        status ===
                                        "Accepted"
                                            ? "Shortlisted"
                                            : ""
                                }
                                : item
                    )
            );

            setSelectedApplicant(
                previous =>
                    previous &&
                    previous.id === id
                        ? {
                            ...previous,
                            status,
                            placedStudent: false,
                            placementActivity:
                                status ===
                                "Accepted"
                                    ? "Shortlisted"
                                    : ""
                        }
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

        if (
            application.companyId &&
            application.companyId !== user.uid
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
                `Delete the application from ${studentName}?\n\nThis action cannot be undone.`
            );

        if (!confirmed) {
            return;
        }

        try {

            setDeletingId(
                application.id
            );

            await deleteDoc(
                doc(
                    db,
                    "applications",
                    application.id
                )
            );

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
    ========================================================= */

    const updatePlacedStudent = async (
        application,
        placed
    ) => {

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

            setApplications(
                previous =>
                    previous.map(
                        item =>
                            item.id ===
                            application.id
                                ? {
                                    ...item,
                                    status:
                                        "Accepted",
                                    placedStudent:
                                        placed,
                                    placementActivity:
                                        placed
                                            ? "Placed"
                                            : "Shortlisted"
                                }
                                : item
                    )
            );

            setSelectedApplicant(
                previous =>
                    previous &&
                    previous.id ===
                        application.id
                        ? {
                            ...previous,
                            status:
                                "Accepted",
                            placedStudent:
                                placed,
                            placementActivity:
                                placed
                                    ? "Placed"
                                    : "Shortlisted"
                        }
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

                                    {/* =================================================
                                        TOP
                                    ================================================= */}

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

                                    {/* =================================================
                                        JOB
                                    ================================================= */}

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

                                    {/* =================================================
                                        INFORMATION
                                    ================================================= */}

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

                                    {/* =================================================
                                        SKILLS
                                    ================================================= */}

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

                                    {/* =================================================
                                        EMAIL
                                    ================================================= */}

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

                                    {/* =================================================
                                        RESUME
                                    ================================================= */}

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

                                    {/* =================================================
                                        PLACEMENT
                                    ================================================= */}

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

                                    {/* =================================================
                                        ACTION BUTTONS
                                    ================================================= */}

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

                        {/* =================================================
                            MODAL HEADER
                        ================================================= */}

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

                        {/* =================================================
                            PROFILE HERO
                        ================================================= */}

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

                        {/* =================================================
                            MODAL CONTENT
                        ================================================= */}

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

                        {/* =================================================
                            MODAL FOOTER
                        ================================================= */}

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