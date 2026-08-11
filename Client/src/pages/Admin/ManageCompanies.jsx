import { useEffect, useState } from "react";

import {
    collection,
    getDocs,
    deleteDoc,
    doc
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
    FaSyncAlt
} from "react-icons/fa";

import { db } from "../../firebase/firebaseConfig";

import "./ManageCompanies.css";

function ManageCompanies() {

    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [deletingId, setDeletingId] = useState(null);


    /* =========================================================
       NORMALIZE VALUE
    ========================================================= */

    const normalize = (value) => {

        if (value === undefined || value === null) {
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

        const value = normalize(website).trim();

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
       COMPANY INITIAL
    ========================================================= */

    const getCompanyInitial = (companyName) => {

        const name = normalize(companyName).trim();

        if (!name) {
            return "C";
        }

        return name.charAt(0).toUpperCase();
    };


    /* =========================================================
       FETCH COMPANIES
    ========================================================= */

    const fetchCompanies = async () => {

        try {

            setLoading(true);

            const companiesRef = collection(
                db,
                "companies"
            );

            const snapshot = await getDocs(
                companiesRef
            );

            const companiesData = snapshot.docs.map(
                (item) => {

                    const data = item.data() || {};

                    return {
                        id: item.id,

                        companyName:
                            normalize(data.companyName),

                        email:
                            normalize(data.email),

                        phone:
                            normalize(data.phone),

                        industry:
                            normalize(data.industry),

                        website:
                            normalize(data.website),

                        location:
                            normalize(data.location),

                        description:
                            normalize(data.description)
                    };
                }
            );

            setCompanies(companiesData);

        } catch (error) {

            console.error(
                "Admin Companies Error:",
                error
            );

            alert(
                error?.message ||
                "Unable to load companies."
            );

        } finally {

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
       FILTER COMPANIES
    ========================================================= */

    const filteredCompanies = companies.filter(
        (company) => {

            const searchText =
                search.trim().toLowerCase();

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
                company.description,
                company.id

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
       DELETE COMPANY
    ========================================================= */

    const deleteCompany = async (companyId) => {

        if (!companyId) {
            return;
        }

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this company? This action cannot be undone."
        );

        if (!confirmDelete) {
            return;
        }

        try {

            setDeletingId(companyId);

            await deleteDoc(
                doc(
                    db,
                    "companies",
                    companyId
                )
            );

            setCompanies(
                (previousCompanies) =>
                    previousCompanies.filter(
                        (company) =>
                            company.id !== companyId
                    )
            );

            if (
                selectedCompany &&
                selectedCompany.id === companyId
            ) {
                setSelectedCompany(null);
            }

            alert(
                "Company deleted successfully."
            );

        } catch (error) {

            console.error(
                "Delete Company Error:",
                error
            );

            alert(
                error?.message ||
                "Unable to delete company."
            );

        } finally {

            setDeletingId(null);
        }
    };


    /* =========================================================
       VIEW COMPANY
    ========================================================= */

    const viewCompany = (company) => {

        setSelectedCompany(company);
    };


    /* =========================================================
       CLOSE MODAL
    ========================================================= */

    const closeModal = () => {

        setSelectedCompany(null);
    };


    /* =========================================================
       CLOSE MODAL ON ESC
    ========================================================= */

    useEffect(() => {

        const handleEscape = (event) => {

            if (event.key === "Escape") {
                setSelectedCompany(null);
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
       LOADING
    ========================================================= */

    if (loading) {

        return (

            <div className="manage-companies-page">

                <div className="companies-state">

                    <div className="loading-spinner"></div>

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


            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="manage-companies-header">

                <div className="manage-companies-heading">

                    <span className="admin-page-label">
                        TPO / ADMIN
                    </span>

                    <h1>
                        Manage Companies
                    </h1>

                    <p>
                        View and manage all registered
                        company profiles.
                    </p>

                </div>


                <div className="company-total-card">

                    <div className="company-total-icon">
                        <FaBuilding />
                    </div>

                    <div>

                        <span>
                            Total Companies
                        </span>

                        <strong>
                            {companies.length}
                        </strong>

                    </div>

                </div>

            </div>


            {/* =================================================
                TOOLBAR
            ================================================= */}

            <div className="company-toolbar">

                <div className="company-search">

                    <FaSearch className="search-icon" />

                    <input
                        type="text"
                        placeholder="Search company, email, industry, location..."
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                    />

                    {search && (

                        <button
                            type="button"
                            className="clear-search-btn"
                            onClick={() => setSearch("")}
                            aria-label="Clear search"
                        >
                            <FaTimes />
                        </button>

                    )}

                </div>


                <div className="toolbar-right">

                    <div className="company-result-count">

                        Showing{" "}

                        <strong>
                            {filteredCompanies.length}
                        </strong>

                        {" "}of{" "}

                        <strong>
                            {companies.length}
                        </strong>

                        {" "}companies

                    </div>


                    <button
                        type="button"
                        className="refresh-company-btn"
                        onClick={fetchCompanies}
                        disabled={loading}
                    >

                        <FaSyncAlt />

                        Refresh

                    </button>

                </div>

            </div>


            {/* =================================================
                EMPTY STATE
            ================================================= */}

            {filteredCompanies.length === 0 && (

                <div className="companies-state">

                    <div className="empty-icon">
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
                            className="empty-clear-btn"
                            onClick={() => setSearch("")}
                        >
                            Clear Search
                        </button>

                    )}

                </div>

            )}


            {/* =================================================
                COMPANY TABLE
            ================================================= */}

            {filteredCompanies.length > 0 && (

                <div className="companies-table-card">

                    <div className="table-wrapper">

                        <table>

                            <thead>

                                <tr>

                                    <th>
                                        Company
                                    </th>

                                    <th>
                                        Contact
                                    </th>

                                    <th>
                                        Industry
                                    </th>

                                    <th>
                                        Location
                                    </th>

                                    <th>
                                        Website
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th className="actions-heading">
                                        Actions
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {filteredCompanies.map(
                                    (company) => (

                                        <tr
                                            key={company.id}
                                        >

                                            {/* COMPANY */}

                                            <td>

                                                <div className="company-info">

                                                    <div className="company-avatar">

                                                        {getCompanyInitial(
                                                            company.companyName
                                                        )}

                                                    </div>

                                                    <div className="company-name-wrapper">

                                                        <strong>

                                                            {
                                                                normalize(
                                                                    company.companyName
                                                                ) ||
                                                                "Unnamed Company"
                                                            }

                                                        </strong>

                                                        <small>

                                                            ID:{" "}
                                                            {company.id}

                                                        </small>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* CONTACT */}

                                            <td>

                                                <div
                                                    className="table-contact"
                                                    title={company.email}
                                                >

                                                    <FaEnvelope />

                                                    <span>

                                                        {
                                                            normalize(
                                                                company.email
                                                            ) ||
                                                            "Email unavailable"
                                                        }

                                                    </span>

                                                </div>


                                                {company.phone && (

                                                    <div
                                                        className="table-contact"
                                                        title={company.phone}
                                                    >

                                                        <FaPhone />

                                                        <span>
                                                            {company.phone}
                                                        </span>

                                                    </div>

                                                )}

                                            </td>


                                            {/* INDUSTRY */}

                                            <td>

                                                <span className="industry-badge">

                                                    <FaIndustry />

                                                    <span>

                                                        {
                                                            normalize(
                                                                company.industry
                                                            ) ||
                                                            "Not Specified"
                                                        }

                                                    </span>

                                                </span>

                                            </td>


                                            {/* LOCATION */}

                                            <td>

                                                <div
                                                    className="table-contact"
                                                    title={company.location}
                                                >

                                                    <FaMapMarkerAlt />

                                                    <span>

                                                        {
                                                            normalize(
                                                                company.location
                                                            ) ||
                                                            "Not Available"
                                                        }

                                                    </span>

                                                </div>

                                            </td>


                                            {/* WEBSITE */}

                                            <td>

                                                {company.website ? (

                                                    <a
                                                        href={getWebsiteUrl(
                                                            company.website
                                                        )}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="table-website"
                                                    >

                                                        <FaGlobe />

                                                        <span>
                                                            Visit Website
                                                        </span>

                                                    </a>

                                                ) : (

                                                    <span className="not-available">
                                                        Not Available
                                                    </span>

                                                )}

                                            </td>


                                            {/* STATUS */}

                                            <td>

                                                <span className="company-status">

                                                    <FaCheckCircle />

                                                    Registered

                                                </span>

                                            </td>


                                            {/* ACTIONS */}

                                            <td className="actions-cell">

                                                <div className="company-actions">

                                                    <button
                                                        type="button"
                                                        className="view-company-btn"
                                                        onClick={() =>
                                                            viewCompany(
                                                                company
                                                            )
                                                        }
                                                    >

                                                        <FaEye />

                                                        View

                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="delete-company-btn"
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

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            )}


            {/* =================================================
                COMPANY DETAILS MODAL
            ================================================= */}

            {selectedCompany && (

                <div
                    className="company-modal-overlay"
                    onClick={closeModal}
                >

                    <div
                        className="company-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >


                        {/* =================================================
                            DARK HEADER
                        ================================================= */}

                        <div className="company-modal-header">

                            <div className="company-modal-header-icon">

                                <FaBuilding />

                            </div>


                            <div className="modal-title-area">

                                <span className="modal-eyebrow">
                                    COMPANY DETAILS
                                </span>

                                <h2>

                                    {
                                        normalize(
                                            selectedCompany.companyName
                                        ) ||
                                        "Unnamed Company"
                                    }

                                </h2>

                                <p>
                                    Registered company profile
                                </p>

                            </div>


                            <button
                                type="button"
                                className="close-modal-btn"
                                onClick={closeModal}
                                aria-label="Close"
                            >

                                <FaTimes />

                            </button>

                        </div>


                        {/* =================================================
                            MODAL BODY
                        ================================================= */}

                        <div className="company-modal-body">


                            {/* =================================================
                                COMPANY INFORMATION
                            ================================================= */}

                            <section className="company-detail-section">

                                <div className="company-section-heading">

                                    <div className="section-heading-icon">

                                        <FaBuilding />

                                    </div>

                                    <div>

                                        <h3>
                                            Company Information
                                        </h3>

                                        <p>
                                            Basic details about the company.
                                        </p>

                                    </div>

                                </div>


                                <div className="company-detail-grid">


                                    {/* COMPANY NAME */}

                                    <div className="company-detail-card">

                                        <span>
                                            <FaBuilding />
                                            Company Name
                                        </span>

                                        <strong>

                                            {
                                                normalize(
                                                    selectedCompany.companyName
                                                ) ||
                                                "Not Available"
                                            }

                                        </strong>

                                    </div>


                                    {/* EMAIL */}

                                    <div className="company-detail-card">

                                        <span>
                                            <FaEnvelope />
                                            Email
                                        </span>

                                        <strong className="break-anywhere">

                                            {
                                                normalize(
                                                    selectedCompany.email
                                                ) ||
                                                "Not Available"
                                            }

                                        </strong>

                                    </div>


                                    {/* PHONE */}

                                    <div className="company-detail-card">

                                        <span>
                                            <FaPhone />
                                            Phone
                                        </span>

                                        <strong>

                                            {
                                                normalize(
                                                    selectedCompany.phone
                                                ) ||
                                                "Not Available"
                                            }

                                        </strong>

                                    </div>


                                    {/* INDUSTRY */}

                                    <div className="company-detail-card">

                                        <span>
                                            <FaIndustry />
                                            Industry
                                        </span>

                                        <strong>

                                            {
                                                normalize(
                                                    selectedCompany.industry
                                                ) ||
                                                "Not Available"
                                            }

                                        </strong>

                                    </div>


                                    {/* LOCATION */}

                                    <div className="company-detail-card">

                                        <span>
                                            <FaMapMarkerAlt />
                                            Location
                                        </span>

                                        <strong>

                                            {
                                                normalize(
                                                    selectedCompany.location
                                                ) ||
                                                "Not Available"
                                            }

                                        </strong>

                                    </div>

                                </div>

                            </section>


                            {/* =================================================
                                WEBSITE
                            ================================================= */}

                            <section className="company-detail-section">

                                <div className="company-section-heading">

                                    <div className="section-heading-icon">
                                        <FaGlobe />
                                    </div>

                                    <div>

                                        <h3>
                                            Website
                                        </h3>

                                        <p>
                                            Company website.
                                        </p>

                                    </div>

                                </div>


                                <div className="company-single-detail">

                                    <span>
                                        <FaGlobe />
                                        Website
                                    </span>


                                    {selectedCompany.website ? (

                                        <a
                                            href={getWebsiteUrl(
                                                selectedCompany.website
                                            )}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="company-website-link"
                                        >

                                            <FaGlobe />

                                            {
                                                selectedCompany.website
                                            }

                                        </a>

                                    ) : (

                                        <strong>
                                            Not Available
                                        </strong>

                                    )}

                                </div>

                            </section>


                            {/* =================================================
                                DESCRIPTION
                            ================================================= */}

                            <section className="company-detail-section">

                                <div className="company-section-heading">

                                    <div className="section-heading-icon">
                                        <FaAlignLeft />
                                    </div>

                                    <div>

                                        <h3>
                                            Description
                                        </h3>

                                        <p>
                                            About the company.
                                        </p>

                                    </div>

                                </div>


                                <div className="company-description-box">

                                    <FaAlignLeft />

                                    <p>

                                        {
                                            normalize(
                                                selectedCompany.description
                                            ) ||
                                            "No company description has been added."
                                        }

                                    </p>

                                </div>

                            </section>


                            {/* =================================================
                                LOCATION
                            ================================================= */}

                            <section className="company-detail-section">

                                <div className="company-section-heading">

                                    <div className="section-heading-icon">
                                        <FaMapMarkerAlt />
                                    </div>

                                    <div>

                                        <h3>
                                            Location
                                        </h3>

                                        <p>
                                            Registered company location.
                                        </p>

                                    </div>

                                </div>


                                <div className="company-description-box location-box">

                                    <FaMapMarkerAlt />

                                    <span>

                                        {
                                            normalize(
                                                selectedCompany.location
                                            ) ||
                                            "Location not available."
                                        }

                                    </span>

                                </div>

                            </section>

                        </div>


                        {/* =================================================
                            MODAL FOOTER
                        ================================================= */}

                        <div className="company-modal-footer">

                            <div className="modal-footer-note">

                                <FaCheckCircle />

                                <span>
                                    Admin / TPO can view company information.
                                </span>

                            </div>


                            <div className="modal-footer-actions">

                                <button
                                    type="button"
                                    className="modal-delete-btn"
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

                                    {
                                        deletingId ===
                                        selectedCompany.id
                                            ? "Deleting..."
                                            : "Delete"
                                    }

                                </button>


                                <button
                                    type="button"
                                    className="close-details-btn"
                                    onClick={closeModal}
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