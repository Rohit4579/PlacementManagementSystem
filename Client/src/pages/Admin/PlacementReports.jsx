import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    collection,
    getDocs
} from "firebase/firestore";

import * as XLSX from "xlsx";

import {
    FaBriefcase,
    FaUsers,
    FaUserCheck,
    FaGraduationCap,
    FaChartLine,
    FaBuilding,
    FaCheckCircle,
    FaSearch,
    FaCopy,
    FaSyncAlt,
    FaPhone,
    FaEnvelope,
    FaUniversity,
    FaTimes,
    FaMapMarkerAlt,
    FaChevronDown,
    FaFileExcel
} from "react-icons/fa";

import {
    db
} from "../../firebase/firebaseConfig";

import "./PlacementReports.css";


/* =====================================================
   PROFILE AVATAR COMPONENT
===================================================== */

/*
 * This component handles:
 *
 * 1. Valid profile photo
 * 2. Broken profile photo
 * 3. No profile photo
 *
 * If image loading fails, initials are automatically shown.
 */

function StudentAvatar({
    photo,
    name,
    initials
}) {

    const [imageError, setImageError] =
        useState(false);

    /*
     * If photo changes for another student,
     * reset the error state.
     */

    useEffect(() => {

        setImageError(false);

    }, [photo]);


    /*
     * No photo OR broken photo
     * => initials.
     */

    if (
        !photo ||
        imageError
    ) {

        return (

            <div className="report-avatar report-avatar-fallback">

                {initials}

            </div>

        );

    }


    return (

        <img
            className="report-avatar report-avatar-photo"
            src={photo}
            alt={name || "Student"}
            loading="lazy"

            /*
             * Broken Firebase Storage URL,
             * deleted image, invalid URL, etc.
             */

            onError={() => {

                setImageError(true);

            }}
        />

    );

}


/* =====================================================
   MAIN COMPONENT
===================================================== */

function PlacementReports() {


    /* =====================================================
       STATE
    ===================================================== */

    const [loading, setLoading] =
        useState(true);

    const [students, setStudents] =
        useState([]);

    const [companies, setCompanies] =
        useState([]);

    const [jobs, setJobs] =
        useState([]);

    const [applications, setApplications] =
        useState([]);

    const [search, setSearch] =
        useState("");

    const [companyFilter, setCompanyFilter] =
        useState("all");

    const [jobFilter, setJobFilter] =
        useState("all");

    const [recordFilter, setRecordFilter] =
        useState("all");

    const [copyMessage, setCopyMessage] =
        useState("");

    const [error, setError] =
        useState("");


    /* =====================================================
       LOAD DATA
    ===================================================== */

    useEffect(() => {

        loadPlacementData();

    }, []);


    const loadPlacementData = async () => {

        try {

            setLoading(true);

            setError("");


            const [
                usersSnapshot,
                jobsSnapshot,
                applicationsSnapshot,
                profilesSnapshot
            ] = await Promise.all([

                getDocs(
                    collection(
                        db,
                        "users"
                    )
                ),

                getDocs(
                    collection(
                        db,
                        "jobs"
                    )
                ),

                getDocs(
                    collection(
                        db,
                        "applications"
                    )
                ),

                getDocs(
                    collection(
                        db,
                        "studentProfiles"
                    )
                )

            ]);


            /* =============================================
               USERS
            ============================================= */

            const usersData =
                usersSnapshot.docs.map(
                    document => ({

                        id:
                            document.id,

                        ...document.data()

                    })
                );


            /* =============================================
               JOBS
            ============================================= */

            const jobsData =
                jobsSnapshot.docs.map(
                    document => ({

                        id:
                            document.id,

                        ...document.data()

                    })
                );


            /* =============================================
               APPLICATIONS
            ============================================= */

            const applicationsData =
                applicationsSnapshot.docs.map(
                    document => ({

                        id:
                            document.id,

                        ...document.data()

                    })
                );


            /* =============================================
               STUDENT PROFILES
            ============================================= */

            const profilesData =
                profilesSnapshot.docs.map(
                    document => ({

                        id:
                            document.id,

                        ...document.data()

                    })
                );


            /* =============================================
               STUDENTS
            ============================================= */

            const studentData =
                usersData.filter(
                    user =>

                        String(
                            user.role || ""
                        )
                            .toLowerCase() ===
                        "student"

                );


            /* =============================================
               COMPANIES
            ============================================= */

            const companyData =
                usersData.filter(
                    user =>

                        String(
                            user.role || ""
                        )
                            .toLowerCase() ===
                        "company"

                );


            /*
             * Create lookup maps.
             *
             * This is faster and more reliable than
             * repeatedly using Array.find().
             */

            const userMap =
                new Map();

            usersData.forEach(
                user => {

                    const possibleIds = [

                        user.id,

                        user.uid,

                        user.userId,

                        user.studentId,

                        user.studentID

                    ];


                    possibleIds
                        .filter(Boolean)
                        .forEach(
                            id => {

                                userMap.set(
                                    String(id),
                                    user
                                );

                            }
                        );

                }
            );


            const profileMap =
                new Map();

            profilesData.forEach(
                profile => {

                    const possibleIds = [

                        profile.id,

                        profile.uid,

                        profile.userId,

                        profile.studentId,

                        profile.studentID

                    ];


                    possibleIds
                        .filter(Boolean)
                        .forEach(
                            id => {

                                profileMap.set(
                                    String(id),
                                    profile
                                );

                            }
                        );

                }
            );


            const jobMap =
                new Map();

            jobsData.forEach(
                job => {

                    jobMap.set(
                        String(job.id),
                        job
                    );

                    if (
                        job.uid
                    ) {

                        jobMap.set(
                            String(job.uid),
                            job
                        );

                    }

                    if (
                        job.jobId
                    ) {

                        jobMap.set(
                            String(job.jobId),
                            job
                        );

                    }

                }
            );


            /* =============================================
               ENRICH APPLICATIONS
            ============================================= */

            const enrichedApplications =
                applicationsData.map(
                    application => {

                        const studentId =

                            application.studentId ||

                            application.studentID ||

                            application.studentUid ||

                            application.studentUID ||

                            application.uid ||

                            application.userId ||

                            application.userId ||

                            "";


                        const jobId =

                            application.jobId ||

                            application.jobID ||

                            application.jobUid ||

                            application.jobUID ||

                            "";


                        /*
                         * Find student profile.
                         */

                        const profile =
                            profileMap.get(
                                String(
                                    studentId
                                )
                            ) || null;


                        /*
                         * Find user.
                         */

                        const user =
                            userMap.get(
                                String(
                                    studentId
                                )
                            ) || null;


                        /*
                         * Find job.
                         */

                        const job =
                            jobMap.get(
                                String(
                                    jobId
                                )
                            ) || null;


                        return {

                            ...application,

                            _profile:
                                profile,

                            _user:
                                user,

                            _job:
                                job,

                            _studentId:
                                studentId,

                            _jobId:
                                jobId

                        };

                    }
                );


            setStudents(
                studentData
            );

            setCompanies(
                companyData
            );

            setJobs(
                jobsData
            );

            setApplications(
                enrichedApplications
            );

        }

        catch (loadError) {

            console.error(
                "Placement Reports Error:",
                loadError
            );

            setError(
                "Unable to load placement reports."
            );

        }

        finally {

            setLoading(false);

        }

    };


    /* =====================================================
       HELPERS
    ===================================================== */

    const getFirstValue = (
        object,
        fields,
        fallback = "Not Available"
    ) => {

        if (!object) {

            return fallback;

        }


        for (
            const field of fields
        ) {

            const value =
                object[field];


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


    /* =====================================================
       PROFILE PHOTO FIELDS
    ===================================================== */

    const PHOTO_FIELDS = [

        /*
         * Firebase Auth / common
         */

        "photoURL",

        "photoUrl",

        "photoURL",

        /*
         * Profile photo
         */

        "photo",

        "profilePhoto",

        "profile_photo",

        "profileImage",

        "profile_image",

        "profilePicture",

        "profilePictureUrl",

        "profilePictureURL",

        /*
         * Image
         */

        "image",

        "imageUrl",

        "imageURL",

        /*
         * Avatar
         */

        "avatar",

        "avatarUrl",

        "avatarURL",

        /*
         * Picture
         */

        "picture",

        "pictureUrl",

        "pictureURL",

        /*
         * Firebase Storage style fields
         */

        "downloadURL",

        "downloadUrl",

        "profilePhotoUrl",

        "profilePhotoURL",

        "studentPhoto",

        "studentPhotoUrl",

        "studentPhotoURL"

    ];


    /* =====================================================
       GET PROFILE PHOTO
    ===================================================== */

    const getProfilePhoto = (
        profile,
        user,
        application
    ) => {

        /*
         * -----------------------------------------------
         * 1. STUDENT PROFILE
         * -----------------------------------------------
         */

        const profilePhoto =
            getFirstValue(
                profile,
                PHOTO_FIELDS,
                ""
            );


        if (
            profilePhoto &&
            profilePhoto !== "Not Available"
        ) {

            return String(
                profilePhoto
            ).trim();

        }


        /*
         * -----------------------------------------------
         * 2. USERS
         * -----------------------------------------------
         */

        const userPhoto =
            getFirstValue(
                user,
                PHOTO_FIELDS,
                ""
            );


        if (
            userPhoto &&
            userPhoto !== "Not Available"
        ) {

            return String(
                userPhoto
            ).trim();

        }


        /*
         * -----------------------------------------------
         * 3. APPLICATION
         * -----------------------------------------------
         */

        const applicationPhoto =
            getFirstValue(
                application,
                PHOTO_FIELDS,
                ""
            );


        if (
            applicationPhoto &&
            applicationPhoto !== "Not Available"
        ) {

            return String(
                applicationPhoto
            ).trim();

        }


        return "";

    };


    /* =====================================================
       INITIALS
    ===================================================== */

    const getStudentInitials = (
        name
    ) => {

        const cleanName =
            String(
                name || ""
            )
                .trim()
                .replace(
                    /\s+/g,
                    " "
                );


        if (!cleanName) {

            return "S";

        }


        const words =
            cleanName.split(" ");


        if (
            words.length === 1
        ) {

            return words[0]
                .charAt(0)
                .toUpperCase();

        }


        return (

            words[0]
                .charAt(0) +

            words[
                words.length - 1
            ]
                .charAt(0)

        ).toUpperCase();

    };


    /* =====================================================
       DATE
    ===================================================== */

    const getDateValue = (
        value
    ) => {

        if (!value) {

            return 0;

        }


        if (
            typeof value.toDate ===
            "function"
        ) {

            return value
                .toDate()
                .getTime();

        }


        if (
            typeof value === "object" &&
            value.seconds !== undefined
        ) {

            return (
                Number(
                    value.seconds
                ) * 1000
            );

        }


        const date =
            new Date(value);


        return isNaN(
            date.getTime()
        )

            ? 0

            : date.getTime();

    };


    const formatDate = (
        value
    ) => {

        const timestamp =
            getDateValue(
                value
            );


        if (!timestamp) {

            return "—";

        }


        return new Date(
            timestamp
        ).toLocaleDateString(
            "en-IN",
            {

                day: "2-digit",

                month: "short",

                year: "numeric"

            }
        );

    };


    const getExcelDate = (
        value
    ) => {

        const timestamp =
            getDateValue(
                value
            );


        if (!timestamp) {

            return null;

        }


        return new Date(
            timestamp
        );

    };


    /* =====================================================
       PHONE
    ===================================================== */

    const formatPhone = (
        value
    ) => {

        if (
            value === undefined ||
            value === null ||
            String(value).trim() === ""
        ) {

            return "Not Available";

        }


        return String(value);

    };


    /* =====================================================
       NORMALIZE
    ===================================================== */

    const normalize = (
        value
    ) => {

        return String(
            value || ""
        )
            .trim()
            .toLowerCase();

    };


    /* =====================================================
       STATUS
    ===================================================== */

    const isSelectedApplication =
        application => {

            const status =
                normalize(
                    application.status
                );


            return (

                status === "accepted" ||

                status === "selected" ||

                status === "placed"

            );

        };


    const isPlacedApplication =
        application => {

            const status =
                normalize(
                    application.status
                );


            return (

                application.placedStudent === true ||

                application.isPlaced === true ||

                status === "placed"

            );

        };


    const isSelectedOnlyApplication =
        application => {

            return (

                isSelectedApplication(
                    application
                ) &&

                !isPlacedApplication(
                    application
                )

            );

        };


    /* =====================================================
       BUILD STUDENT RECORD
    ===================================================== */

    const buildStudentRecord =
        application => {

            const profile =
                application._profile;

            const user =
                application._user;

            const job =
                application._job;


            /* =============================================
               STUDENT NAME
            ============================================= */

            const studentName =

                application.studentName ||

                application.student ||

                application.name ||

                getFirstValue(
                    profile,
                    [
                        "studentName",
                        "name",
                        "fullName",
                        "displayName"
                    ],
                    getFirstValue(
                        user,
                        [
                            "name",
                            "fullName",
                            "displayName"
                        ],
                        "Student"
                    )
                );


            /* =============================================
               EMAIL
            ============================================= */

            const email =

                application.studentEmail ||

                application.email ||

                getFirstValue(
                    profile,
                    [
                        "email",
                        "studentEmail",
                        "emailAddress"
                    ],
                    getFirstValue(
                        user,
                        [
                            "email"
                        ],
                        "Not Available"
                    )
                );


            /* =============================================
               PHONE
            ============================================= */

            const phone =

                application.phone ||

                application.mobile ||

                application.mobileNumber ||

                getFirstValue(
                    profile,
                    [
                        "phone",
                        "mobile",
                        "mobileNumber",
                        "phoneNumber",
                        "contactNumber"
                    ],
                    getFirstValue(
                        user,
                        [
                            "phone",
                            "mobile",
                            "phoneNumber",
                            "mobileNumber"
                        ],
                        "Not Available"
                    )
                );


            /* =============================================
               COLLEGE
            ============================================= */

            const college =

                application.college ||

                application.collegeName ||

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
                    ]
                );


            /* =============================================
               DEGREE
            ============================================= */

            const degree =

                application.degree ||

                application.course ||

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
                    ]
                );


            /* =============================================
               DEPARTMENT
            ============================================= */

            const department =

                application.department ||

                application.branch ||

                getFirstValue(
                    profile,
                    [
                        "department",
                        "branch",
                        "stream",
                        "specialization"
                    ]
                );


            /* =============================================
               JOB TITLE
            ============================================= */

            const jobTitle =

                application.jobTitle ||

                application.jobName ||

                application.title ||

                job?.jobTitle ||

                job?.jobName ||

                job?.title ||

                job?.position ||

                job?.role ||

                "Job Not Available";


            /* =============================================
               COMPANY
            ============================================= */

            const companyName =

                application.companyName ||

                application.company ||

                job?.companyName ||

                job?.company ||

                getFirstValue(
                    job,
                    [
                        "companyName",
                        "company",
                        "company_name"
                    ],
                    "Company"
                );


            /* =============================================
               COMPANY ID
            ============================================= */

            const companyId =

                application.companyId ||

                application.companyID ||

                job?.companyId ||

                job?.companyID ||

                "";


            /* =============================================
               PACKAGE
            ============================================= */

            const packageValue =

                application.salary ||

                application.package ||

                application.salaryPackage ||

                application.ctc ||

                job?.salary ||

                job?.package ||

                job?.salaryPackage ||

                job?.ctc ||

                "Not Specified";


            /* =============================================
               LOCATION
            ============================================= */

            const location =

                application.location ||

                application.jobLocation ||

                job?.location ||

                "Not Specified";


            /* =============================================
               DATES
            ============================================= */

            const selectedDate =

                application.statusUpdatedAt ||

                application.selectedAt ||

                application.selectedDate ||

                application.updatedAt ||

                application.appliedAt ||

                application.createdAt ||

                null;


            const placedDate =

                application.placedAt ||

                application.placementDate ||

                application.placedOn ||

                (
                    isPlacedApplication(
                        application
                    )
                        ? application.updatedAt
                        : null
                );


            /* =============================================
               STATUS
            ============================================= */

            const selected =
                isSelectedApplication(
                    application
                );


            const placed =
                isPlacedApplication(
                    application
                );


            /* =============================================
               PROFILE PHOTO
            ============================================= */

            const profilePhoto =
                getProfilePhoto(
                    profile,
                    user,
                    application
                );


            /* =============================================
               INITIALS
            ============================================= */

            const studentInitials =
                getStudentInitials(
                    studentName
                );


            return {

                ...application,

                studentName,

                studentInitials,

                email,

                phone:
                    formatPhone(
                        phone
                    ),

                college,

                degree,

                department,

                jobTitle,

                companyName,

                companyId,

                packageValue,

                location,

                selectedDate,

                placedDate,

                profilePhoto,

                isSelected:
                    selected,

                isPlaced:
                    placed

            };

        };


    /* =====================================================
       PROCESSED APPLICATIONS
    ===================================================== */

    const processedApplications =
        useMemo(
            () => {

                return applications.map(
                    buildStudentRecord
                );

            },
            [
                applications
            ]
        );


    /* =====================================================
       COMPANY OPTIONS
    ===================================================== */

    const companyOptions =
        useMemo(
            () => {

                const map =
                    new Map();


                processedApplications.forEach(
                    record => {

                        const companyKey =

                            record.companyId ||

                            record._job?.companyId ||

                            normalize(
                                record.companyName
                            );


                        if (
                            !map.has(
                                companyKey
                            )
                        ) {

                            map.set(
                                companyKey,
                                {

                                    id:
                                        companyKey,

                                    name:
                                        record.companyName

                                }
                            );

                        }

                    }
                );


                return Array.from(
                    map.values()
                )
                    .sort(
                        (a, b) =>

                            a.name.localeCompare(
                                b.name
                            )
                    );

            },
            [
                processedApplications
            ]
        );


    /* =====================================================
       JOB OPTIONS
    ===================================================== */

    const availableJobs =
        useMemo(
            () => {

                let records =
                    processedApplications;


                if (
                    companyFilter !== "all"
                ) {

                    records =
                        records.filter(
                            record => {

                                const companyKey =

                                    record.companyId ||

                                    record._job?.companyId ||

                                    normalize(
                                        record.companyName
                                    );


                                return (

                                    String(
                                        companyKey
                                    ) ===

                                    String(
                                        companyFilter
                                    )

                                );

                            }
                        );

                }


                const map =
                    new Map();


                records.forEach(
                    record => {

                        const jobId =

                            record._jobId ||

                            record.jobId ||

                            record.jobID ||

                            record._job?.id ||

                            normalize(
                                `${record.companyName}-${record.jobTitle}`
                            );


                        if (
                            !map.has(
                                jobId
                            )
                        ) {

                            map.set(
                                jobId,
                                {

                                    id:
                                        jobId,

                                    title:
                                        record.jobTitle,

                                    companyName:
                                        record.companyName,

                                    packageValue:
                                        record.packageValue,

                                    location:
                                        record.location

                                }
                            );

                        }

                    }
                );


                return Array.from(
                    map.values()
                )
                    .sort(
                        (a, b) =>

                            a.title.localeCompare(
                                b.title
                            )
                    );

            },
            [
                processedApplications,
                companyFilter
            ]
        );


    /* =====================================================
       RESET JOB FILTER
    ===================================================== */

    useEffect(
        () => {

            setJobFilter(
                "all"
            );

        },
        [
            companyFilter
        ]
    );


    /* =====================================================
       OPPORTUNITY RECORDS
    ===================================================== */

    const opportunityApplications =
        useMemo(
            () => {

                let records =
                    processedApplications;


                if (
                    companyFilter !== "all"
                ) {

                    records =
                        records.filter(
                            record => {

                                const companyKey =

                                    record.companyId ||

                                    record._job?.companyId ||

                                    normalize(
                                        record.companyName
                                    );


                                return (

                                    String(
                                        companyKey
                                    ) ===

                                    String(
                                        companyFilter
                                    )

                                );

                            }
                        );

                }


                if (
                    jobFilter !== "all"
                ) {

                    records =
                        records.filter(
                            record => {

                                const applicationJobId =

                                    record._jobId ||

                                    record.jobId ||

                                    record.jobID ||

                                    record._job?.id ||

                                    "";


                                return (

                                    String(
                                        applicationJobId
                                    ) ===

                                    String(
                                        jobFilter
                                    )

                                );

                            }
                        );

                }


                return records;

            },
            [
                processedApplications,
                companyFilter,
                jobFilter
            ]
        );


    /* =====================================================
       STATUS COUNTS
    ===================================================== */

    const allOpportunityRecords =
        opportunityApplications;


    const selectedOpportunityRecords =
        useMemo(
            () => {

                return allOpportunityRecords
                    .filter(
                        isSelectedApplication
                    );

            },
            [
                allOpportunityRecords
            ]
        );


    const placedOpportunityRecords =
        useMemo(
            () => {

                return allOpportunityRecords
                    .filter(
                        isPlacedApplication
                    );

            },
            [
                allOpportunityRecords
            ]
        );


    const selectedOnlyOpportunityRecords =
        useMemo(
            () => {

                return allOpportunityRecords
                    .filter(
                        isSelectedOnlyApplication
                    );

            },
            [
                allOpportunityRecords
            ]
        );


    /* =====================================================
       FILTERED RECORDS
    ===================================================== */

    const filteredRecords =
        useMemo(
            () => {

                let records =
                    allOpportunityRecords;


                if (
                    recordFilter ===
                    "selected"
                ) {

                    records =
                        records.filter(
                            isSelectedOnlyApplication
                        );

                }


                if (
                    recordFilter ===
                    "placed"
                ) {

                    records =
                        records.filter(
                            isPlacedApplication
                        );

                }


                const searchText =
                    search
                        .trim()
                        .toLowerCase();


                if (!searchText) {

                    return records;

                }


                return records.filter(
                    record => {

                        const searchable = [

                            record.studentName,

                            record.email,

                            record.phone,

                            record.college,

                            record.degree,

                            record.department,

                            record.companyName,

                            record.jobTitle,

                            record.packageValue,

                            record.location,

                            record.status

                        ]
                            .map(
                                value =>

                                    String(
                                        value || ""
                                    )
                                        .toLowerCase()
                            )
                            .join(" ");


                        return searchable.includes(
                            searchText
                        );

                    }
                );

            },
            [
                allOpportunityRecords,
                recordFilter,
                search
            ]
        );


    /* =====================================================
       UNIQUE COUNTS
    ===================================================== */

    const uniqueSelectedStudents =
        useMemo(
            () => {

                return new Set(

                    selectedOpportunityRecords.map(
                        record =>

                            record._studentId ||

                            record.studentId ||

                            record.id

                    )

                ).size;

            },
            [
                selectedOpportunityRecords
            ]
        );


    const uniquePlacedStudents =
        useMemo(
            () => {

                return new Set(

                    placedOpportunityRecords.map(
                        record =>

                            record._studentId ||

                            record.studentId ||

                            record.id

                    )

                ).size;

            },
            [
                placedOpportunityRecords
            ]
        );


    const totalApplications =
        applications.length;


    const totalStudents =
        students.length;


    const totalCompanies =
        companies.length;


    const totalJobs =
        jobs.length;


    const placementPercentage =
        uniqueSelectedStudents > 0

            ? (

                (
                    uniquePlacedStudents /
                    uniqueSelectedStudents
                ) * 100

            ).toFixed(1)

            : "0.0";


    /* =====================================================
       CURRENT OPPORTUNITY
    ===================================================== */

    const selectedJob =
        availableJobs.find(
            job =>

                String(job.id) ===
                String(jobFilter)

        );


    const selectedCompany =
        companyOptions.find(
            company =>

                String(company.id) ===
                String(companyFilter)

        );


    /* =====================================================
       WHATSAPP
    ===================================================== */

    const createWhatsAppText =
        (
            records,
            title
        ) => {

            if (!records.length) {

                return (

                    `${title}\n\n` +
                    "No records available."

                );

            }


            let text =
                `*${title}*\n`;

            text +=
                "━━━━━━━━━━━━━━━━━━━━\n\n";


            if (
                selectedCompany
            ) {

                text +=
                    `Company: ${selectedCompany.name}\n`;

            }


            if (
                selectedJob
            ) {

                text +=
                    `Role: ${selectedJob.title}\n`;

            }


            text += "\n";


            records.forEach(
                (
                    student,
                    index
                ) => {

                    text +=
                        `*${index + 1}. ${student.studentName}*\n`;

                    text +=
                        `Company: ${student.companyName}\n`;

                    text +=
                        `Role: ${student.jobTitle}\n`;

                    text +=
                        `Package: ${student.packageValue}\n`;

                    text +=
                        `College: ${student.college}\n`;

                    text +=
                        `Degree: ${student.degree}\n`;

                    text +=
                        `Department: ${student.department}\n`;

                    text +=
                        `Email: ${student.email}\n`;

                    text +=
                        `Phone: ${student.phone}\n`;

                    text +=
                        `Location: ${student.location}\n`;

                    text +=
                        `Selected: ${formatDate(
                            student.selectedDate
                        )}\n`;

                    text +=
                        `Placed: ${
                            student.isPlaced

                                ? formatDate(
                                    student.placedDate
                                )

                                : "—"
                        }\n`;

                    text +=
                        `Status: ${
                            student.isPlaced
                                ? "PLACED"
                                : "SELECTED"
                        }\n\n`;

                }
            );


            return text;

        };


    const copyForWhatsApp =
        async (
            records,
            title
        ) => {

            try {

                const text =
                    createWhatsAppText(
                        records,
                        title
                    );


                await navigator
                    .clipboard
                    .writeText(
                        text
                    );


                setCopyMessage(
                    `${title} copied successfully.`
                );


                setTimeout(
                    () => {

                        setCopyMessage(
                            ""
                        );

                    },
                    3000
                );

            }

            catch (copyError) {

                console.error(
                    copyError
                );

                setCopyMessage(
                    "Unable to copy records."
                );

            }

        };


    /* =====================================================
       EXCEL EXPORT
    ===================================================== */

    const exportExcel =
        (
            records,
            filename,
            exportStatus
        ) => {

            if (!records.length) {

                setCopyMessage(
                    "No records available for export."
                );


                setTimeout(
                    () => {

                        setCopyMessage(
                            ""
                        );

                    },
                    2500
                );


                return;

            }


            const exportRows =
                records.map(
                    student => ({

                        "Student Name":
                            student.studentName,

                        "Email":
                            student.email,

                        "Phone":
                            `'${formatPhone(
                                student.phone
                            )}`,

                        "College":
                            student.college,

                        "Degree":
                            student.degree,

                        "Department":
                            student.department,

                        "Company":
                            student.companyName,

                        "Job / Role":
                            student.jobTitle,

                        "Package":
                            student.packageValue,

                        "Location":
                            student.location,

                        "Selected Date":
                            getExcelDate(
                                student.selectedDate
                            ),

                        "Placed Date":
                            student.isPlaced

                                ? getExcelDate(
                                    student.placedDate
                                )

                                : null,

                        "Status":
                            exportStatus

                    })
                );


            const worksheet =
                XLSX.utils.json_to_sheet(
                    exportRows
                );


            worksheet["!cols"] = [

                { wch: 24 },

                { wch: 34 },

                { wch: 18 },

                { wch: 42 },

                { wch: 18 },

                { wch: 28 },

                { wch: 24 },

                { wch: 32 },

                { wch: 18 },

                { wch: 22 },

                { wch: 18 },

                { wch: 18 },

                { wch: 15 }

            ];


            const range =
                XLSX.utils.decode_range(
                    worksheet["!ref"]
                );


            for (
                let rowIndex =
                    range.s.r;

                rowIndex <=
                range.e.r;

                rowIndex++
            ) {

                for (
                    let colIndex =
                        range.s.c;

                    colIndex <=
                    range.e.c;

                    colIndex++
                ) {

                    const address =
                        XLSX.utils.encode_cell({
                            r:
                                rowIndex,

                            c:
                                colIndex
                        });


                    if (
                        !worksheet[address]
                    ) {

                        continue;

                    }


                    worksheet[address].s = {

                        alignment: {

                            vertical:
                                "top",

                            wrapText:
                                true

                        }

                    };

                }

            }


            for (
                let rowIndex = 1;

                rowIndex <=
                exportRows.length;

                rowIndex++
            ) {

                const selectedCell =
                    worksheet[
                        `K${rowIndex + 1}`
                    ];


                const placedCell =
                    worksheet[
                        `L${rowIndex + 1}`
                    ];


                if (
                    selectedCell &&
                    selectedCell.v instanceof Date
                ) {

                    selectedCell.t =
                        "d";

                    selectedCell.z =
                        "dd-mmm-yyyy";

                }


                if (
                    placedCell &&
                    placedCell.v instanceof Date
                ) {

                    placedCell.t =
                        "d";

                    placedCell.z =
                        "dd-mmm-yyyy";

                }

            }


            for (
                let rowIndex = 1;

                rowIndex <=
                exportRows.length;

                rowIndex++
            ) {

                const phoneCell =
                    worksheet[
                        `C${rowIndex + 1}`
                    ];


                if (phoneCell) {

                    phoneCell.t =
                        "s";

                }

            }


            const workbook =
                XLSX.utils.book_new();


            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Students"
            );


            XLSX.writeFile(
                workbook,
                filename
            );


            setCopyMessage(
                `${exportStatus} student Excel exported successfully.`
            );


            setTimeout(
                () => {

                    setCopyMessage(
                        ""
                    );

                },
                3000
            );

        };


    /* =====================================================
       COMPANY-WISE DATA
    ===================================================== */

    const companyPlacementData =
        useMemo(
            () => {

                const map = {};


                processedApplications.forEach(
                    application => {

                        if (

                            !isSelectedApplication(
                                application
                            ) &&

                            !isPlacedApplication(
                                application
                            )

                        ) {

                            return;

                        }


                        const companyKey =

                            application.companyId ||

                            normalize(
                                application.companyName
                            );


                        if (
                            !map[companyKey]
                        ) {

                            map[companyKey] = {

                                companyId:
                                    companyKey,

                                companyName:
                                    application.companyName,

                                selectedIds:
                                    new Set(),

                                placedIds:
                                    new Set()

                            };

                        }


                        const studentId =

                            application._studentId ||

                            application.studentId ||

                            application.id;


                        if (
                            isSelectedApplication(
                                application
                            )
                        ) {

                            map[
                                companyKey
                            ]
                                .selectedIds
                                .add(
                                    studentId
                                );

                        }


                        if (
                            isPlacedApplication(
                                application
                            )
                        ) {

                            map[
                                companyKey
                            ]
                                .placedIds
                                .add(
                                    studentId
                                );

                        }

                    }
                );


                return Object.values(
                    map
                )
                    .map(
                        company => ({

                            companyId:
                                company.companyId,

                            companyName:
                                company.companyName,

                            selected:
                                company.selectedIds.size,

                            placed:
                                company.placedIds.size

                        })
                    )
                    .sort(
                        (a, b) =>

                            b.selected -
                            a.selected
                    );

            },
            [
                processedApplications
            ]
        );


    /* =====================================================
       JOB-WISE DATA
    ===================================================== */

    const jobApplicationData =
        useMemo(
            () => {

                const map = {};


                processedApplications.forEach(
                    application => {

                        const jobId =

                            application.jobId ||

                            application.jobID ||

                            application._jobId ||

                            "unknown";


                        const job =
                            application._job;


                        const jobTitle =

                            application.jobTitle ||

                            application.jobName ||

                            application.title ||

                            job?.jobTitle ||

                            job?.jobName ||

                            job?.title ||

                            "Job";


                        const companyName =

                            application.companyName ||

                            application.company ||

                            job?.companyName ||

                            job?.company ||

                            "Company";


                        if (
                            !map[jobId]
                        ) {

                            map[jobId] = {

                                jobId,

                                jobTitle,

                                companyName,

                                applications:
                                    0,

                                selectedIds:
                                    new Set(),

                                placedIds:
                                    new Set()

                            };

                        }


                        map[jobId]
                            .applications +=
                            1;


                        const studentId =

                            application._studentId ||

                            application.studentId ||

                            application.id;


                        if (
                            isSelectedApplication(
                                application
                            )
                        ) {

                            map[jobId]
                                .selectedIds
                                .add(
                                    studentId
                                );

                        }


                        if (
                            isPlacedApplication(
                                application
                            )
                        ) {

                            map[jobId]
                                .placedIds
                                .add(
                                    studentId
                                );

                        }

                    }
                );


                return Object.values(
                    map
                )
                    .map(
                        job => ({

                            jobId:
                                job.jobId,

                            jobTitle:
                                job.jobTitle,

                            companyName:
                                job.companyName,

                            applications:
                                job.applications,

                            selected:
                                job.selectedIds.size,

                            placed:
                                job.placedIds.size

                        })
                    )
                    .sort(
                        (a, b) =>

                            b.applications -
                            a.applications
                    );

            },
            [
                processedApplications
            ]
        );


    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {

        return (

            <div className="placement-reports-page">

                <div className="reports-loading">

                    <div className="loading-spinner"></div>

                    <h2>
                        Loading Placement Reports...
                    </h2>

                    <p>
                        Fetching students,
                        companies, jobs and
                        recruitment records.
                    </p>

                </div>

            </div>

        );

    }


    /* =====================================================
       ERROR
    ===================================================== */

    if (error) {

        return (

            <div className="placement-reports-page">

                <div className="reports-error">

                    <div className="error-icon">
                        ⚠️
                    </div>

                    <h2>
                        Unable to load reports
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        className="refresh-button"
                        onClick={
                            loadPlacementData
                        }
                    >

                        <FaSyncAlt />

                        Try Again

                    </button>

                </div>

            </div>

        );

    }


    /* =====================================================
       PAGE
    ===================================================== */

    return (

        <div className="placement-reports-page">


            {/* =============================================
                HEADER
            ============================================= */}

            <div className="reports-header">

                <div>

                    <div className="reports-label">
                        ADMIN / TPO
                    </div>

                    <h1>
                        Placement Reports
                    </h1>

                    <p className="reports-subtitle">

                        Select a company and a
                        specific recruitment role
                        to prepare accurate
                        selected and placed
                        student lists.

                    </p>

                </div>


                <button
                    className="refresh-button"
                    onClick={
                        loadPlacementData
                    }
                >

                    <FaSyncAlt />

                    Refresh Reports

                </button>

            </div>


            {/* =============================================
                MESSAGE
            ============================================= */}

            {copyMessage && (

                <div className="copy-message">

                    <FaCheckCircle />

                    {copyMessage}

                </div>

            )}


            {/* =============================================
                OVERVIEW
            ============================================= */}

            <div className="report-stats">

                <div className="report-stat-card">

                    <div className="stat-icon blue">
                        <FaGraduationCap />
                    </div>

                    <div>

                        <span>
                            Total Students
                        </span>

                        <strong>
                            {totalStudents}
                        </strong>

                    </div>

                </div>


                <div className="report-stat-card">

                    <div className="stat-icon purple">
                        <FaBuilding />
                    </div>

                    <div>

                        <span>
                            Companies
                        </span>

                        <strong>
                            {totalCompanies}
                        </strong>

                    </div>

                </div>


                <div className="report-stat-card">

                    <div className="stat-icon orange">
                        <FaBriefcase />
                    </div>

                    <div>

                        <span>
                            Jobs / Roles
                        </span>

                        <strong>
                            {totalJobs}
                        </strong>

                    </div>

                </div>


                <div className="report-stat-card">

                    <div className="stat-icon indigo">
                        <FaUsers />
                    </div>

                    <div>

                        <span>
                            Applications
                        </span>

                        <strong>
                            {totalApplications}
                        </strong>

                    </div>

                </div>


                <div className="report-stat-card selected-card">

                    <div className="stat-icon green">
                        <FaUserCheck />
                    </div>

                    <div>

                        <span>
                            Selected
                        </span>

                        <strong>
                            {uniqueSelectedStudents}
                        </strong>

                    </div>

                </div>


                <div className="report-stat-card placed-card">

                    <div className="stat-icon teal">
                        <FaGraduationCap />
                    </div>

                    <div>

                        <span>
                            Placed
                        </span>

                        <strong>
                            {uniquePlacedStudents}
                        </strong>

                    </div>

                </div>

            </div>


            {/* =============================================
                OPPORTUNITY SELECTOR
            ============================================= */}

            <div className="opportunity-panel">

                <div className="opportunity-header">

                    <div>

                        <span className="section-label">
                            RECRUITMENT OPPORTUNITY
                        </span>

                        <h2>
                            Select Company & Role
                        </h2>

                        <p>

                            Choose one specific
                            recruitment opportunity.
                            The student list below will
                            contain only applications
                            for that opportunity.

                        </p>

                    </div>

                    <div className="opportunity-icon">
                        <FaBriefcase />
                    </div>

                </div>


                <div className="opportunity-select-grid">


                    {/* COMPANY */}

                    <div className="select-field">

                        <label>
                            Company
                        </label>

                        <div className="select-control">

                            <FaBuilding />

                            <select
                                value={
                                    companyFilter
                                }
                                onChange={
                                    event =>

                                        setCompanyFilter(
                                            event.target.value
                                        )
                                }
                            >

                                <option value="all">
                                    All Companies
                                </option>


                                {companyOptions.map(
                                    company => (

                                        <option
                                            key={
                                                company.id
                                            }
                                            value={
                                                company.id
                                            }
                                        >

                                            {
                                                company.name
                                            }

                                        </option>

                                    )
                                )}

                            </select>

                            <FaChevronDown />

                        </div>

                    </div>


                    {/* JOB */}

                    <div className="select-field">

                        <label>
                            Role / Job
                        </label>

                        <div className="select-control">

                            <FaBriefcase />

                            <select
                                value={
                                    jobFilter
                                }
                                onChange={
                                    event =>

                                        setJobFilter(
                                            event.target.value
                                        )
                                }
                                disabled={

                                    companyFilter !==
                                    "all" &&

                                    availableJobs.length ===
                                    0

                                }
                            >

                                <option value="all">

                                    {
                                        companyFilter ===
                                        "all"

                                            ? "All Roles"

                                            : "All Roles for Selected Company"
                                    }

                                </option>


                                {availableJobs.map(
                                    job => (

                                        <option
                                            key={
                                                job.id
                                            }
                                            value={
                                                job.id
                                            }
                                        >

                                            {
                                                job.title
                                            }

                                        </option>

                                    )
                                )}

                            </select>

                            <FaChevronDown />

                        </div>

                    </div>

                </div>


                {(
                    selectedCompany ||
                    selectedJob
                ) && (

                    <div className="selected-opportunity">

                        <div className="selected-opportunity-main">

                            <div className="opportunity-company-icon">
                                <FaBuilding />
                            </div>

                            <div>

                                <span>
                                    SELECTED OPPORTUNITY
                                </span>

                                <strong>

                                    {
                                        selectedCompany?.name ||

                                        selectedJob?.companyName ||

                                        "All Companies"
                                    }

                                </strong>


                                {selectedJob && (

                                    <p>

                                        <FaBriefcase />

                                        {
                                            selectedJob.title
                                        }

                                    </p>

                                )}

                            </div>

                        </div>


                        {selectedJob && (

                            <div className="opportunity-meta">

                                <div>

                                    <span>
                                        Package
                                    </span>

                                    <strong>
                                        {
                                            selectedJob.packageValue
                                        }
                                    </strong>

                                </div>

                                <div>

                                    <span>
                                        Location
                                    </span>

                                    <strong>
                                        {
                                            selectedJob.location
                                        }
                                    </strong>

                                </div>

                            </div>

                        )}

                    </div>

                )}

            </div>


            {/* =============================================
                PIPELINE
            ============================================= */}

            <div className="pipeline-panel">

                <div className="pipeline-heading">

                    <div>

                        <span className="section-label">
                            OPPORTUNITY PIPELINE
                        </span>

                        <h2>
                            Recruitment Status
                        </h2>

                        <p>

                            Counts are based on the
                            currently selected company
                            and role.

                        </p>

                    </div>

                </div>


                <div className="pipeline">

                    <div className="pipeline-box">

                        <div className="pipeline-icon applications">
                            <FaUsers />
                        </div>

                        <div>

                            <strong>
                                {
                                    allOpportunityRecords.length
                                }
                            </strong>

                            <span>
                                Applications
                            </span>

                        </div>

                    </div>


                    <div className="pipeline-line">
                        →
                    </div>


                    <div className="pipeline-box">

                        <div className="pipeline-icon selected">
                            <FaUserCheck />
                        </div>

                        <div>

                            <strong>
                                {
                                    uniqueSelectedStudents
                                }
                            </strong>

                            <span>
                                Selected Students
                            </span>

                        </div>

                    </div>


                    <div className="pipeline-line">
                        →
                    </div>


                    <div className="pipeline-box">

                        <div className="pipeline-icon placed">
                            <FaGraduationCap />
                        </div>

                        <div>

                            <strong>
                                {
                                    uniquePlacedStudents
                                }
                            </strong>

                            <span>
                                Placed Students
                            </span>

                        </div>

                    </div>


                    <div className="pipeline-line">
                        →
                    </div>


                    <div className="pipeline-box">

                        <div className="pipeline-icon rate">
                            <FaChartLine />
                        </div>

                        <div>

                            <strong>
                                {placementPercentage}%
                            </strong>

                            <span>
                                Selected → Placed
                            </span>

                        </div>

                    </div>

                </div>

            </div>


            {/* =============================================
                STUDENT RECORDS
            ============================================= */}

            <div className="report-panel student-record-panel">


                <div className="student-record-header">

                    <div>

                        <span className="section-label">
                            RECRUITMENT RECORDS
                        </span>

                        <h2>
                            Students for This Opportunity
                        </h2>

                        <p>

                            Only students who applied
                            for the selected company
                            and role are displayed.

                        </p>

                    </div>


                    <div className="record-actions">


                        <button
                            type="button"
                            className="action-button whatsapp-button"
                            onClick={() =>

                                copyForWhatsApp(
                                    selectedOpportunityRecords,
                                    "Selected Students"
                                )

                            }
                            disabled={

                                selectedOpportunityRecords.length ===
                                0

                            }
                        >

                            <FaCopy />

                            Copy Selected

                        </button>


                        <button
                            type="button"
                            className="action-button export-button"
                            onClick={() =>

                                exportExcel(
                                    selectedOpportunityRecords,
                                    "selected-students.xlsx",
                                    "Selected"
                                )

                            }
                            disabled={

                                selectedOpportunityRecords.length ===
                                0

                            }
                        >

                            <FaFileExcel />

                            Export Selected

                        </button>


                        <button
                            type="button"
                            className="action-button placed-action"
                            onClick={() =>

                                copyForWhatsApp(
                                    placedOpportunityRecords,
                                    "Placed Students"
                                )

                            }
                            disabled={

                                placedOpportunityRecords.length ===
                                0

                            }
                        >

                            <FaCopy />

                            Copy Placed

                        </button>


                        <button
                            type="button"
                            className="action-button export-button"
                            onClick={() =>

                                exportExcel(
                                    placedOpportunityRecords,
                                    "placed-students.xlsx",
                                    "Placed"
                                )

                            }
                            disabled={

                                placedOpportunityRecords.length ===
                                0

                            }
                        >

                            <FaFileExcel />

                            Export Placed

                        </button>

                    </div>

                </div>


                {/* =========================================
                    TABS
                ========================================= */}

                <div className="student-tabs">

                    <button
                        type="button"
                        className={

                            recordFilter === "all"
                                ? "active"
                                : ""

                        }
                        onClick={() =>
                            setRecordFilter(
                                "all"
                            )
                        }
                    >

                        <FaUsers />

                        All Applicants

                        <span>
                            {
                                allOpportunityRecords.length
                            }
                        </span>

                    </button>


                    <button
                        type="button"
                        className={

                            recordFilter === "selected"
                                ? "active"
                                : ""

                        }
                        onClick={() =>
                            setRecordFilter(
                                "selected"
                            )
                        }
                    >

                        <FaUserCheck />

                        Selected Only

                        <span>
                            {
                                selectedOnlyOpportunityRecords.length
                            }
                        </span>

                    </button>


                    <button
                        type="button"
                        className={

                            recordFilter === "placed"
                                ? "active"
                                : ""

                        }
                        onClick={() =>
                            setRecordFilter(
                                "placed"
                            )
                        }
                    >

                        <FaGraduationCap />

                        Placed

                        <span>
                            {
                                placedOpportunityRecords.length
                            }
                        </span>

                    </button>

                </div>


                {/* =========================================
                    SEARCH
                ========================================= */}

                <div className="records-toolbar">

                    <div className="records-search">

                        <FaSearch />

                        <input
                            type="text"
                            placeholder="Search student, email, phone, college..."
                            value={
                                search
                            }
                            onChange={
                                event =>
                                    setSearch(
                                        event.target.value
                                    )
                            }
                        />


                        {search && (

                            <button
                                type="button"
                                className="clear-search"
                                onClick={() =>
                                    setSearch("")
                                }
                            >

                                <FaTimes />

                            </button>

                        )}

                    </div>


                    <div className="record-summary">

                        Showing{" "}

                        <strong>
                            {
                                filteredRecords.length
                            }
                        </strong>

                        {" "}of{" "}

                        <strong>
                            {
                                allOpportunityRecords.length
                            }
                        </strong>

                        {" "}applications

                    </div>

                </div>


                {/* =========================================
                    TABLE
                ========================================= */}

                {filteredRecords.length === 0 ? (

                    <div className="empty-report">

                        <div className="empty-report-icon">
                            <FaUsers />
                        </div>

                        <h3>
                            No records found
                        </h3>

                        <p>

                            Select a company and role
                            with applications, or change
                            the current filter.

                        </p>

                    </div>

                ) : (

                    <div className="student-table-wrapper">

                        <table className="student-record-table">

                            <thead>

                                <tr>

                                    <th>
                                        Student
                                    </th>

                                    <th>
                                        Contact
                                    </th>

                                    <th>
                                        College / Education
                                    </th>

                                    <th>
                                        Company
                                    </th>

                                    <th>
                                        Job / Role
                                    </th>

                                    <th>
                                        Package
                                    </th>

                                    <th>
                                        Location
                                    </th>

                                    <th>
                                        Selected
                                    </th>

                                    <th>
                                        Placed
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {filteredRecords.map(
                                    (
                                        student,
                                        index
                                    ) => (

                                        <tr
                                            key={

                                                student.id ||

                                                `${student._studentId}-${student._jobId}-${index}`

                                            }
                                        >


                                            {/* =================================
                                                STUDENT
                                            ================================= */}

                                            <td>

                                                <div className="report-student">


                                                    {/* =================================
                                                        PROFILE PHOTO
                                                    ================================= */}

                                                    <StudentAvatar

                                                        photo={
                                                            student.profilePhoto
                                                        }

                                                        name={
                                                            student.studentName
                                                        }

                                                        initials={
                                                            student.studentInitials
                                                        }

                                                    />


                                                    <div className="student-primary">

                                                        <strong>

                                                            {
                                                                student.studentName
                                                            }

                                                        </strong>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* =================================
                                                CONTACT
                                            ================================= */}

                                            <td>

                                                <div className="contact-cell">

                                                    <span>

                                                        <FaEnvelope />

                                                        <span className="cell-text">

                                                            {
                                                                student.email
                                                            }

                                                        </span>

                                                    </span>


                                                    <span>

                                                        <FaPhone />

                                                        <span className="cell-text phone-text">

                                                            {
                                                                student.phone
                                                            }

                                                        </span>

                                                    </span>

                                                </div>

                                            </td>


                                            {/* =================================
                                                COLLEGE
                                            ================================= */}

                                            <td>

                                                <div className="education-cell">

                                                    <strong>

                                                        <FaUniversity />

                                                        <span>

                                                            {
                                                                student.college
                                                            }

                                                        </span>

                                                    </strong>

                                                    <span className="education-sub">

                                                        {
                                                            student.degree
                                                        }

                                                        {" • "}

                                                        {
                                                            student.department
                                                        }

                                                    </span>

                                                </div>

                                            </td>


                                            {/* =================================
                                                COMPANY
                                            ================================= */}

                                            <td>

                                                <div className="company-record">

                                                    <div className="mini-icon">

                                                        <FaBuilding />

                                                    </div>

                                                    <strong>

                                                        {
                                                            student.companyName
                                                        }

                                                    </strong>

                                                </div>

                                            </td>


                                            {/* =================================
                                                JOB
                                            ================================= */}

                                            <td>

                                                <div className="job-record">

                                                    <FaBriefcase />

                                                    <span>

                                                        {
                                                            student.jobTitle
                                                        }

                                                    </span>

                                                </div>

                                            </td>


                                            {/* =================================
                                                PACKAGE
                                            ================================= */}

                                            <td>

                                                <strong className="package-text">

                                                    {
                                                        student.packageValue
                                                    }

                                                </strong>

                                            </td>


                                            {/* =================================
                                                LOCATION
                                            ================================= */}

                                            <td>

                                                <div className="location-cell">

                                                    <FaMapMarkerAlt />

                                                    <span>

                                                        {
                                                            student.location
                                                        }

                                                    </span>

                                                </div>

                                            </td>


                                            {/* =================================
                                                SELECTED
                                            ================================= */}

                                            <td>

                                                <span className="date-text">

                                                    {
                                                        formatDate(
                                                            student.selectedDate
                                                        )
                                                    }

                                                </span>

                                            </td>


                                            {/* =================================
                                                PLACED
                                            ================================= */}

                                            <td>

                                                <span className="date-text">

                                                    {

                                                        student.isPlaced

                                                            ? formatDate(
                                                                student.placedDate
                                                            )

                                                            : "—"

                                                    }

                                                </span>

                                            </td>


                                            {/* =================================
                                                STATUS
                                            ================================= */}

                                            <td>

                                                {student.isPlaced ? (

                                                    <span className="status-badge placed">

                                                        <span></span>

                                                        Placed

                                                    </span>

                                                ) : student.isSelected ? (

                                                    <span className="status-badge selected">

                                                        <span></span>

                                                        Selected

                                                    </span>

                                                ) : (

                                                    <span className="status-badge pending">

                                                        <span></span>

                                                        Applied

                                                    </span>

                                                )}

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>


            {/* =============================================
                COMPANY-WISE REPORT
            ============================================= */}

            <div className="report-panel table-panel">

                <div className="panel-heading">

                    <div>

                        <span className="section-label">
                            COMPANY REPORT
                        </span>

                        <h2>
                            Company-wise Selection & Placement
                        </h2>

                        <p>

                            Unique student counts across
                            each company's recruitment
                            opportunities.

                        </p>

                    </div>

                </div>


                {companyPlacementData.length === 0 ? (

                    <div className="empty-report">

                        <div className="empty-report-icon">
                            <FaBuilding />
                        </div>

                        <h3>
                            No company placement data
                        </h3>

                    </div>

                ) : (

                    <div className="table-wrapper">

                        <table>

                            <thead>

                                <tr>

                                    <th>
                                        Company
                                    </th>

                                    <th>
                                        Selected
                                    </th>

                                    <th>
                                        Placed
                                    </th>

                                    <th>
                                        Not Yet Placed
                                    </th>

                                    <th>
                                        Placement %
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {companyPlacementData.map(
                                    company => {

                                        const notPlaced =
                                            Math.max(
                                                company.selected -
                                                company.placed,
                                                0
                                            );


                                        const percentage =

                                            company.selected > 0

                                                ? (

                                                    (
                                                        company.placed /
                                                        company.selected
                                                    ) * 100

                                                ).toFixed(1)

                                                : "0.0";


                                        return (

                                            <tr
                                                key={
                                                    company.companyId
                                                }
                                            >

                                                <td>

                                                    <div className="company-report-name">

                                                        <div className="company-report-icon">

                                                            <FaBuilding />

                                                        </div>

                                                        <strong>

                                                            {
                                                                company.companyName
                                                            }

                                                        </strong>

                                                    </div>

                                                </td>


                                                <td>

                                                    <span className="count-badge selected-count">

                                                        {
                                                            company.selected
                                                        }

                                                    </span>

                                                </td>


                                                <td>

                                                    <span className="count-badge placed-count">

                                                        {
                                                            company.placed
                                                        }

                                                    </span>

                                                </td>


                                                <td>

                                                    <span className="count-badge pending-count">

                                                        {
                                                            notPlaced
                                                        }

                                                    </span>

                                                </td>


                                                <td>

                                                    <strong className="percentage-text">

                                                        {
                                                            percentage
                                                        }%

                                                    </strong>

                                                </td>

                                            </tr>

                                        );

                                    }
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>


            {/* =============================================
                JOB-WISE REPORT
            ============================================= */}

            <div className="report-panel table-panel">

                <div className="panel-heading">

                    <div>

                        <span className="section-label">
                            ROLE REPORT
                        </span>

                        <h2>
                            Job-wise Application Report
                        </h2>

                        <p>

                            Each role is treated as a
                            separate recruitment opportunity.

                        </p>

                    </div>

                </div>


                {jobApplicationData.length === 0 ? (

                    <div className="empty-report">

                        <div className="empty-report-icon">
                            <FaBriefcase />
                        </div>

                        <h3>
                            No application data
                        </h3>

                    </div>

                ) : (

                    <div className="table-wrapper">

                        <table>

                            <thead>

                                <tr>

                                    <th>
                                        Company
                                    </th>

                                    <th>
                                        Job / Role
                                    </th>

                                    <th>
                                        Applications
                                    </th>

                                    <th>
                                        Selected
                                    </th>

                                    <th>
                                        Placed
                                    </th>

                                    <th>
                                        Selected → Placed
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {jobApplicationData.map(
                                    job => {

                                        const percentage =

                                            job.selected > 0

                                                ? (

                                                    (
                                                        job.placed /
                                                        job.selected
                                                    ) * 100

                                                ).toFixed(1)

                                                : "0.0";


                                        return (

                                            <tr
                                                key={
                                                    job.jobId
                                                }
                                            >

                                                <td>

                                                    <strong>

                                                        {
                                                            job.companyName
                                                        }

                                                    </strong>

                                                </td>


                                                <td>

                                                    <div className="job-report-name">

                                                        <FaBriefcase />

                                                        <strong>

                                                            {
                                                                job.jobTitle
                                                            }

                                                        </strong>

                                                    </div>

                                                </td>


                                                <td>

                                                    {
                                                        job.applications
                                                    }

                                                </td>


                                                <td>

                                                    <span className="count-badge selected-count">

                                                        {
                                                            job.selected
                                                        }

                                                    </span>

                                                </td>


                                                <td>

                                                    <span className="count-badge placed-count">

                                                        {
                                                            job.placed
                                                        }

                                                    </span>

                                                </td>


                                                <td>

                                                    <strong className="percentage-text">

                                                        {
                                                            percentage
                                                        }%

                                                    </strong>

                                                </td>

                                            </tr>

                                        );

                                    }
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </div>

    );

}


export default PlacementReports;