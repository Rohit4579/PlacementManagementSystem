import { useEffect, useState } from "react";

import {
    collection,
    getDocs,
    deleteDoc,
    doc,
    query,
    where,
    writeBatch
} from "firebase/firestore";

import {
    FaBuilding,
    FaEnvelope,
    FaGlobe,
    FaMapMarkerAlt,
    FaPhone,
    FaIndustry,
    FaEye,
    FaTrash,
    FaSearch,
    FaTimes,
    FaCheckCircle,
    FaAlignLeft,
    FaSyncAlt,
    FaExternalLinkAlt
} from "react-icons/fa";

import { db } from "../../firebase/firebaseConfig";

import "./ManageCompanies.css";


function ManageCompanies() {

    const [companies, setCompanies] = useState([]);

    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");

    const [selectedCompany, setSelectedCompany] =
        useState(null);

    const [deletingId, setDeletingId] =
        useState(null);


    /* =========================================================
       NORMALIZE VALUE
    ========================================================= */

    const normalize = (value) => {

        if (
            value === undefined ||
            value === null
        ) {
            return "";
        }

        if (Array.isArray(value)) {
            return value.join(", ");
        }

        return String(value);
    };


    /* =========================================================
       WEBSITE URL
    ========================================================= */

    const getWebsiteUrl = (website) => {

        const value =
            normalize(website).trim();

        if (!value) {
            return "";
        }

        if (
            value.startsWith("http://") ||
            value.startsWith("https://")
        ) {
            return value;
        }

        return `https://${value}`;
    };


    /* =========================================================
       WEBSITE DISPLAY
    ========================================================= */

    const getWebsiteDisplay = (website) => {

        return normalize(website)
            .replace(/^https?:\/\//, "")
            .replace(/\/$/, "");

    };


    /* =========================================================
       COMPANY INITIAL
    ========================================================= */

    const getCompanyInitial = (companyName) => {

        const name =
            normalize(companyName).trim();

        if (!name) {
            return "C";
        }

        return name
            .charAt(0)
            .toUpperCase();

    };


    /* =========================================================
       FETCH COMPANIES
    ========================================================= */

    const fetchCompanies = async () => {

        try {

            setLoading(true);

            const companiesRef =
                collection(
                    db,
                    "companies"
                );

            const snapshot =
                await getDocs(
                    companiesRef
                );


            const companiesData =
                snapshot.docs.map(
                    (item) => {

                        const data =
                            item.data() || {};

                        return {

                            id:
                                item.id,

                            companyName:
                                normalize(
                                    data.companyName
                                ),

                            email:
                                normalize(
                                    data.email
                                ),

                            phone:
                                normalize(
                                    data.phone
                                ),

                            industry:
                                normalize(
                                    data.industry
                                ),

                            website:
                                normalize(
                                    data.website
                                ),

                            location:
                                normalize(
                                    data.location
                                ),

                            description:
                                normalize(
                                    data.description
                                )

                        };

                    }
                );


            setCompanies(
                companiesData
            );

        }

        catch (error) {

            console.error(
                "Admin Companies Error:",
                error
            );

            alert(
                error?.message ||
                "Unable to load companies."
            );

        }

        finally {

            setLoading(false);

        }

    };


    /* =========================================================
       INITIAL LOAD
    ========================================================= */

    useEffect(() => {

        fetchCompanies();

    }, []);


    /* =========================================================
       CLOSE MODAL WITH ESCAPE
    ========================================================= */

    useEffect(() => {

        const handleEscape = (event) => {

            if (
                event.key === "Escape"
            ) {

                setSelectedCompany(
                    null
                );

            }

        };


        if (selectedCompany) {

            document.addEventListener(
                "keydown",
                handleEscape
            );

        }


        return () => {

            document.removeEventListener(
                "keydown",
                handleEscape
            );

        };

    }, [selectedCompany]);


    /* =========================================================
       FILTER COMPANIES
    ========================================================= */

    const filteredCompanies =
        companies.filter(
            (company) => {

                const searchText =
                    search
                        .trim()
                        .toLowerCase();


                if (!searchText) {
                    return true;
                }


                const searchableText = [

                    company.companyName,
                    company.email,
                    company.phone,
                    company.industry,
                    company.website,
                    company.location,
                    company.description

                ]
                    .map(normalize)
                    .join(" ")
                    .toLowerCase();


                return searchableText.includes(
                    searchText
                );

            }
        );


    /* =========================================================
       DELETE ALL DOCUMENTS IN BATCHES
       
       Firestore batch limit is 500 operations.
       Therefore we process large companies safely.
    ========================================================= */

    const deleteDocumentsInBatches = async (
        documentReferences
    ) => {

        if (
            !documentReferences ||
            documentReferences.length === 0
        ) {

            return;

        }


        const BATCH_SIZE = 450;


        for (
            let start = 0;
            start < documentReferences.length;
            start += BATCH_SIZE
        ) {

            const batch =
                writeBatch(db);


            const currentBatch =
                documentReferences.slice(
                    start,
                    start + BATCH_SIZE
                );


            currentBatch.forEach(
                (reference) => {

                    batch.delete(
                        reference
                    );

                }
            );


            await batch.commit();

        }

    };


    /* =========================================================
       GET JOBS BELONGING TO COMPANY
       
       Normal/new jobs:
       
           companyId == company.id
       
       Legacy jobs:
       
           Some old jobs may not have companyId.
           For those we also check companyEmail.
    ========================================================= */

    const getCompanyJobs =
        async (companyId, companyEmail) => {

            const jobsRef =
                collection(
                    db,
                    "jobs"
                );


            const jobReferences = [];

            const jobIds = new Set();

            const jobDocuments = [];


            /* =================================================
               FIND JOBS BY COMPANY ID
            ================================================= */

            try {

                const companyIdQuery =
                    query(
                        jobsRef,
                        where(
                            "companyId",
                            "==",
                            companyId
                        )
                    );


                const companyIdSnapshot =
                    await getDocs(
                        companyIdQuery
                    );


                companyIdSnapshot.forEach(
                    (jobDocument) => {

                        if (
                            !jobIds.has(
                                jobDocument.id
                            )
                        ) {

                            jobIds.add(
                                jobDocument.id
                            );

                            jobDocuments.push(
                                jobDocument
                            );

                            jobReferences.push(
                                jobDocument.ref
                            );

                        }

                    }
                );

            }

            catch (error) {

                console.error(
                    "Error finding jobs by companyId:",
                    error
                );

            }


            /* =================================================
               FIND LEGACY JOBS BY COMPANY EMAIL
               
               This helps remove older jobs created before
               companyId was properly stored.
            ================================================= */

            if (
                companyEmail &&
                companyEmail.trim()
            ) {

                try {

                    const companyEmailQuery =
                        query(
                            jobsRef,
                            where(
                                "companyEmail",
                                "==",
                                companyEmail.trim()
                            )
                        );


                    const emailSnapshot =
                        await getDocs(
                            companyEmailQuery
                        );


                    emailSnapshot.forEach(
                        (jobDocument) => {

                            if (
                                !jobIds.has(
                                    jobDocument.id
                                )
                            ) {

                                jobIds.add(
                                    jobDocument.id
                                );

                                jobDocuments.push(
                                    jobDocument
                                );

                                jobReferences.push(
                                    jobDocument.ref
                                );

                            }

                        }
                    );

                }

                catch (error) {

                    console.error(
                        "Error finding legacy jobs:",
                        error
                    );

                }

            }


            return {

                jobReferences,

                jobDocuments,

                jobIds: Array.from(
                    jobIds
                )

            };

        };


    /* =========================================================
       DELETE COMPANY
       
       THIS NOW DELETES:
       
       1. companies/{companyId}
       2. jobs belonging to company
       3. notifications belonging to company
       4. notifications belonging to deleted jobs
       5. users/{companyId}
       
       Firebase Authentication account:
       handled separately on backend.
    ========================================================= */

    const deleteCompany = async (
        companyId
    ) => {

        if (!companyId) {

            alert(
                "Invalid company selected."
            );

            return;

        }


        const company =
            companies.find(
                (item) =>
                    item.id === companyId
            );


        if (!company) {

            alert(
                "Company information could not be found."
            );

            return;

        }


        const companyName =
            company.companyName ||
            "this company";


        const confirmation =
            window.confirm(

                `Are you sure you want to permanently delete "${companyName}"?\n\n` +

                `The following data will be deleted:\n` +

                `• Company profile\n` +

                `• All jobs posted by this company\n` +

                `• Job notifications\n` +

                `• Company user profile\n\n` +

                `This action cannot be undone.`

            );


        if (!confirmation) {
            return;
        }


        try {

            setDeletingId(
                companyId
            );


            console.log(
                "================================"
            );

            console.log(
                "STARTING COMPANY DELETION"
            );

            console.log(
                "Company:",
                companyName
            );

            console.log(
                "Company ID:",
                companyId
            );

            console.log(
                "================================"
            );


            /* =================================================
               1. FIND COMPANY JOBS
            ================================================= */

            const companyJobs =
                await getCompanyJobs(
                    companyId,
                    company.email
                );


            console.log(
                "Jobs found:",
                companyJobs.jobIds.length
            );


            /* =================================================
               2. DELETE JOB NOTIFICATIONS
               
               First get notifications by companyId.
            ================================================= */

            const notificationsRef =
                collection(
                    db,
                    "notifications"
                );


            const notificationReferences = [];

            const notificationIds =
                new Set();


            /* =================================================
               NOTIFICATIONS BY COMPANY ID
            ================================================= */

            try {

                const notificationCompanyQuery =
                    query(
                        notificationsRef,
                        where(
                            "companyId",
                            "==",
                            companyId
                        )
                    );


                const notificationSnapshot =
                    await getDocs(
                        notificationCompanyQuery
                    );


                notificationSnapshot.forEach(
                    (notificationDocument) => {

                        if (
                            !notificationIds.has(
                                notificationDocument.id
                            )
                        ) {

                            notificationIds.add(
                                notificationDocument.id
                            );

                            notificationReferences.push(
                                notificationDocument.ref
                            );

                        }

                    }
                );

            }

            catch (error) {

                console.error(
                    "Error finding company notifications:",
                    error
                );

            }


            /* =================================================
               NOTIFICATIONS BY JOB ID
               
               This catches notifications belonging to old
               jobs even if companyId wasn't stored correctly.
            ================================================= */

            for (
                const jobId
                of companyJobs.jobIds
            ) {

                try {

                    const jobNotificationQuery =
                        query(
                            notificationsRef,
                            where(
                                "jobId",
                                "==",
                                jobId
                            )
                        );


                    const jobNotificationSnapshot =
                        await getDocs(
                            jobNotificationQuery
                        );


                    jobNotificationSnapshot.forEach(
                        (
                            notificationDocument
                        ) => {

                            if (
                                !notificationIds.has(
                                    notificationDocument.id
                                )
                            ) {

                                notificationIds.add(
                                    notificationDocument.id
                                );

                                notificationReferences.push(
                                    notificationDocument.ref
                                );

                            }

                        }
                    );

                }

                catch (error) {

                    console.error(
                        `Error finding notifications for job ${jobId}:`,
                        error
                    );

                }

            }


            console.log(
                "Notifications found:",
                notificationReferences.length
            );


            /* =================================================
               3. DELETE NOTIFICATIONS
            ================================================= */

            await deleteDocumentsInBatches(
                notificationReferences
            );


            console.log(
                "Notifications deleted."
            );


            /* =================================================
               4. DELETE JOBS
            ================================================= */

            await deleteDocumentsInBatches(
                companyJobs.jobReferences
            );


            console.log(
                "Jobs deleted."
            );


            /* =================================================
               5. DELETE COMPANY PROFILE
               
               companies/{companyId}
            ================================================= */

            await deleteDoc(
                doc(
                    db,
                    "companies",
                    companyId
                )
            );


            console.log(
                "Company profile deleted."
            );


            /* =================================================
               6. DELETE USER FIRESTORE PROFILE
               
               users/{companyId}
               
               This removes the Firestore user document.
            ================================================= */

            try {

                await deleteDoc(
                    doc(
                        db,
                        "users",
                        companyId
                    )
                );


                console.log(
                    "User Firestore profile deleted."
                );

            }

            catch (error) {

                /*
                 * The user document may not exist.
                 * That should NOT make the whole company
                 * deletion fail.
                 */

                console.log(
                    "No users document found or unable to delete it:",
                    error
                );

            }


            /* =================================================
               7. REMOVE FROM UI
            ================================================= */

            setCompanies(
                (previousCompanies) =>
                    previousCompanies.filter(
                        (item) =>
                            item.id !==
                            companyId
                    )
            );


            /* =================================================
               8. CLOSE MODAL
            ================================================= */

            if (
                selectedCompany &&
                selectedCompany.id ===
                    companyId
            ) {

                setSelectedCompany(
                    null
                );

            }


            console.log(
                "================================"
            );

            console.log(
                "COMPANY DELETION COMPLETE"
            );

            console.log(
                "================================"
            );


            alert(
                `"${companyName}" and its Firestore data were deleted successfully.`
            );


        }

        catch (error) {

            console.error(
                "================================"
            );

            console.error(
                "DELETE COMPANY ERROR:",
                error
            );

            console.error(
                "================================"
            );


            alert(
                error?.message ||
                "Unable to completely delete the company."
            );

        }

        finally {

            setDeletingId(
                null
            );

        }

    };


    /* =========================================================
       VIEW COMPANY
    ========================================================= */

    const viewCompany = (
        company
    ) => {

        setSelectedCompany(
            company
        );

    };


    /* =========================================================
       CLOSE MODAL
    ========================================================= */

    const closeModal = () => {

        setSelectedCompany(
            null
        );

    };


    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {

        return (

            <div className="manage-companies-page">

                <div className="companies-loading-state">

                    <div className="companies-loading-spinner"></div>

                    <h3>
                        Loading Companies
                    </h3>

                    <p>
                        Fetching registered company profiles...
                    </p>

                </div>

            </div>

        );

    }


    /* =========================================================
       PAGE
    ========================================================= */

    return (

        <div className="manage-companies-page">


            {/* =====================================================
                HEADER
            ===================================================== */}

            <header className="companies-page-header">

                <div className="companies-header-content">

                    <span className="companies-page-eyebrow">
                        TPO / ADMIN
                    </span>

                    <h1>
                        Manage Companies
                    </h1>

                    <p>
                        View, search and manage all registered
                        company profiles.
                    </p>

                </div>


                <div className="companies-total-card">

                    <div className="companies-total-icon">
                        <FaBuilding />
                    </div>

                    <div className="companies-total-content">

                        <span>
                            Total Companies
                        </span>

                        <strong>
                            {companies.length}
                        </strong>

                    </div>

                </div>

            </header>


            {/* =====================================================
                SEARCH / TOOLBAR
            ===================================================== */}

            <section className="companies-toolbar">

                <div className="companies-search-box">

                    <FaSearch className="companies-search-icon" />

                    <input
                        type="text"
                        value={search}
                        placeholder="Search by company, email, industry, location..."
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                    />

                    {search && (

                        <button
                            type="button"
                            className="companies-clear-search"
                            onClick={() =>
                                setSearch("")
                            }
                            aria-label="Clear search"
                        >

                            <FaTimes />

                        </button>

                    )}

                </div>


                <div className="companies-toolbar-right">

                    <span className="companies-result-text">

                        Showing{" "}

                        <strong>
                            {filteredCompanies.length}
                        </strong>

                        {" "}of{" "}

                        <strong>
                            {companies.length}
                        </strong>

                        {" "}companies

                    </span>


                    <button
                        type="button"
                        className="companies-refresh-btn"
                        onClick={
                            fetchCompanies
                        }
                        disabled={loading}
                    >

                        <FaSyncAlt />

                        <span>
                            Refresh
                        </span>

                    </button>

                </div>

            </section>


            {/* =====================================================
                EMPTY STATE
            ===================================================== */}

            {filteredCompanies.length === 0 && (

                <div className="companies-empty-state">

                    <div className="companies-empty-icon">
                        <FaBuilding />
                    </div>

                    <h3>
                        No Companies Found
                    </h3>

                    <p>

                        {companies.length === 0
                            ? "No companies have registered yet."
                            : "No companies match your current search."
                        }

                    </p>


                    {search && (

                        <button
                            type="button"
                            className="companies-empty-clear"
                            onClick={() =>
                                setSearch("")
                            }
                        >
                            Clear Search
                        </button>

                    )}

                </div>

            )}


            {/* =====================================================
                DESKTOP TABLE
            ===================================================== */}

            {filteredCompanies.length > 0 && (

                <section className="companies-table-card">

                    <div className="companies-table-scroll">

                        <table className="companies-table">

                            <thead>

                                <tr>

                                    <th className="company-column">
                                        Company
                                    </th>

                                    <th className="contact-column">
                                        Contact
                                    </th>

                                    <th className="industry-column">
                                        Industry
                                    </th>

                                    <th className="location-column">
                                        Location
                                    </th>

                                    <th className="website-column">
                                        Website
                                    </th>

                                    <th className="status-column">
                                        Status
                                    </th>

                                    <th className="actions-column">
                                        Actions
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {filteredCompanies.map(
                                    (company) => (

                                        <tr
                                            key={
                                                company.id
                                            }
                                        >


                                            {/* COMPANY */}

                                            <td className="company-column">

                                                <div className="company-table-profile">

                                                    <div className="company-table-avatar">

                                                        {getCompanyInitial(
                                                            company.companyName
                                                        )}

                                                    </div>


                                                    <div className="company-table-name">

                                                        <strong
                                                            title={
                                                                company.companyName
                                                            }
                                                        >
                                                            {
                                                                company.companyName ||
                                                                "Unnamed Company"
                                                            }
                                                        </strong>

                                                        <span>
                                                            Registered company
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* CONTACT */}

                                            <td className="contact-column">

                                                <div className="company-contact-list">

                                                    {company.email && (

                                                        <div
                                                            className="company-contact-item"
                                                            title={
                                                                company.email
                                                            }
                                                        >

                                                            <span className="contact-icon">
                                                                <FaEnvelope />
                                                            </span>

                                                            <span className="contact-value">
                                                                {
                                                                    company.email
                                                                }
                                                            </span>

                                                        </div>

                                                    )}


                                                    {company.phone && (

                                                        <div
                                                            className="company-contact-item"
                                                            title={
                                                                company.phone
                                                            }
                                                        >

                                                            <span className="contact-icon">
                                                                <FaPhone />
                                                            </span>

                                                            <span className="contact-value">
                                                                {
                                                                    company.phone
                                                                }
                                                            </span>

                                                        </div>

                                                    )}


                                                    {!company.email &&
                                                        !company.phone && (

                                                            <span className="company-not-available">
                                                                Contact unavailable
                                                            </span>

                                                        )}

                                                </div>

                                            </td>


                                            {/* INDUSTRY */}

                                            <td className="industry-column">

                                                {company.industry ? (

                                                    <span className="company-industry-badge">

                                                        <FaIndustry />

                                                        <span
                                                            title={
                                                                company.industry
                                                            }
                                                        >
                                                            {
                                                                company.industry
                                                            }
                                                        </span>

                                                    </span>

                                                ) : (

                                                    <span className="company-muted-text">
                                                        Not specified
                                                    </span>

                                                )}

                                            </td>


                                            {/* LOCATION */}

                                            <td className="location-column">

                                                {company.location ? (

                                                    <div
                                                        className="company-location"
                                                        title={
                                                            company.location
                                                        }
                                                    >

                                                        <FaMapMarkerAlt />

                                                        <span>
                                                            {
                                                                company.location
                                                            }
                                                        </span>

                                                    </div>

                                                ) : (

                                                    <span className="company-muted-text">
                                                        Not available
                                                    </span>

                                                )}

                                            </td>


                                            {/* WEBSITE */}

                                            <td className="website-column">

                                                {company.website ? (

                                                    <a
                                                        href={
                                                            getWebsiteUrl(
                                                                company.website
                                                            )
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="company-website"
                                                        title={
                                                            company.website
                                                        }
                                                    >

                                                        <FaGlobe />

                                                        <span>
                                                            {
                                                                getWebsiteDisplay(
                                                                    company.website
                                                                )
                                                            }
                                                        </span>

                                                        <FaExternalLinkAlt className="website-external-icon" />

                                                    </a>

                                                ) : (

                                                    <span className="company-muted-text">
                                                        Not available
                                                    </span>

                                                )}

                                            </td>


                                            {/* STATUS */}

                                            <td className="status-column">

                                                <span className="company-status-badge">

                                                    <FaCheckCircle />

                                                    Registered

                                                </span>

                                            </td>


                                            {/* ACTIONS */}

                                            <td className="actions-column">

                                                <div className="company-action-buttons">

                                                    <button
                                                        type="button"
                                                        className="company-view-btn"
                                                        onClick={() =>
                                                            viewCompany(
                                                                company
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
                                                        className="company-delete-btn"
                                                        onClick={() =>
                                                            deleteCompany(
                                                                company.id
                                                            )
                                                        }
                                                        disabled={
                                                            deletingId ===
                                                            company.id
                                                        }
                                                    >

                                                        <FaTrash />

                                                        <span>
                                                            {deletingId ===
                                                            company.id
                                                                ? "Deleting"
                                                                : "Delete"
                                                            }
                                                        </span>

                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                </section>

            )}


            {/* =====================================================
                MOBILE COMPANY CARDS
            ===================================================== */}

            {filteredCompanies.length > 0 && (

                <section className="companies-mobile-list">

                    {filteredCompanies.map(
                        (company) => (

                            <article
                                className="company-mobile-card"
                                key={
                                    company.id
                                }
                            >

                                <div className="company-mobile-top">

                                    <div className="company-mobile-profile">

                                        <div className="company-mobile-avatar">

                                            {getCompanyInitial(
                                                company.companyName
                                            )}

                                        </div>


                                        <div>

                                            <h3>
                                                {
                                                    company.companyName ||
                                                    "Unnamed Company"
                                                }
                                            </h3>

                                            <span>
                                                Registered company
                                            </span>

                                        </div>

                                    </div>


                                    <span className="company-status-badge">

                                        <FaCheckCircle />

                                        Registered

                                    </span>

                                </div>


                                <div className="company-mobile-details">

                                    <div className="mobile-detail-item">

                                        <span className="mobile-detail-label">

                                            <FaEnvelope />

                                            Email

                                        </span>

                                        <strong>
                                            {
                                                company.email ||
                                                "Not available"
                                            }
                                        </strong>

                                    </div>


                                    <div className="mobile-detail-item">

                                        <span className="mobile-detail-label">

                                            <FaPhone />

                                            Phone

                                        </span>

                                        <strong>
                                            {
                                                company.phone ||
                                                "Not available"
                                            }
                                        </strong>

                                    </div>


                                    <div className="mobile-detail-item">

                                        <span className="mobile-detail-label">

                                            <FaIndustry />

                                            Industry

                                        </span>

                                        <strong>
                                            {
                                                company.industry ||
                                                "Not specified"
                                            }
                                        </strong>

                                    </div>


                                    <div className="mobile-detail-item">

                                        <span className="mobile-detail-label">

                                            <FaMapMarkerAlt />

                                            Location

                                        </span>

                                        <strong>
                                            {
                                                company.location ||
                                                "Not available"
                                            }
                                        </strong>

                                    </div>


                                    {company.website && (

                                        <div className="mobile-detail-item mobile-website-item">

                                            <span className="mobile-detail-label">

                                                <FaGlobe />

                                                Website

                                            </span>


                                            <a
                                                href={
                                                    getWebsiteUrl(
                                                        company.website
                                                    )
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >

                                                {
                                                    getWebsiteDisplay(
                                                        company.website
                                                    )
                                                }

                                            </a>

                                        </div>

                                    )}

                                </div>


                                <div className="company-mobile-actions">

                                    <button
                                        type="button"
                                        className="company-view-btn"
                                        onClick={() =>
                                            viewCompany(
                                                company
                                            )
                                        }
                                    >

                                        <FaEye />

                                        View Details

                                    </button>


                                    <button
                                        type="button"
                                        className="company-delete-btn"
                                        onClick={() =>
                                            deleteCompany(
                                                company.id
                                            )
                                        }
                                        disabled={
                                            deletingId ===
                                            company.id
                                        }
                                    >

                                        <FaTrash />

                                        {deletingId ===
                                        company.id
                                            ? "Deleting..."
                                            : "Delete"
                                        }

                                    </button>

                                </div>

                            </article>

                        )
                    )}

                </section>

            )}


            {/* =====================================================
                COMPANY DETAILS MODAL
            ===================================================== */}

            {selectedCompany && (

                <div
                    className="company-modal-overlay"
                    onClick={
                        closeModal
                    }
                >

                    <div
                        className="company-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >


                        {/* HEADER */}

                        <div className="company-modal-header">

                            <div className="company-modal-avatar">

                                {getCompanyInitial(
                                    selectedCompany.companyName
                                )}

                            </div>


                            <div className="company-modal-title">

                                <span>
                                    COMPANY PROFILE
                                </span>

                                <h2>
                                    {
                                        selectedCompany.companyName ||
                                        "Unnamed Company"
                                    }
                                </h2>

                                <p>
                                    Registered company information
                                </p>

                            </div>


                            <button
                                type="button"
                                className="company-modal-close"
                                onClick={
                                    closeModal
                                }
                                aria-label="Close company details"
                            >

                                <FaTimes />

                            </button>

                        </div>


                        {/* BODY */}

                        <div className="company-modal-body">


                            {/* BASIC INFORMATION */}

                            <section className="company-modal-section">

                                <div className="company-modal-section-heading">

                                    <div className="company-section-icon">

                                        <FaBuilding />

                                    </div>


                                    <div>

                                        <h3>
                                            Company Information
                                        </h3>

                                        <p>
                                            Basic information about this company.
                                        </p>

                                    </div>

                                </div>


                                <div className="company-detail-grid">

                                    <div className="company-detail-item">

                                        <span>

                                            <FaBuilding />

                                            Company Name

                                        </span>

                                        <strong>
                                            {
                                                selectedCompany.companyName ||
                                                "Not available"
                                            }
                                        </strong>

                                    </div>


                                    <div className="company-detail-item">

                                        <span>

                                            <FaIndustry />

                                            Industry

                                        </span>

                                        <strong>
                                            {
                                                selectedCompany.industry ||
                                                "Not specified"
                                            }
                                        </strong>

                                    </div>


                                    <div className="company-detail-item">

                                        <span>

                                            <FaEnvelope />

                                            Email

                                        </span>

                                        <strong className="long-value">
                                            {
                                                selectedCompany.email ||
                                                "Not available"
                                            }
                                        </strong>

                                    </div>


                                    <div className="company-detail-item">

                                        <span>

                                            <FaPhone />

                                            Phone

                                        </span>

                                        <strong>
                                            {
                                                selectedCompany.phone ||
                                                "Not available"
                                            }
                                        </strong>

                                    </div>


                                    <div className="company-detail-item full-width">

                                        <span>

                                            <FaMapMarkerAlt />

                                            Location

                                        </span>

                                        <strong>
                                            {
                                                selectedCompany.location ||
                                                "Not available"
                                            }
                                        </strong>

                                    </div>

                                </div>

                            </section>


                            {/* WEBSITE */}

                            <section className="company-modal-section">

                                <div className="company-modal-section-heading">

                                    <div className="company-section-icon">

                                        <FaGlobe />

                                    </div>


                                    <div>

                                        <h3>
                                            Company Website
                                        </h3>

                                        <p>
                                            Official website of the company.
                                        </p>

                                    </div>

                                </div>


                                <div className="company-website-box">

                                    <div className="company-website-label">

                                        <FaGlobe />

                                        <span>
                                            Website
                                        </span>

                                    </div>


                                    {selectedCompany.website ? (

                                        <a
                                            href={
                                                getWebsiteUrl(
                                                    selectedCompany.website
                                                )
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="company-modal-website-link"
                                        >

                                            <span>
                                                {
                                                    getWebsiteDisplay(
                                                        selectedCompany.website
                                                    )
                                                }
                                            </span>

                                            <FaExternalLinkAlt />

                                        </a>

                                    ) : (

                                        <strong>
                                            Website not available
                                        </strong>

                                    )}

                                </div>

                            </section>


                            {/* DESCRIPTION */}

                            <section className="company-modal-section">

                                <div className="company-modal-section-heading">

                                    <div className="company-section-icon">

                                        <FaAlignLeft />

                                    </div>


                                    <div>

                                        <h3>
                                            About Company
                                        </h3>

                                        <p>
                                            Company description and overview.
                                        </p>

                                    </div>

                                </div>


                                <div className="company-description">

                                    <FaAlignLeft />

                                    <p>

                                        {
                                            selectedCompany.description ||
                                            "No company description has been added."
                                        }

                                    </p>

                                </div>

                            </section>

                        </div>


                        {/* FOOTER */}

                        <div className="company-modal-footer">

                            <div className="company-modal-status">

                                <FaCheckCircle />

                                <span>
                                    Registered company
                                </span>

                            </div>


                            <div className="company-modal-actions">

                                <button
                                    type="button"
                                    className="company-modal-delete"
                                    onClick={() =>
                                        deleteCompany(
                                            selectedCompany.id
                                        )
                                    }
                                    disabled={
                                        deletingId ===
                                        selectedCompany.id
                                    }
                                >

                                    <FaTrash />

                                    {deletingId ===
                                    selectedCompany.id
                                        ? "Deleting..."
                                        : "Delete Company"
                                    }

                                </button>


                                <button
                                    type="button"
                                    className="company-modal-close-btn"
                                    onClick={
                                        closeModal
                                    }
                                >
                                    Close
                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}


export default ManageCompanies;