import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    collection,
    onSnapshot,
    query,
    where,
    updateDoc,
    deleteDoc,
    doc
} from "firebase/firestore";

import {
    FaSearch,
    FaBell,
    FaMoon,
    FaBars,
    FaGraduationCap,
    FaBriefcase,
    FaCheckCircle,
    FaUser,
    FaChevronDown,
    FaSignOutAlt,
    FaTimes
} from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";
import { useLayout } from "../../context/LayoutContext";

import { db } from "../../firebase/firebaseConfig";

import "./Navbar.css";


function Navbar() {

    const { user, logout } = useAuth();

    const { toggleSidebar } = useLayout();

    const navigate = useNavigate();


    /* =========================================================
       STATES
    ========================================================= */

    const [search, setSearch] = useState("");

    const [jobs, setJobs] = useState([]);

    const [notifications, setNotifications] = useState([]);

    const [showSearchResults, setShowSearchResults] =
        useState(false);

    const [showNotifications, setShowNotifications] =
        useState(false);

    const [showProfileMenu, setShowProfileMenu] =
        useState(false);

    const [darkMode, setDarkMode] = useState(
        localStorage.getItem("darkMode") === "true"
    );


    /* =========================================================
       PROFILE PHOTO
    ========================================================= */

    const [profilePhotoURL, setProfilePhotoURL] =
        useState("");

    const [photoError, setPhotoError] =
        useState(false);


    /* =========================================================
       PROFILE DROPDOWN REF
    ========================================================= */

    const profileMenuRef = useRef(null);


    /* =========================================================
       USER INITIAL
    ========================================================= */

    const firstLetter =
        user?.name?.charAt(0).toUpperCase() ||
        user?.email?.charAt(0).toUpperCase() ||
        "U";


    /* =========================================================
       USER ROLE
    ========================================================= */

    const role =
        user?.role?.toLowerCase() || "student";


    /*
     * PROFILE MENU RULES
     *
     * Student:
     *      My Profile
     *
     * Company:
     *      Company Profile
     *
     * TPO:
     *      No profile option
     *
     * Admin:
     *      No profile option
     */

    const hideProfileOption =
        role === "tpo" ||
        role === "admin";


    /* =========================================================
       PROFILE MENU LABEL
    ========================================================= */

    const profileMenuLabel =
        role === "company"
            ? "Company Profile"
            : "My Profile";


    const profileMenuDescription =
        role === "company"
            ? "View and edit company profile"
            : "View and edit your profile";


    /* =========================================================
       LOAD PROFILE PHOTO

       Currently listens to:

       studentProfiles/{user.uid}

       This keeps the existing Student profile photo behavior.
    ========================================================= */

    useEffect(() => {

        if (!user?.uid) {

            setProfilePhotoURL("");

            setPhotoError(false);

            return;

        }


        const profileRef = doc(
            db,
            "studentProfiles",
            user.uid
        );


        const unsubscribe = onSnapshot(
            profileRef,

            (snapshot) => {

                if (snapshot.exists()) {

                    const data =
                        snapshot.data();

                    setProfilePhotoURL(
                        data.profilePhotoURL || ""
                    );

                } else {

                    setProfilePhotoURL("");

                }


                setPhotoError(false);

            },

            (error) => {

                console.error(
                    "Error loading profile photo:",
                    error
                );

                setProfilePhotoURL("");

            }
        );


        return () => unsubscribe();

    }, [user?.uid]);


    /* =========================================================
       APPLY DARK MODE
    ========================================================= */

    useEffect(() => {

        document.body.classList.toggle(
            "dark-mode",
            darkMode
        );

    }, [darkMode]);


    /* =========================================================
       LOAD JOBS FROM FIREBASE
    ========================================================= */

    useEffect(() => {

        const jobsRef =
            collection(db, "jobs");


        const unsubscribe =
            onSnapshot(
                jobsRef,

                (snapshot) => {

                    const jobData =
                        snapshot.docs.map(
                            (jobDoc) => ({

                                id: jobDoc.id,

                                ...jobDoc.data()

                            })
                        );


                    setJobs(jobData);

                },

                (error) => {

                    console.error(
                        "Error loading jobs:",
                        error
                    );

                }
            );


        return () => unsubscribe();

    }, []);


    /* =========================================================
       LOAD NOTIFICATIONS
    ========================================================= */

    useEffect(() => {

        if (!user?.uid) {

            setNotifications([]);

            return;

        }


        const notificationsRef =
            collection(
                db,
                "notifications"
            );


        const q =
            query(
                notificationsRef,

                where(
                    "userId",
                    "==",
                    user.uid
                )
            );


        const unsubscribe =
            onSnapshot(
                q,

                (snapshot) => {

                    const notificationData =
                        snapshot.docs.map(
                            (notificationDoc) => ({

                                id:
                                    notificationDoc.id,

                                ...notificationDoc.data()

                            })
                        );


                    /*
                     * Sort newest notifications first
                     */

                    notificationData.sort(
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


                    setNotifications(
                        notificationData
                    );

                },

                (error) => {

                    console.error(
                        "Error loading notifications:",
                        error
                    );

                }
            );


        return () => unsubscribe();

    }, [user?.uid]);


    /* =========================================================
       CLOSE PROFILE DROPDOWN WHEN CLICKING OUTSIDE
    ========================================================= */

    useEffect(() => {

        const handleOutsideClick = (event) => {

            if (
                profileMenuRef.current &&
                !profileMenuRef.current.contains(
                    event.target
                )
            ) {

                setShowProfileMenu(false);

            }

        };


        document.addEventListener(
            "mousedown",
            handleOutsideClick
        );


        return () => {

            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );

        };

    }, []);


    /* =========================================================
       SEARCH JOBS
    ========================================================= */

    const filteredJobs =
        search.trim() === ""
            ? []
            : jobs
                .filter((job) => {

                    const searchText =
                        search.toLowerCase();


                    const title =
                        job.title?.toLowerCase() || "";


                    const company =
                        job.companyName?.toLowerCase() ||
                        job.company?.toLowerCase() ||
                        "";


                    const description =
                        job.description?.toLowerCase() || "";


                    const skills =
                        Array.isArray(job.skills)
                            ? job.skills
                                .join(" ")
                                .toLowerCase()
                            : job.skills?.toLowerCase() || "";


                    return (
                        title.includes(searchText) ||
                        company.includes(searchText) ||
                        description.includes(searchText) ||
                        skills.includes(searchText)
                    );

                })
                .slice(0, 6);


    /* =========================================================
       UNREAD NOTIFICATION COUNT
    ========================================================= */

    const unreadCount =
        notifications.filter(
            (notification) =>
                !notification.read
        ).length;


    /* =========================================================
       MARK SINGLE NOTIFICATION READ
    ========================================================= */

    const markNotificationRead =
        async (notification) => {

            try {

                if (!notification.read) {

                    await updateDoc(
                        doc(
                            db,
                            "notifications",
                            notification.id
                        ),
                        {
                            read: true
                        }
                    );

                }

            } catch (error) {

                console.error(
                    "Error marking notification:",
                    error
                );

            }

        };


    /* =========================================================
       DELETE SINGLE NOTIFICATION
    ========================================================= */

    const deleteNotification =
        async (notification, event) => {

            /*
             * VERY IMPORTANT:
             *
             * Stop the click from reaching the parent
             * notification-item.
             *
             * Therefore markNotificationRead()
             * will NOT be triggered.
             */

            event.stopPropagation();


            try {

                await deleteDoc(
                    doc(
                        db,
                        "notifications",
                        notification.id
                    )
                );

            } catch (error) {

                console.error(
                    "Error deleting notification:",
                    error
                );

            }

        };


    /* =========================================================
       MARK ALL NOTIFICATIONS READ
    ========================================================= */

    const markAllRead = async () => {

        try {

            const unread =
                notifications.filter(
                    (notification) =>
                        !notification.read
                );


            await Promise.all(

                unread.map(
                    (notification) =>
                        updateDoc(
                            doc(
                                db,
                                "notifications",
                                notification.id
                            ),
                            {
                                read: true
                            }
                        )
                )

            );

        } catch (error) {

            console.error(
                "Error marking notifications:",
                error
            );

        }

    };


    /* =========================================================
       DARK MODE
    ========================================================= */

    const toggleDarkMode = () => {

        const newMode =
            !darkMode;


        setDarkMode(
            newMode
        );


        localStorage.setItem(
            "darkMode",
            newMode.toString()
        );


        document.body.classList.toggle(
            "dark-mode",
            newMode
        );

    };


    /* =========================================================
       SEARCH RESULT CLICK
       ROLE-BASED NAVIGATION
    ========================================================= */

    const handleJobClick = (job) => {

        setSearch("");

        setShowSearchResults(false);


        let route =
            "/student/jobs";


        if (role === "company") {

            route =
                "/company/jobs";

        }


        if (role === "admin") {

            route =
                "/admin/jobs";

        }


        if (role === "tpo") {

            route =
                "/tpo/jobs";

        }


        navigate(
            route,
            {
                state: {
                    selectedJob: job
                }
            }
        );

    };


    /* =========================================================
       LOGO CLICK
    ========================================================= */

    const handleLogoClick = () => {

        setShowSearchResults(false);

        setShowNotifications(false);

        setShowProfileMenu(false);


        if (role === "company") {

            navigate(
                "/company/dashboard"
            );

            return;

        }


        if (role === "admin") {

            navigate(
                "/admin/dashboard"
            );

            return;

        }


        if (role === "tpo") {

            navigate(
                "/tpo/dashboard"
            );

            return;

        }


        navigate(
            "/student/dashboard"
        );

    };


    /* =========================================================
       PROFILE CLICK
    ========================================================= */

    const handleProfileClick = () => {

        setShowProfileMenu(false);


        if (role === "company") {

            navigate(
                "/company/profile"
            );

            return;

        }


        if (role === "student") {

            navigate(
                "/student/profile"
            );

            return;

        }

    };


    /* =========================================================
       PROFILE MENU TOGGLE
    ========================================================= */

    const toggleProfileMenu = () => {

        setShowProfileMenu(
            (previous) => !previous
        );


        setShowNotifications(false);

    };


    /* =========================================================
       LOGOUT
    ========================================================= */

    const handleLogout = async () => {

        setShowProfileMenu(false);

        try {

            await logout();

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    };


    /* =========================================================
       JSX
    ========================================================= */

    return (

        <nav className="navbar">


            {/* =================================================
                LEFT
            ================================================= */}

            <div className="navbar-left">


                {/* MENU BUTTON */}

                <button
                    className="menu-btn"
                    onClick={toggleSidebar}
                    aria-label="Toggle sidebar"
                >

                    <FaBars />

                </button>


                {/* LOGO */}

                <div
                    className="navbar-logo"
                    onClick={handleLogoClick}
                >

                    <span className="navbar-logo-icon">

                        <FaGraduationCap />

                    </span>


                    <span>

                        Placement
                        <span>Pro</span>

                    </span>

                </div>

            </div>


            {/* =================================================
                SEARCH
            ================================================= */}

            <div className="navbar-search-wrapper">


                <div className="navbar-search">


                    <FaSearch />


                    <input
                        type="text"
                        value={search}
                        placeholder="Search jobs, companies..."
                        onChange={(e) => {

                            setSearch(
                                e.target.value
                            );

                            setShowSearchResults(
                                true
                            );

                        }}
                        onFocus={() => {

                            if (
                                search.trim()
                            ) {

                                setShowSearchResults(
                                    true
                                );

                            }

                        }}
                    />


                    {search && (

                        <button
                            className="clear-search"
                            onClick={() => {

                                setSearch("");

                                setShowSearchResults(
                                    false
                                );

                            }}
                            aria-label="Clear search"
                        >

                            ×

                        </button>

                    )}

                </div>


                {/* =================================================
                    SEARCH RESULTS
                ================================================= */}

                {showSearchResults &&
                    search.trim() !== "" && (

                        <div className="search-results">


                            {filteredJobs.length > 0 ? (

                                filteredJobs.map(
                                    (job) => (

                                        <div
                                            key={job.id}
                                            className="search-result"
                                            onClick={() =>
                                                handleJobClick(
                                                    job
                                                )
                                            }
                                        >


                                            <div className="search-result-icon">

                                                <FaBriefcase />

                                            </div>


                                            <div>

                                                <h4>

                                                    {job.title ||
                                                        "Job Opportunity"}

                                                </h4>


                                                <p>

                                                    {job.companyName ||
                                                        job.company ||
                                                        "Company"}

                                                </p>

                                            </div>

                                        </div>

                                    )
                                )

                            ) : (

                                <div className="no-results">

                                    <FaSearch />

                                    <p>
                                        No jobs found
                                    </p>

                                </div>

                            )}

                        </div>

                    )}

            </div>


            {/* =================================================
                RIGHT
            ================================================= */}

            <div className="navbar-right">


                {/* DARK MODE */}

                <button
                    className="icon-btn"
                    onClick={toggleDarkMode}
                    title={
                        darkMode
                            ? "Switch to light mode"
                            : "Switch to dark mode"
                    }
                    aria-label="Toggle dark mode"
                >

                    <FaMoon />

                </button>


                {/* =================================================
                    NOTIFICATIONS
                ================================================= */}

                <div className="notification-wrapper">


                    <button
                        className={`icon-btn notification ${
                            showNotifications
                                ? "active"
                                : ""
                        }`}
                        onClick={() => {

                            setShowNotifications(
                                !showNotifications
                            );

                            setShowProfileMenu(false);

                        }}
                        aria-label="Notifications"
                    >

                        <FaBell />


                        {unreadCount > 0 && (

                            <span className="notification-count">

                                {unreadCount > 9
                                    ? "9+"
                                    : unreadCount}

                            </span>

                        )}

                    </button>


                    {/* =================================================
                        NOTIFICATION DROPDOWN
                    ================================================= */}

                    {showNotifications && (

                        <div className="notification-dropdown">


                            {/* HEADER */}

                            <div className="notification-header">

                                <div>

                                    <h3>
                                        Notifications
                                    </h3>

                                    <span>
                                        {unreadCount} unread
                                    </span>

                                </div>


                                {unreadCount > 0 && (

                                    <button
                                        onClick={
                                            markAllRead
                                        }
                                    >

                                        Mark all read

                                    </button>

                                )}

                            </div>


                            {/* LIST */}

                            <div className="notification-list">


                                {notifications.length === 0 ? (

                                    <div className="empty-notifications">

                                        <FaCheckCircle />

                                        <p>
                                            You're all caught up!
                                        </p>

                                    </div>

                                ) : (

                                    notifications
                                        .slice(0, 8)
                                        .map(
                                            (
                                                notification
                                            ) => (

                                                <div
                                                    key={
                                                        notification.id
                                                    }
                                                    className={`notification-item ${
                                                        !notification.read
                                                            ? "unread"
                                                            : ""
                                                    }`}
                                                    onClick={() =>
                                                        markNotificationRead(
                                                            notification
                                                        )
                                                    }
                                                >


                                                    <div className="notification-icon">

                                                        <FaBell />

                                                    </div>


                                                    <div className="notification-content">

                                                        <p>

                                                            {
                                                                notification.message
                                                            }

                                                        </p>


                                                        <small>

                                                            {
                                                                notification
                                                                    .createdAt
                                                                    ?.toDate
                                                                    ? notification.createdAt
                                                                        .toDate()
                                                                        .toLocaleString()
                                                                    : "Recently"
                                                            }

                                                        </small>

                                                    </div>


                                                    {/* =================================================
                                                        DELETE NOTIFICATION
                                                    ================================================= */}

                                                    <button
                                                        type="button"
                                                        className="notification-delete"
                                                        title="Delete notification"
                                                        aria-label="Delete notification"
                                                        onClick={(event) =>
                                                            deleteNotification(
                                                                notification,
                                                                event
                                                            )
                                                        }
                                                    >

                                                        <FaTimes />

                                                    </button>

                                                </div>

                                            )
                                        )

                                )}

                            </div>

                        </div>

                    )}

                </div>


                {/* =================================================
                    USER PROFILE DROPDOWN
                ================================================= */}

                <div
                    className="user-profile-wrapper"
                    ref={profileMenuRef}
                >

                    <button
                        className={`user-profile ${
                            showProfileMenu
                                ? "active"
                                : ""
                        }`}
                        onClick={toggleProfileMenu}
                        aria-label="Open profile menu"
                        aria-expanded={
                            showProfileMenu
                        }
                    >

                        <div className="avatar">

                            {profilePhotoURL &&
                            !photoError ? (

                                <img
                                    src={profilePhotoURL}
                                    alt={
                                        user?.name ||
                                        "Profile"
                                    }
                                    className="navbar-profile-photo"
                                    onError={() => {

                                        setPhotoError(
                                            true
                                        );

                                    }}
                                />

                            ) : (

                                firstLetter

                            )}

                        </div>


                        <div className="user-info">

                            <h4>

                                {user?.name ||
                                    "User"}

                            </h4>


                            <p>

                                {user?.role ||
                                    "Student"}

                            </p>

                        </div>


                        <span className="profile-arrow">

                            <FaChevronDown />

                        </span>

                    </button>


                    {/* PROFILE DROPDOWN */}

                    {showProfileMenu && (

                        <div className="profile-dropdown">


                            <div className="profile-dropdown-header">

                                <div className="profile-dropdown-avatar">

                                    {profilePhotoURL &&
                                    !photoError ? (

                                        <img
                                            src={profilePhotoURL}
                                            alt={
                                                user?.name ||
                                                "Profile"
                                            }
                                            className="navbar-profile-photo"
                                            onError={() => {

                                                setPhotoError(
                                                    true
                                                );

                                            }}
                                        />

                                    ) : (

                                        firstLetter

                                    )}

                                </div>


                                <div className="profile-dropdown-user">

                                    <strong>

                                        {user?.name ||
                                            "User"}

                                    </strong>


                                    <span>

                                        {user?.role ||
                                            "Student"}

                                    </span>

                                </div>

                            </div>


                            <div className="profile-dropdown-divider" />


                            {!hideProfileOption && (

                                <button
                                    className="profile-dropdown-item"
                                    onClick={
                                        handleProfileClick
                                    }
                                >

                                    <span className="profile-dropdown-item-icon">

                                        <FaUser />

                                    </span>


                                    <span className="profile-dropdown-item-content">

                                        <strong>

                                            {profileMenuLabel}

                                        </strong>


                                        <small>

                                            {profileMenuDescription}

                                        </small>

                                    </span>

                                </button>

                            )}


                            <button
                                className="profile-dropdown-item logout-item"
                                onClick={
                                    handleLogout
                                }
                            >

                                <span className="profile-dropdown-item-icon">

                                    <FaSignOutAlt />

                                </span>


                                <span className="profile-dropdown-item-content">

                                    <strong>
                                        Logout
                                    </strong>


                                    <small>
                                        Sign out of your account
                                    </small>

                                </span>

                            </button>


                        </div>

                    )}

                </div>


            </div>


        </nav>

    );

}


export default Navbar;