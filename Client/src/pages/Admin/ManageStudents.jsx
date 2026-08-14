import { useEffect, useState } from "react";

import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    writeBatch
} from "firebase/firestore";

import {
    createPortal
} from "react-dom";

import {
    FaUsers,
    FaUserGraduate,
    FaEnvelope,
    FaPhone,
    FaGraduationCap,
    FaBuilding,
    FaCode,
    FaFilePdf,
    FaExternalLinkAlt,
    FaEye,
    FaTrash,
    FaTimes,
    FaCheckCircle,
    FaSearch,
    FaUserCircle
} from "react-icons/fa";

import { db } from "../../firebase/firebaseConfig";

import "./ManageStudents.css";


function ManageStudents() {

    /* =========================================================
       STATE
    ========================================================= */

    const [students, setStudents] = useState([]);

    const [filteredStudents, setFilteredStudents] =
        useState([]);

    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");

    const [selectedStudent, setSelectedStudent] =
        useState(null);

    const [deletingId, setDeletingId] =
        useState(null);


    /* =========================================================
       NORMALIZE
    ========================================================= */

    const normalize = (value) => {

        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(value).trim();

    };


    /* =========================================================
       NORMALIZE ID
    ========================================================= */

    const normalizeId = (value) => {

        return normalize(value).toLowerCase();

    };


    /* =========================================================
       GET FIRST AVAILABLE VALUE
    ========================================================= */

    const getFirstValue = (
        object,
        fields,
        fallback = ""
    ) => {

        if (!object) {
            return fallback;
        }

        for (const field of fields) {

            const value = object[field];

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
       CHECK ACTIVE STUDENT ACCOUNT
       
       IMPORTANT:
       
       A student is considered valid/active for this page
       only when:
       
       1. users document exists
       2. role is student
       3. studentProfiles document exists
       
       This follows the same validation approach used by
       AdminDashboard.

       Old/stale users documents without a student profile
       are therefore NOT counted.
    ========================================================= */

    const isActiveStudent = (
        user,
        profile
    ) => {

        if (!user || !profile) {
            return false;
        }

        const role =
            normalize(
                user.role
            ).toLowerCase();


        if (role !== "student") {
            return false;
        }


        return true;

    };


    /* =========================================================
       BUILD STUDENT
    ========================================================= */

    const buildStudent = (
        userDocument,
        profileDocument
    ) => {

        const userData =
            userDocument?.data() || {};

        const profile =
            profileDocument?.data() || {};


        const uid =
            normalize(
                userData.uid
            ) ||
            normalize(
                profile.uid
            ) ||
            userDocument.id;


        const student = {

            id:
                userDocument.id,

            uid,

            profileId:
                profileDocument.id,

            name:
                normalize(
                    getFirstValue(
                        profile,
                        [
                            "studentName",
                            "name",
                            "fullName",
                            "displayName"
                        ]
                    )
                ) ||
                normalize(
                    getFirstValue(
                        userData,
                        [
                            "studentName",
                            "name",
                            "fullName",
                            "displayName"
                        ]
                    )
                ) ||
                "Student",


            email:
                normalize(
                    getFirstValue(
                        profile,
                        [
                            "email",
                            "studentEmail",
                            "emailAddress"
                        ]
                    )
                ) ||
                normalize(
                    userData.email
                ),


            phone:
                normalize(
                    getFirstValue(
                        profile,
                        [
                            "phone",
                            "mobile",
                            "mobileNumber",
                            "phoneNumber",
                            "contactNumber"
                        ]
                    )
                ) ||
                normalize(
                    userData.phone
                ),


            degree:
                normalize(
                    getFirstValue(
                        profile,
                        [
                            "degree",
                            "degreeName",
                            "course",
                            "courseName",
                            "program",
                            "programName",
                            "qualification",
                            "education",
                            "highestQualification"
                        ]
                    )
                ) ||
                normalize(
                    getFirstValue(
                        userData,
                        [
                            "degree",
                            "degreeName",
                            "course",
                            "program"
                        ]
                    )
                ),


            department:
                normalize(
                    getFirstValue(
                        profile,
                        [
                            "department",
                            "branch",
                            "stream",
                            "specialization"
                        ]
                    )
                ) ||
                normalize(
                    userData.department
                ),


            tenthPercentage:
                normalize(
                    getFirstValue(
                        profile,
                        [
                            "tenthPercentage",
                            "tenthPercent",
                            "class10Percentage",
                            "class10Percent",
                            "percentage10"
                        ]
                    )
                ) ||
                normalize(
                    getFirstValue(
                        userData,
                        [
                            "tenthPercentage",
                            "tenthPercent",
                            "class10Percentage"
                        ]
                    )
                ),


            twelfthPercentage:
                normalize(
                    getFirstValue(
                        profile,
                        [
                            "twelfthPercentage",
                            "twelfthPercent",
                            "class12Percentage",
                            "class12Percent",
                            "percentage12"
                        ]
                    )
                ) ||
                normalize(
                    getFirstValue(
                        userData,
                        [
                            "twelfthPercentage",
                            "twelfthPercent",
                            "class12Percentage"
                        ]
                    )
                ),


            cgpa:
                normalize(
                    getFirstValue(
                        profile,
                        [
                            "cgpa",
                            "CGPA"
                        ]
                    )
                ) ||
                normalize(
                    getFirstValue(
                        userData,
                        [
                            "cgpa",
                            "CGPA"
                        ]
                    )
                ),


            skills:
                normalize(
                    getFirstValue(
                        profile,
                        [
                            "skills"
                        ]
                    )
                ) ||
                normalize(
                    userData.skills
                ),


            graduationYear:
                normalize(
                    getFirstValue(
                        profile,
                        [
                            "graduationYear",
                            "passoutYear",
                            "yearOfGraduation",
                            "graduation_year"
                        ]
                    )
                ) ||
                normalize(
                    getFirstValue(
                        userData,
                        [
                            "graduationYear",
                            "passoutYear",
                            "yearOfGraduation"
                        ]
                    )
                ),


            resumeURL:
                normalize(
                    getFirstValue(
                        profile,
                        [
                            "resumeURL",
                            "resumeUrl",
                            "resume",
                            "resumeURL"
                        ]
                    )
                ) ||
                normalize(
                    getFirstValue(
                        userData,
                        [
                            "resumeURL",
                            "resumeUrl"
                        ]
                    )
                ),


            profilePhotoURL:
                normalize(
                    getFirstValue(
                        profile,
                        [
                            "photoURL",
                            "photoUrl",
                            "profilePhoto",
                            "profilePhotoURL",
                            "profilePhotoUrl",
                            "profileImage",
                            "profileImageURL",
                            "profileImageUrl",
                            "photo",
                            "image",
                            "imageURL",
                            "imageUrl",
                            "avatar",
                            "avatarUrl"
                        ]
                    )
                ) ||
                normalize(
                    getFirstValue(
                        userData,
                        [
                            "profilePhotoURL",
                            "photoURL",
                            "photoUrl",
                            "photo"
                        ]
                    )
                ),


            profilePhotoPublicId:
                normalize(
                    getFirstValue(
                        profile,
                        [
                            "profilePhotoPublicId"
                        ]
                    )
                ) ||
                normalize(
                    userData.profilePhotoPublicId
                ),


            profileCompleted:
                false

        };


        /* =====================================================
           PROFILE COMPLETION
        ===================================================== */

        const requiredFields = [

            student.phone,

            student.degree,

            student.department,

            student.tenthPercentage,

            student.twelfthPercentage,

            student.cgpa,

            student.skills,

            student.graduationYear

        ];


        const automaticallyComplete =
            requiredFields.every(
                value =>
                    normalize(value) !== ""
            );


        if (
            automaticallyComplete
        ) {

            student.profileCompleted = true;

        }
        else if (
            typeof profile.profileCompleted ===
            "boolean"
        ) {

            student.profileCompleted =
                profile.profileCompleted;

        }


        return student;

    };


    /* =========================================================
       FETCH ACTIVE STUDENTS

       REALTIME

       This is intentionally based on BOTH:

       users
          +
       studentProfiles

       A users document without a matching student profile
       is ignored.

       A student profile without a users document
       is also ignored.

       Therefore stale/deleted records do not appear.
    ========================================================= */

    useEffect(() => {

        let usersData = [];

        let profilesData = [];

        let usersLoaded = false;

        let profilesLoaded = false;


        const processStudents = () => {

            if (
                !usersLoaded ||
                !profilesLoaded
            ) {
                return;
            }


            try {

                /* =================================================
                   PROFILE MAPS

                   Same strategy as AdminDashboard.
                ================================================= */

                const profilesById = {};

                const profilesByUid = {};


                profilesData.forEach(
                    profile => {

                        profilesById[
                            normalizeId(
                                profile.id
                            )
                        ] = profile;


                        const profileUid =
                            normalize(
                                profile.uid
                            );


                        if (profileUid) {

                            profilesByUid[
                                normalizeId(
                                    profileUid
                                )
                            ] = profile;

                        }

                    }
                );


                /* =================================================
                   BUILD ONLY ACTIVE STUDENTS
                ================================================= */

                const activeStudents = [];


                usersData.forEach(
                    user => {

                        const role =
                            normalize(
                                user.role
                            ).toLowerCase();


                        /*
                         * ONLY STUDENT ACCOUNTS
                         */
                        if (
                            role !== "student"
                        ) {
                            return;
                        }


                        const userId =
                            normalize(
                                user.id
                            );


                        const uid =
                            normalize(
                                user.uid
                            );


                        let profile = null;


                        /* =========================================
                           FIRST: USERS DOCUMENT ID
                        ========================================= */

                        if (
                            userId &&
                            profilesById[
                                normalizeId(
                                    userId
                                )
                            ]
                        ) {

                            profile =
                                profilesById[
                                    normalizeId(
                                        userId
                                    )
                                ];

                        }


                        /* =========================================
                           SECOND: UID
                        ========================================= */

                        if (
                            !profile &&
                            uid &&
                            profilesById[
                                normalizeId(
                                    uid
                                )
                            ]
                        ) {

                            profile =
                                profilesById[
                                    normalizeId(
                                        uid
                                    )
                                ];

                        }


                        /* =========================================
                           THIRD: PROFILE UID
                        ========================================= */

                        if (
                            !profile &&
                            uid &&
                            profilesByUid[
                                normalizeId(
                                    uid
                                )
                            ]
                        ) {

                            profile =
                                profilesByUid[
                                    normalizeId(
                                        uid
                                    )
                                ];

                        }


                        /*
                         * NO PROFILE = INVALID/STALE ACCOUNT
                         *
                         * This is the critical fix.
                         *
                         * Old users documents left behind after
                         * student deletion will NOT be displayed.
                         */

                        if (
                            !isActiveStudent(
                                user,
                                profile
                            )
                        ) {

                            return;

                        }


                        const userDocument = {
                            id: user.id,
                            data: () => user
                        };


                        const profileDocument = {
                            id: profile.id,
                            data: () => profile
                        };


                        const student =
                            buildStudent(
                                userDocument,
                                profileDocument
                            );


                        activeStudents.push(
                            student
                        );

                    }
                );


                /* =================================================
                   SORT
                ================================================= */

                activeStudents.sort(
                    (a, b) =>
                        String(a.name)
                            .localeCompare(
                                String(b.name)
                            )
                );


                setStudents(
                    activeStudents
                );


                setFilteredStudents(
                    activeStudents
                );


                setLoading(false);

            }
            catch (error) {

                console.error(
                    "Student processing error:",
                    error
                );

                setLoading(false);

            }

        };


        /* =========================================================
           USERS REALTIME LISTENER
        ========================================================= */

        const unsubscribeUsers =
            onSnapshot(

                collection(
                    db,
                    "users"
                ),

                snapshot => {

                    usersData =
                        snapshot.docs.map(
                            document => ({

                                id:
                                    document.id,

                                ...document.data()

                            })
                        );


                    usersLoaded = true;

                    processStudents();

                },

                error => {

                    console.error(
                        "Users realtime listener error:",
                        error
                    );

                    usersLoaded = true;

                    processStudents();

                }

            );


        /* =========================================================
           STUDENT PROFILES REALTIME LISTENER
        ========================================================= */

        const unsubscribeProfiles =
            onSnapshot(

                collection(
                    db,
                    "studentProfiles"
                ),

                snapshot => {

                    profilesData =
                        snapshot.docs.map(
                            document => ({

                                id:
                                    document.id,

                                ...document.data()

                            })
                        );


                    profilesLoaded = true;

                    processStudents();

                },

                error => {

                    console.error(
                        "Student profiles realtime listener error:",
                        error
                    );

                    profilesLoaded = true;

                    processStudents();

                }

            );


        /* =========================================================
           CLEANUP
        ========================================================= */

        return () => {

            unsubscribeUsers();

            unsubscribeProfiles();

        };

    }, []);


    /* =========================================================
       SEARCH
    ========================================================= */

    useEffect(() => {

        const searchText =
            search
                .trim()
                .toLowerCase();


        if (!searchText) {

            setFilteredStudents(
                students
            );

            return;

        }


        const result =
            students.filter(
                student => {

                    const searchableText = [

                        student.name,

                        student.email,

                        student.phone,

                        student.department,

                        student.degree,

                        student.cgpa,

                        student.tenthPercentage,

                        student.twelfthPercentage,

                        student.graduationYear,

                        student.skills

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    return searchableText.includes(
                        searchText
                    );

                }
            );


        setFilteredStudents(
            result
        );

    }, [
        search,
        students
    ]);


    /* =========================================================
       HELPERS
    ========================================================= */

    const displayValue = (
        value,
        fallback = "Not Available"
    ) => {

        const cleanValue =
            normalize(value);

        return (
            cleanValue ||
            fallback
        );

    };


    const getInitials = (
        name
    ) => {

        const cleanName =
            normalize(name);


        if (!cleanName) {
            return "S";
        }


        const parts =
            cleanName
                .split(/\s+/)
                .filter(Boolean);


        if (
            parts.length >= 2
        ) {

            return (
                parts[0].charAt(0) +
                parts[1].charAt(0)
            ).toUpperCase();

        }


        return cleanName
            .charAt(0)
            .toUpperCase();

    };


    const getShortName = (
        name
    ) => {

        return (
            normalize(name) ||
            "Student"
        );

    };


    const hasPhoto = (
        student
    ) => {

        return Boolean(
            normalize(
                student?.profilePhotoURL
            )
        );

    };


    const hasResume = (
        student
    ) => {

        return Boolean(
            normalize(
                student?.resumeURL
            )
        );

    };


    /* =========================================================
       DELETE ALL APPLICATIONS FOR STUDENT
    ========================================================= */

    const deleteStudentApplications =
        async (
            student
        ) => {

            const studentIdentifiers =
                new Set(

                    [
                        student?.id,
                        student?.uid,
                        student?.profileId
                    ]
                        .map(
                            normalize
                        )
                        .filter(Boolean)

                );


            if (
                studentIdentifiers.size === 0
            ) {

                return 0;

            }


            const applicationsSnapshot =
                await getDocs(
                    collection(
                        db,
                        "applications"
                    )
                );


            const applicationDocuments =
                applicationsSnapshot.docs.filter(
                    applicationDoc => {

                        const application =
                            applicationDoc.data() || {};


                        const applicationIdentifiers = [

                            application.studentId,

                            application.studentID,

                            application.uid,

                            application.userId,

                            application.userID,

                            application.studentUid,

                            application.studentUID,

                            application.studentProfileId

                        ]
                            .map(
                                normalize
                            )
                            .filter(Boolean);


                        return applicationIdentifiers.some(
                            identifier =>
                                studentIdentifiers.has(
                                    identifier
                                )
                        );

                    }
                );


            if (
                applicationDocuments.length === 0
            ) {

                return 0;

            }


            /*
             * Firestore maximum batch size = 500 writes.
             */

            const BATCH_SIZE = 500;

            let deletedCount = 0;


            for (
                let index = 0;
                index < applicationDocuments.length;
                index += BATCH_SIZE
            ) {

                const batch =
                    writeBatch(db);


                const currentBatch =
                    applicationDocuments.slice(
                        index,
                        index + BATCH_SIZE
                    );


                currentBatch.forEach(
                    applicationDoc => {

                        batch.delete(
                            doc(
                                db,
                                "applications",
                                applicationDoc.id
                            )
                        );

                    }
                );


                await batch.commit();


                deletedCount +=
                    currentBatch.length;

            }


            return deletedCount;

        };


    /* =========================================================
       VIEW STUDENT
    ========================================================= */

    const viewStudent = (
        student
    ) => {

        setSelectedStudent(
            student
        );

    };


    /* =========================================================
       CLOSE MODAL
    ========================================================= */

    const closeModal = () => {

        setSelectedStudent(
            null
        );

    };


    /* =========================================================
       ESCAPE KEY + BODY LOCK
    ========================================================= */

    useEffect(() => {

        if (!selectedStudent) {

            document.body.classList.remove(
                "student-modal-open"
            );

            return;

        }


        document.body.classList.add(
            "student-modal-open"
        );


        const handleEscape = (
            event
        ) => {

            if (
                event.key === "Escape"
            ) {

                closeModal();

            }

        };


        document.addEventListener(
            "keydown",
            handleEscape
        );


        return () => {

            document.removeEventListener(
                "keydown",
                handleEscape
            );


            document.body.classList.remove(
                "student-modal-open"
            );

        };

    }, [selectedStudent]);


    /* =========================================================
       DELETE STUDENT
    ========================================================= */

    const deleteStudent =
        async (
            student
        ) => {

            if (!student?.id) {
                return;
            }


            const confirmed =
                window.confirm(

                    `Are you sure you want to delete ${student.name}?\n\n` +

                    "This will permanently delete the student's " +

                    "account, profile information, and ALL applications " +

                    "submitted by this student."

                );


            if (!confirmed) {
                return;
            }


            try {

                setDeletingId(
                    student.id
                );


                /* =============================================
                   DELETE APPLICATIONS FIRST
                ============================================= */

                const deletedApplications =
                    await deleteStudentApplications(
                        student
                    );


                /* =============================================
                   DELETE USERS DOCUMENT
                ============================================= */

                await deleteDoc(
                    doc(
                        db,
                        "users",
                        student.id
                    )
                );


                /* =============================================
                   DELETE PROFILE BY PROFILE DOCUMENT ID
                ============================================= */

                if (
                    student.profileId
                ) {

                    try {

                        await deleteDoc(
                            doc(
                                db,
                                "studentProfiles",
                                student.profileId
                            )
                        );

                    }
                    catch (
                        profileDeleteError
                    ) {

                        console.warn(
                            "Profile delete warning:",
                            profileDeleteError
                        );

                    }

                }


                /* =============================================
                   ALSO DELETE PROFILE USING USER ID
                   IF DIFFERENT
                ============================================= */

                if (
                    student.id &&
                    student.profileId !== student.id
                ) {

                    try {

                        await deleteDoc(
                            doc(
                                db,
                                "studentProfiles",
                                student.id
                            )
                        );

                    }
                    catch (
                        profileDeleteError
                    ) {

                        console.warn(
                            "User ID profile delete warning:",
                            profileDeleteError
                        );

                    }

                }


                /* =============================================
                   ALSO DELETE PROFILE USING UID
                ============================================= */

                if (
                    student.uid &&
                    student.uid !== student.id &&
                    student.uid !== student.profileId
                ) {

                    try {

                        await deleteDoc(
                            doc(
                                db,
                                "studentProfiles",
                                student.uid
                            )
                        );

                    }
                    catch (
                        uidDeleteError
                    ) {

                        console.warn(
                            "UID profile delete warning:",
                            uidDeleteError
                        );

                    }

                }


                /* =============================================
                   REALTIME LISTENER WILL UPDATE UI

                   No manual student state update is required.
                ============================================= */

                setSelectedStudent(
                    null
                );


                alert(
                    `Student deleted successfully. ${deletedApplications} application(s) also deleted.`
                );

            }
            catch (error) {

                console.error(
                    "Delete Student Error:",
                    error
                );


                alert(
                    "Unable to delete this student and related applications. Please check your Firebase permissions."
                );

            }
            finally {

                setDeletingId(
                    null
                );

            }

        };


    /* =========================================================
       STATISTICS
    ========================================================= */

    const completedProfiles =
        students.filter(
            student =>
                student.profileCompleted
        ).length;


    const resumeCount =
        students.filter(
            student =>
                hasResume(student)
        ).length;


    const departments =
        new Set(
            students
                .map(
                    student =>
                        normalize(
                            student.department
                        ).toLowerCase()
                )
                .filter(Boolean)
        ).size;


    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {

        return (

            <div className="manage-students-page">

                <div className="students-loading">

                    <div className="loading-spinner"></div>

                    <h2>
                        Loading Students
                    </h2>

                    <p>
                        Please wait while active student profiles are loaded.
                    </p>

                </div>

            </div>

        );

    }


    /* =========================================================
       STUDENT PROFILE MODAL
    ========================================================= */

    const studentModal =
        selectedStudent
            ? (

                <div
                    className="student-modal-overlay"
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {

                            closeModal();

                        }

                    }}
                >

                    <div
                        className="student-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Student profile"
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="modal-header">

                            <div className="modal-header-left">

                                <div className="modal-header-icon">
                                    <FaUserGraduate />
                                </div>

                                <div className="modal-header-title">

                                    <span>
                                        STUDENT PROFILE
                                    </span>

                                    <h2
                                        title={
                                            selectedStudent.name
                                        }
                                    >
                                        {getShortName(
                                            selectedStudent.name
                                        )}
                                    </h2>

                                </div>

                            </div>


                            <button
                                type="button"
                                className="modal-close"
                                onClick={
                                    closeModal
                                }
                                aria-label="Close student profile"
                            >

                                <FaTimes />

                            </button>

                        </div>


                        <div className="student-modal-content">

                            <div className="modal-profile">

                                <div className="modal-avatar">

                                    {hasPhoto(
                                        selectedStudent
                                    ) ? (

                                        <img
                                            src={
                                                selectedStudent.profilePhotoURL
                                            }
                                            alt={
                                                getShortName(
                                                    selectedStudent.name
                                                )
                                            }
                                            className="modal-profile-image"
                                            onError={(event) => {

                                                event.currentTarget.style.display =
                                                    "none";


                                                const fallback =
                                                    event.currentTarget
                                                        .parentElement
                                                        ?.querySelector(
                                                            ".modal-avatar-fallback"
                                                        );


                                                if (fallback) {

                                                    fallback.style.display =
                                                        "flex";

                                                }

                                            }}
                                        />

                                    ) : null}


                                    <div
                                        className="modal-avatar-fallback"
                                        style={{
                                            display:
                                                hasPhoto(
                                                    selectedStudent
                                                )
                                                    ? "none"
                                                    : "flex"
                                        }}
                                    >

                                        {getInitials(
                                            selectedStudent.name
                                        )}

                                    </div>

                                </div>


                                <div className="modal-profile-info">

                                    <h3
                                        title={
                                            selectedStudent.name
                                        }
                                    >
                                        {getShortName(
                                            selectedStudent.name
                                        )}
                                    </h3>


                                    <p
                                        title={
                                            selectedStudent.email
                                        }
                                    >
                                        {displayValue(
                                            selectedStudent.email
                                        )}
                                    </p>


                                    <div className="modal-profile-badges">

                                        {selectedStudent.profileCompleted ? (

                                            <span className="status-badge completed">

                                                <FaCheckCircle />

                                                Profile Complete

                                            </span>

                                        ) : (

                                            <span className="status-badge incomplete">

                                                Profile Incomplete

                                            </span>

                                        )}

                                    </div>

                                </div>

                            </div>


                            <div className="modal-section">

                                <div className="modal-section-heading">

                                    <div className="modal-section-icon">

                                        <FaUserGraduate />

                                    </div>

                                    <div>

                                        <h3>
                                            Personal Information
                                        </h3>

                                        <p>
                                            Basic student account information
                                        </p>

                                    </div>

                                </div>


                                <div className="modal-details-grid">

                                    <div className="detail-item">

                                        <span>
                                            Full Name
                                        </span>

                                        <strong>
                                            {displayValue(
                                                selectedStudent.name
                                            )}
                                        </strong>

                                    </div>


                                    <div className="detail-item">

                                        <span>
                                            Email Address
                                        </span>

                                        <strong
                                            title={
                                                selectedStudent.email
                                            }
                                        >
                                            {displayValue(
                                                selectedStudent.email
                                            )}
                                        </strong>

                                    </div>


                                    <div className="detail-item">

                                        <span>
                                            Phone
                                        </span>

                                        <strong>
                                            {displayValue(
                                                selectedStudent.phone
                                            )}
                                        </strong>

                                    </div>


                                    <div className="detail-item">

                                        <span>
                                            Degree
                                        </span>

                                        <strong>
                                            {displayValue(
                                                selectedStudent.degree
                                            )}
                                        </strong>

                                    </div>


                                    <div className="detail-item detail-item-full">

                                        <span>
                                            Department / Branch
                                        </span>

                                        <strong>
                                            {displayValue(
                                                selectedStudent.department
                                            )}
                                        </strong>

                                    </div>

                                </div>

                            </div>


                            <div className="modal-section">

                                <div className="modal-section-heading">

                                    <div className="modal-section-icon academic">

                                        <FaGraduationCap />

                                    </div>

                                    <div>

                                        <h3>
                                            Academic Information
                                        </h3>

                                        <p>
                                            Academic performance and graduation details
                                        </p>

                                    </div>

                                </div>


                                <div className="modal-details-grid">

                                    <div className="detail-item">

                                        <span>
                                            10th Percentage
                                        </span>

                                        <strong>

                                            {selectedStudent.tenthPercentage
                                                ? `${selectedStudent.tenthPercentage}%`
                                                : "Not Available"}

                                        </strong>

                                    </div>


                                    <div className="detail-item">

                                        <span>
                                            12th Percentage
                                        </span>

                                        <strong>

                                            {selectedStudent.twelfthPercentage
                                                ? `${selectedStudent.twelfthPercentage}%`
                                                : "Not Available"}

                                        </strong>

                                    </div>


                                    <div className="detail-item">

                                        <span>
                                            CGPA
                                        </span>

                                        <strong>

                                            {selectedStudent.cgpa
                                                ? `${selectedStudent.cgpa} / 10`
                                                : "Not Available"}

                                        </strong>

                                    </div>


                                    <div className="detail-item">

                                        <span>
                                            Graduation Year
                                        </span>

                                        <strong>
                                            {displayValue(
                                                selectedStudent.graduationYear
                                            )}
                                        </strong>

                                    </div>

                                </div>

                            </div>


                            <div className="modal-section">

                                <div className="modal-section-heading">

                                    <div className="modal-section-icon skills">

                                        <FaCode />

                                    </div>

                                    <div>

                                        <h3>
                                            Skills & Expertise
                                        </h3>

                                        <p>
                                            Technical and professional skills
                                        </p>

                                    </div>

                                </div>


                                <div className="skills-box">

                                    {selectedStudent.skills ? (

                                        selectedStudent.skills
                                            .split(",")
                                            .map(
                                                (
                                                    skill,
                                                    index
                                                ) => {

                                                    const cleanSkill =
                                                        skill.trim();


                                                    if (
                                                        !cleanSkill
                                                    ) {
                                                        return null;
                                                    }


                                                    return (

                                                        <span
                                                            key={
                                                                `${cleanSkill}-${index}`
                                                            }
                                                        >
                                                            {cleanSkill}
                                                        </span>

                                                    );

                                                }
                                            )

                                    ) : (

                                        <p className="not-available-text">
                                            No skills have been added.
                                        </p>

                                    )}

                                </div>

                            </div>


                            <div className="modal-section">

                                <div className="modal-section-heading">

                                    <div className="modal-section-icon resume">

                                        <FaFilePdf />

                                    </div>

                                    <div>

                                        <h3>
                                            Resume
                                        </h3>

                                        <p>
                                            Student's uploaded resume
                                        </p>

                                    </div>

                                </div>


                                {hasResume(
                                    selectedStudent
                                ) ? (

                                    <a
                                        href={
                                            selectedStudent.resumeURL
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="modal-resume-btn"
                                    >

                                        <FaFilePdf />

                                        <span>
                                            View Resume
                                        </span>

                                        <FaExternalLinkAlt />

                                    </a>

                                ) : (

                                    <div className="resume-not-uploaded">
                                        Resume has not been uploaded.
                                    </div>

                                )}

                            </div>


                            <div className="modal-delete-area">

                                <button
                                    type="button"
                                    className="modal-delete-btn"
                                    disabled={
                                        deletingId ===
                                        selectedStudent.id
                                    }
                                    onClick={() =>
                                        deleteStudent(
                                            selectedStudent
                                        )
                                    }
                                >

                                    <FaTrash />

                                    {deletingId ===
                                    selectedStudent.id
                                        ? "Deleting Student & Applications..."
                                        : "Delete Student & Applications"}

                                </button>

                            </div>

                        </div>


                        <div className="modal-footer">

                            <div className="modal-footer-note">

                                <FaCheckCircle />

                                <span>
                                    Admin / TPO can view all student information.
                                </span>

                            </div>


                            <button
                                type="button"
                                className="modal-footer-close"
                                onClick={
                                    closeModal
                                }
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>

            )
            : null;


    /* =========================================================
       MAIN UI
    ========================================================= */

    return (

        <div className="manage-students-page">

            <div className="students-page-header">

                <div className="students-header-content">

                    <span className="page-label">
                        TPO / STUDENT MANAGEMENT
                    </span>

                    <h1>
                        Manage Students
                    </h1>

                    <p>
                        Manage active student accounts, academic
                        information, profiles and resumes.
                    </p>

                </div>


                <div className="student-total">

                    <span>
                        Active Students
                    </span>

                    <strong>
                        {students.length}
                    </strong>

                </div>

            </div>


            <div className="student-stat-grid">

                <div className="student-stat-card">

                    <div className="stat-icon blue">
                        <FaUsers />
                    </div>

                    <div>

                        <span>
                            Active Students
                        </span>

                        <strong>
                            {students.length}
                        </strong>

                    </div>

                </div>


                <div className="student-stat-card">

                    <div className="stat-icon green">
                        <FaCheckCircle />
                    </div>

                    <div>

                        <span>
                            Completed Profiles
                        </span>

                        <strong>
                            {completedProfiles}
                        </strong>

                    </div>

                </div>


                <div className="student-stat-card">

                    <div className="stat-icon purple">
                        <FaFilePdf />
                    </div>

                    <div>

                        <span>
                            Resumes
                        </span>

                        <strong>
                            {resumeCount}
                        </strong>

                    </div>

                </div>


                <div className="student-stat-card">

                    <div className="stat-icon orange">
                        <FaBuilding />
                    </div>

                    <div>

                        <span>
                            Departments
                        </span>

                        <strong>
                            {departments}
                        </strong>

                    </div>

                </div>

            </div>


            <div className="students-toolbar">

                <div className="student-search">

                    <FaSearch />

                    <input
                        type="text"
                        value={
                            search
                        }
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                        placeholder="Search active students by name, email, department..."
                    />


                    {search && (

                        <button
                            type="button"
                            className="clear-search"
                            onClick={() =>
                                setSearch("")
                            }
                            aria-label="Clear search"
                        >

                            <FaTimes />

                        </button>

                    )}

                </div>


                <div className="student-result-count">

                    Showing{" "}

                    <strong>
                        {filteredStudents.length}
                    </strong>

                    {" "}of{" "}

                    <strong>
                        {students.length}
                    </strong>

                </div>

            </div>


            <div className="students-table-card">

                <div className="students-table-scroll">

                    <table className="students-table">

                        <thead>

                            <tr>

                                <th>
                                    Student
                                </th>

                                <th>
                                    Contact
                                </th>

                                <th>
                                    Degree
                                </th>

                                <th>
                                    Department
                                </th>

                                <th>
                                    CGPA
                                </th>

                                <th>
                                    Profile
                                </th>

                                <th className="actions-column">
                                    Actions
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {filteredStudents.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="7"
                                        className="students-empty"
                                    >

                                        <div className="empty-icon">
                                            <FaUserCircle />
                                        </div>

                                        <h3>
                                            No active students found
                                        </h3>

                                        <p>
                                            Try changing your search.
                                        </p>

                                    </td>

                                </tr>

                            ) : (

                                filteredStudents.map(
                                    student => (

                                        <tr
                                            key={
                                                student.id
                                            }
                                        >

                                            <td>

                                                <div className="student-cell">

                                                    <div className="student-avatar">

                                                        {hasPhoto(
                                                            student
                                                        ) ? (

                                                            <img
                                                                src={
                                                                    student.profilePhotoURL
                                                                }
                                                                alt={
                                                                    getShortName(
                                                                        student.name
                                                                    )
                                                                }
                                                                className="student-profile-image"
                                                                onError={(event) => {

                                                                    event.currentTarget.style.display =
                                                                        "none";


                                                                    const fallback =
                                                                        event.currentTarget
                                                                            .parentElement
                                                                            ?.querySelector(
                                                                                ".avatar-fallback"
                                                                            );


                                                                    if (
                                                                        fallback
                                                                    ) {

                                                                        fallback.style.display =
                                                                            "flex";

                                                                    }

                                                                }}
                                                            />

                                                        ) : null}


                                                        <div
                                                            className="avatar-fallback"
                                                            style={{
                                                                display:
                                                                    hasPhoto(
                                                                        student
                                                                    )
                                                                        ? "none"
                                                                        : "flex"
                                                            }}
                                                        >

                                                            {getInitials(
                                                                student.name
                                                            )}

                                                        </div>

                                                    </div>


                                                    <div className="student-name-block">

                                                        <strong
                                                            title={
                                                                student.name
                                                            }
                                                        >
                                                            {getShortName(
                                                                student.name
                                                            )}
                                                        </strong>


                                                        <span
                                                            title={
                                                                student.email
                                                            }
                                                        >
                                                            {displayValue(
                                                                student.email
                                                            )}
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>


                                            <td>

                                                <div className="contact-cell">

                                                    <span>

                                                        <FaEnvelope />

                                                        {displayValue(
                                                            student.email
                                                        )}

                                                    </span>


                                                    <span>

                                                        <FaPhone />

                                                        {displayValue(
                                                            student.phone
                                                        )}

                                                    </span>

                                                </div>

                                            </td>


                                            <td>

                                                <span className="table-primary-text">

                                                    {displayValue(
                                                        student.degree
                                                    )}

                                                </span>

                                            </td>


                                            <td>

                                                <span
                                                    className="department-text"
                                                    title={
                                                        student.department
                                                    }
                                                >

                                                    {displayValue(
                                                        student.department
                                                    )}

                                                </span>

                                            </td>


                                            <td>

                                                <span className="cgpa-badge">

                                                    {student.cgpa
                                                        ? `${student.cgpa} / 10`
                                                        : "N/A"}

                                                </span>

                                            </td>


                                            <td>

                                                {student.profileCompleted ? (

                                                    <span className="status-badge completed">

                                                        <FaCheckCircle />

                                                        Complete

                                                    </span>

                                                ) : (

                                                    <span className="status-badge incomplete">

                                                        Incomplete

                                                    </span>

                                                )}

                                            </td>


                                            <td>

                                                <div className="student-actions">

                                                    <button
                                                        type="button"
                                                        className="view-student-btn"
                                                        onClick={() =>
                                                            viewStudent(
                                                                student
                                                            )
                                                        }
                                                    >

                                                        <FaEye />

                                                        <span>
                                                            View
                                                        </span>

                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="delete-student-btn"
                                                        disabled={
                                                            deletingId ===
                                                            student.id
                                                        }
                                                        onClick={() =>
                                                            deleteStudent(
                                                                student
                                                            )
                                                        }
                                                    >

                                                        <FaTrash />

                                                        <span>

                                                            {deletingId ===
                                                            student.id
                                                                ? "Deleting..."
                                                                : "Delete"}

                                                        </span>

                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>

            </div>


            {studentModal &&
                createPortal(
                    studentModal,
                    document.body
                )}

        </div>

    );

}


export default ManageStudents;