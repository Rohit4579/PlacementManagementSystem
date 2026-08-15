import { useState, useEffect } from "react";

import "./CompanyProfile.css";

import { useAuth } from "../../context/AuthContext";

import {
    doc,
    setDoc,
    getDoc
} from "firebase/firestore";

import { db } from "../../firebase/firebaseConfig";

import {
    FaBuilding,
    FaEnvelope,
    FaGlobe,
    FaMapMarkerAlt,
    FaAlignLeft,
    FaSave,
    FaCheckCircle,
    FaPhone,
    FaIndustry,
    FaBriefcase,
    FaExternalLinkAlt
} from "react-icons/fa";


function CompanyProfile() {

    const { user } = useAuth();


    /* =====================================================
       COMPANY STATE
    ===================================================== */

    const [company, setCompany] = useState({

        companyName: "",
        email: "",
        phone: "",
        industry: "",
        website: "",
        location: "",
        description: ""

    });


    const [loading, setLoading] =
        useState(true);


    const [saving, setSaving] =
        useState(false);


    const [success, setSuccess] =
        useState(false);


    /* =====================================================
       PEXELS IMAGE STATE

       This is only visual.
       It does NOT affect company profile data.
    ===================================================== */

    const [companyImage, setCompanyImage] =
        useState("");


    const [imageLoading, setImageLoading] =
        useState(true);


    const [photographer, setPhotographer] =
        useState("");


    const [photographerUrl, setPhotographerUrl] =
        useState("");


    const [pexelsUrl, setPexelsUrl] =
        useState("");


    /* =====================================================
       LOAD COMPANY / WORKPLACE IMAGE
    ===================================================== */

    useEffect(() => {

        let cancelled = false;


        const loadCompanyImage = async () => {

            const apiKey =
                import.meta.env.VITE_PEXELS_API_KEY;


            /*
             * If API key is not configured,
             * keep the existing CSS design.
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


                /*
                 * Company / workplace / recruitment
                 * related images.
                 */

                const response =
                    await fetch(
                        "https://api.pexels.com/v1/search?query=modern%20office%20business%20team%20workplace%20recruitment&orientation=landscape&per_page=12",
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
                 * Use the first few relevant images
                 * and randomly select one.
                 */

                const photos =
                    data.photos.slice(0, 8);


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


                if (cancelled) {
                    return;
                }


                setCompanyImage(
                    selectedPhoto.src?.large2x ||
                    selectedPhoto.src?.large ||
                    selectedPhoto.src?.original ||
                    ""
                );


                setPhotographer(
                    selectedPhoto.photographer ||
                    "Pexels"
                );


                setPhotographerUrl(
                    selectedPhoto.photographer_url ||
                    "https://www.pexels.com/"
                );


                setPexelsUrl(
                    selectedPhoto.url ||
                    "https://www.pexels.com/"
                );

            }

            catch (error) {

                console.error(
                    "Pexels company image error:",
                    error
                );

            }

            finally {

                if (!cancelled) {

                    setImageLoading(false);

                }

            }

        };


        loadCompanyImage();


        return () => {

            cancelled = true;

        };

    }, []);


    /* =====================================================
       FETCH COMPANY PROFILE
       EXISTING LOGIC PRESERVED
    ===================================================== */

    useEffect(() => {

        const fetchCompany = async () => {

            if (!user) {

                setLoading(false);

                return;

            }


            try {

                const docRef =
                    doc(
                        db,
                        "companies",
                        user.uid
                    );


                const snap =
                    await getDoc(
                        docRef
                    );


                if (snap.exists()) {

                    const data =
                        snap.data();


                    setCompany({

                        companyName:
                            data.companyName ||
                            "",

                        email:
                            data.email ||
                            user.email ||
                            "",

                        phone:
                            data.phone ||
                            "",

                        industry:
                            data.industry ||
                            "",

                        website:
                            data.website ||
                            "",

                        location:
                            data.location ||
                            "",

                        description:
                            data.description ||
                            ""

                    });

                }

                else {

                    setCompany({

                        companyName: "",

                        email:
                            user.email ||
                            "",

                        phone: "",

                        industry: "",

                        website: "",

                        location: "",

                        description: ""

                    });

                }

            }

            catch (error) {

                console.error(
                    "Company Profile Error:",
                    error
                );

            }

            finally {

                setLoading(false);

            }

        };


        fetchCompany();

    }, [user]);


    /* =====================================================
       HANDLE CHANGE
    ===================================================== */

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;


        setCompany(
            (previous) => ({

                ...previous,

                [name]: value

            })
        );


        setSuccess(false);

    };


    /* =====================================================
       SAVE PROFILE
       EXISTING FIRESTORE LOGIC PRESERVED
    ===================================================== */

    const handleSubmit = async (e) => {

        e.preventDefault();


        if (!user) {
            return;
        }


        try {

            setSaving(true);

            setSuccess(false);


            const companyData = {

                uid:
                    user.uid,

                companyName:
                    company.companyName.trim(),

                email:
                    user.email ||
                    company.email.trim(),

                phone:
                    company.phone.trim(),

                industry:
                    company.industry.trim(),

                website:
                    company.website.trim(),

                location:
                    company.location.trim(),

                description:
                    company.description.trim()

            };


            await setDoc(

                doc(
                    db,
                    "companies",
                    user.uid
                ),

                companyData,

                {
                    merge: true
                }

            );


            setCompany(
                companyData
            );


            setSuccess(true);


            setTimeout(() => {

                setSuccess(false);

            }, 3000);

        }

        catch (error) {

            console.error(
                "Profile Update Error:",
                error
            );

        }

        finally {

            setSaving(false);

        }

    };


    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {

        return (

            <div className="company-profile-loading">

                <div className="profile-loader"></div>

                <p>
                    Loading company profile...
                </p>

            </div>

        );

    }


    /* =====================================================
       UI
    ===================================================== */

    return (

        <div className="company-profile">


            {/* =================================================
                COMPANY IMAGE HERO
            ================================================= */}

            <div
                className={`company-photo-hero ${
                    imageLoading
                        ? "image-loading"
                        : ""
                }`}
            >

                {companyImage && (

                    <img
                        src={companyImage}
                        alt="Modern company workplace"
                        className="company-photo-image"
                    />

                )}


                <div className="company-photo-overlay"></div>


                <div className="company-photo-content">

                    <div className="company-photo-badge">

                        <FaBriefcase />

                        <span>
                            BUSINESS & RECRUITMENT
                        </span>

                    </div>


                    <h2>
                        Build your company presence
                    </h2>


                    <p>
                        Help students discover your organization,
                        opportunities and workplace culture.
                    </p>


                    {photographer && (

                        <div className="pexels-credit">

                            Photo by{" "}

                            {photographerUrl ? (

                                <a
                                    href={photographerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {photographer}
                                </a>

                            ) : (

                                photographer

                            )}

                            {pexelsUrl && (

                                <a
                                    href={pexelsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="pexels-open"
                                    aria-label="View photo on Pexels"
                                >
                                    <FaExternalLinkAlt />
                                </a>

                            )}

                        </div>

                    )}

                </div>

            </div>


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="profile-header">

                <div className="profile-header-left">

                    <div className="company-profile-icon">

                        <FaBuilding />

                    </div>


                    <div>

                        <span className="profile-eyebrow">

                            COMPANY SETTINGS

                        </span>


                        <h1>

                            Company Profile

                        </h1>


                        <p>

                            Manage your company information
                            and public profile details.

                        </p>

                    </div>

                </div>

            </div>


            {/* =================================================
                MAIN LAYOUT
            ================================================= */}

            <div className="profile-layout">


                {/* =================================================
                    PROFILE SUMMARY
                ================================================= */}

                <div className="profile-summary">


                    <div className="summary-avatar">

                        <FaBuilding />

                    </div>


                    <h2>

                        {company.companyName ||
                            "Your Company"}

                    </h2>


                    <p>

                        {company.email ||
                            "Company Account"}

                    </p>


                    <div className="summary-divider"></div>


                    <div className="summary-item">

                        <FaEnvelope />

                        <span>

                            {company.email ||
                                "Email not added"}

                        </span>

                    </div>


                    <div className="summary-item">

                        <FaPhone />

                        <span>

                            {company.phone ||
                                "Phone not added"}

                        </span>

                    </div>


                    <div className="summary-item">

                        <FaIndustry />

                        <span>

                            {company.industry ||
                                "Industry not added"}

                        </span>

                    </div>


                    <div className="summary-item">

                        <FaMapMarkerAlt />

                        <span>

                            {company.location ||
                                "Location not added"}

                        </span>

                    </div>


                    <div className="summary-item">

                        <FaGlobe />

                        <span>

                            {company.website ||
                                "Website not added"}

                        </span>

                    </div>

                </div>


                {/* =================================================
                    FORM
                ================================================= */}

                <form
                    className="company-profile-form"
                    onSubmit={handleSubmit}
                >

                    <div className="form-section">


                        <div className="form-section-header">

                            <div>

                                <h2>
                                    Company Information
                                </h2>

                                <p>
                                    Keep your company details
                                    up to date.
                                </p>

                            </div>

                        </div>


                        {/* COMPANY NAME */}

                        <div className="form-group">

                            <label htmlFor="companyName">
                                Company Name
                            </label>


                            <div className="input-wrapper">

                                <FaBuilding />

                                <input
                                    id="companyName"
                                    type="text"
                                    name="companyName"
                                    placeholder="Enter company name"
                                    value={
                                        company.companyName
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>

                        </div>


                        {/* EMAIL */}

                        <div className="form-group">

                            <label htmlFor="email">
                                Company Email
                            </label>


                            <div className="input-wrapper disabled-input">

                                <FaEnvelope />

                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={
                                        company.email ||
                                        user?.email ||
                                        ""
                                    }
                                    disabled
                                />

                            </div>


                            <small>

                                Your account email cannot be
                                changed from this page.

                            </small>

                        </div>


                        {/* PHONE + INDUSTRY */}

                        <div className="form-row">


                            <div className="form-group">

                                <label htmlFor="phone">
                                    Phone Number
                                </label>


                                <div className="input-wrapper">

                                    <FaPhone />

                                    <input
                                        id="phone"
                                        type="tel"
                                        name="phone"
                                        placeholder="+91 9876543210"
                                        value={
                                            company.phone
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                </div>

                            </div>


                            <div className="form-group">

                                <label htmlFor="industry">
                                    Industry
                                </label>


                                <div className="input-wrapper">

                                    <FaIndustry />

                                    <input
                                        id="industry"
                                        type="text"
                                        name="industry"
                                        placeholder="Information Technology"
                                        value={
                                            company.industry
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                </div>

                            </div>

                        </div>


                        {/* WEBSITE + LOCATION */}

                        <div className="form-row">


                            <div className="form-group">

                                <label htmlFor="website">
                                    Website
                                </label>


                                <div className="input-wrapper">

                                    <FaGlobe />

                                    <input
                                        id="website"
                                        type="text"
                                        name="website"
                                        placeholder="https://company.com"
                                        value={
                                            company.website
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                </div>

                            </div>


                            <div className="form-group">

                                <label htmlFor="location">
                                    Location
                                </label>


                                <div className="input-wrapper">

                                    <FaMapMarkerAlt />

                                    <input
                                        id="location"
                                        type="text"
                                        name="location"
                                        placeholder="Pune, Maharashtra"
                                        value={
                                            company.location
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                </div>

                            </div>

                        </div>


                        {/* DESCRIPTION */}

                        <div className="form-group">

                            <label htmlFor="description">
                                Company Description
                            </label>


                            <div className="textarea-wrapper">

                                <FaAlignLeft />

                                <textarea
                                    id="description"
                                    name="description"
                                    placeholder="Tell students about your company, culture, opportunities and work environment..."
                                    value={
                                        company.description
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                            </div>


                            <small>

                                A clear description helps students
                                understand your organization.

                            </small>

                        </div>


                    </div>


                    {/* =================================================
                        FORM FOOTER
                    ================================================= */}

                    <div className="form-footer">


                        {success && (

                            <div className="success-message">

                                <FaCheckCircle />

                                Profile updated successfully

                            </div>

                        )}


                        <button
                            type="submit"
                            className="save-profile-btn"
                            disabled={saving}
                        >

                            {saving ? (

                                <>

                                    <span className="button-spinner"></span>

                                    Saving...

                                </>

                            ) : (

                                <>

                                    <FaSave />

                                    Save Changes

                                </>

                            )}

                        </button>


                    </div>

                </form>

            </div>

        </div>

    );

}


export default CompanyProfile;