import { useEffect, useState } from "react";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "firebase/firestore";

import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../context/AuthContext";

import "./ResumeUpload.css";


function ResumeUpload() {

    const { user } = useAuth();

    const [resumeURL, setResumeURL] = useState("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const [focused, setFocused] = useState(false);


    /* =========================================================
       LOAD RESUME
    ========================================================= */

    useEffect(() => {

        if (!user) {
            setLoading(false);
            return;
        }

        loadResume();

    }, [user]);


    const loadResume = async () => {

        try {

            setLoading(true);

            const profileRef = doc(
                db,
                "studentProfiles",
                user.uid
            );

            const snap = await getDoc(profileRef);


            if (snap.exists()) {

                const data = snap.data();

                setResumeURL(
                    data.resumeURL || ""
                );

            }

        } catch (error) {

            console.error(
                "Load Resume Error:",
                error
            );

            setMessage(
                "Unable to load your saved resume."
            );

            setMessageType("error");

        } finally {

            setLoading(false);

        }

    };


    /* =========================================================
       VALIDATE URL
    ========================================================= */

    const isValidURL = (value) => {

        try {

            const url = new URL(value);

            return (
                url.protocol === "http:" ||
                url.protocol === "https:"
            );

        } catch {

            return false;

        }

    };


    /* =========================================================
       INPUT CHANGE
    ========================================================= */

    const handleResumeChange = (event) => {

        const value = event.target.value;

        setResumeURL(value);

        if (message) {
            setMessage("");
            setMessageType("");
        }

    };


    /* =========================================================
       SAVE RESUME
    ========================================================= */

    const saveResume = async () => {

        setMessage("");
        setMessageType("");


        if (!user) {

            setMessage(
                "Please login before saving your resume."
            );

            setMessageType("error");

            return;

        }


        const cleanURL = resumeURL.trim();


        if (!cleanURL) {

            setMessage(
                "Please enter your resume link."
            );

            setMessageType("error");

            return;

        }


        if (!isValidURL(cleanURL)) {

            setMessage(
                "Please enter a valid public resume URL."
            );

            setMessageType("error");

            return;

        }


        try {

            setSaving(true);


            const profileRef = doc(
                db,
                "studentProfiles",
                user.uid
            );


            await setDoc(

                profileRef,

                {

                    uid: user.uid,

                    name: user.name || "",

                    email: user.email || "",

                    resumeURL: cleanURL,

                    updatedAt: serverTimestamp()

                },

                {

                    merge: true

                }

            );


            setResumeURL(cleanURL);

            setMessage(
                "Your resume link has been saved successfully."
            );

            setMessageType("success");


        } catch (error) {

            console.error(
                "Save Resume Error:",
                error
            );

            setMessage(
                error?.message ||
                "Unable to save your resume. Please try again."
            );

            setMessageType("error");

        } finally {

            setSaving(false);

        }

    };


    /* =========================================================
       KEYBOARD SUBMIT
    ========================================================= */

    const handleKeyDown = (event) => {

        if (
            event.key === "Enter" &&
            !saving
        ) {

            event.preventDefault();

            saveResume();

        }

    };


    /* =========================================================
       LOADING STATE
    ========================================================= */

    if (loading) {

        return (

            <div className="resume-upload">

                <div className="resume-card resume-card-loading">

                    <div className="resume-loading-spinner"></div>

                    <h2>
                        Loading your resume
                    </h2>

                    <p>
                        Please wait while we load your saved resume details.
                    </p>

                </div>

            </div>

        );

    }


    /* =========================================================
       MAIN UI
    ========================================================= */

    return (

        <div className="resume-upload">

            <div className="resume-card">


                {/* =================================================
                   CARD HEADER
                ================================================= */}

                <div className="resume-header">

                    <div className="resume-header-icon">

                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            aria-hidden="true"
                        >

                            <path
                                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                            />

                            <path
                                d="M14 2v6h6"
                            />

                            <path
                                d="M8 13h8"
                            />

                            <path
                                d="M8 17h5"
                            />

                        </svg>

                    </div>


                    <div className="resume-header-content">

                        <span className="resume-eyebrow">
                            Career Profile
                        </span>

                        <h1>
                            Upload Resume
                        </h1>

                        <p>
                            Add your latest resume so recruiters can
                            easily review your profile and experience.
                        </p>

                    </div>

                </div>


                {/* =================================================
                   INFO BANNER
                ================================================= */}

                <div className="resume-info-banner">

                    <div className="resume-info-icon">

                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                        >

                            <circle
                                cx="12"
                                cy="12"
                                r="9"
                            />

                            <path
                                d="M12 11v5"
                            />

                            <path
                                d="M12 8h.01"
                            />

                        </svg>

                    </div>


                    <div>

                        <strong>
                            Use a public resume link
                        </strong>

                        <p>
                            Upload your resume to Google Drive,
                            OneDrive, Dropbox, or another service and
                            paste the public sharing link below.
                        </p>

                    </div>

                </div>


                {/* =================================================
                   FORM
                ================================================= */}

                <div className="resume-form">


                    <div className="resume-form-group">

                        <label
                            htmlFor="resume-url"
                        >

                            Resume URL

                            <span>
                                *
                            </span>

                        </label>


                        <div
                            className={
                                `resume-input-wrapper ${
                                    focused
                                        ? "is-focused"
                                        : ""
                                }`
                            }
                        >

                            <div className="resume-input-icon">

                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    aria-hidden="true"
                                >

                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="9"
                                    />

                                    <path
                                        d="M8.5 12h7"
                                    />

                                    <path
                                        d="M12 8.5v7"
                                    />

                                </svg>

                            </div>


                            <input

                                id="resume-url"

                                className="resume-input"

                                type="url"

                                value={resumeURL}

                                placeholder="https://drive.google.com/..."

                                autoComplete="url"

                                onChange={
                                    handleResumeChange
                                }

                                onKeyDown={
                                    handleKeyDown
                                }

                                onFocus={() =>
                                    setFocused(true)
                                }

                                onBlur={() =>
                                    setFocused(false)
                                }

                            />


                            {resumeURL && (

                                <button
                                    type="button"
                                    className="resume-clear-btn"
                                    aria-label="Clear resume URL"
                                    onClick={() => {
                                        setResumeURL("");
                                        setMessage("");
                                        setMessageType("");
                                    }}
                                >

                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        aria-hidden="true"
                                    >

                                        <path
                                            d="M6 6l12 12"
                                        />

                                        <path
                                            d="M18 6L6 18"
                                        />

                                    </svg>

                                </button>

                            )}

                        </div>


                        <small className="resume-help">

                            Make sure anyone with the link can view
                            the resume.

                        </small>

                    </div>


                    {/* =================================================
                       SAVE BUTTON
                    ================================================= */}

                    <button

                        type="button"

                        className="upload-btn"

                        onClick={saveResume}

                        disabled={
                            saving ||
                            !resumeURL.trim()
                        }

                    >

                        {saving ? (

                            <>

                                <span
                                    className="resume-btn-spinner"
                                    aria-hidden="true"
                                />

                                Saving Resume...

                            </>

                        ) : (

                            <>

                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    aria-hidden="true"
                                >

                                    <path
                                        d="M12 16V4"
                                    />

                                    <path
                                        d="M7 9l5-5 5 5"
                                    />

                                    <path
                                        d="M5 20h14"
                                    />

                                </svg>

                                Save Resume

                            </>

                        )}

                    </button>


                    {/* =================================================
                       STATUS MESSAGE
                    ================================================= */}

                    {message && (

                        <div
                            className={
                                `resume-message ${
                                    messageType === "success"
                                        ? "success"
                                        : "error"
                                }`
                            }
                            role="status"
                        >

                            {messageType === "success" ? (

                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    aria-hidden="true"
                                >

                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="9"
                                    />

                                    <path
                                        d="M8 12l2.5 2.5L16 9"
                                    />

                                </svg>

                            ) : (

                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    aria-hidden="true"
                                >

                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="9"
                                    />

                                    <path
                                        d="M12 8v5"
                                    />

                                    <path
                                        d="M12 16h.01"
                                    />

                                </svg>

                            )}

                            <span>
                                {message}
                            </span>

                        </div>

                    )}

                </div>


                {/* =================================================
                   RESUME ADDED
                ================================================= */}

                {resumeURL && (

                    <div className="resume-preview">


                        <div className="resume-preview-left">

                            <div className="resume-document-icon">

                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    aria-hidden="true"
                                >

                                    <path
                                        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                    />

                                    <path
                                        d="M14 2v6h6"
                                    />

                                    <path
                                        d="M8 13h8"
                                    />

                                    <path
                                        d="M8 17h5"
                                    />

                                </svg>

                            </div>


                            <div className="resume-preview-info">

                                <div className="resume-added">

                                    <span className="resume-success-dot"></span>

                                    Resume Added

                                </div>

                                <p>
                                    Your resume link is currently
                                    connected to your profile.
                                </p>

                                <span
                                    className="resume-url-text"
                                    title={resumeURL}
                                >
                                    {resumeURL}
                                </span>

                            </div>

                        </div>


                        <a

                            href={resumeURL}

                            target="_blank"

                            rel="noopener noreferrer"

                            className="resume-btn"

                        >

                            View Resume

                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                aria-hidden="true"
                            >

                                <path
                                    d="M14 5h5v5"
                                />

                                <path
                                    d="M19 5l-9 9"
                                />

                                <path
                                    d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"
                                />

                            </svg>

                        </a>

                    </div>

                )}


                {/* =================================================
                   FOOTER
                ================================================= */}

                <div className="resume-footer">

                    <div className="resume-footer-item">

                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            aria-hidden="true"
                        >

                            <path
                                d="M12 3l7 4v5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V7l7-4z"
                            />

                            <path
                                d="M9 12l2 2 4-4"
                            />

                        </svg>

                        <span>
                            Keep your resume updated
                        </span>

                    </div>


                    <div className="resume-footer-item">

                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            aria-hidden="true"
                        >

                            <circle
                                cx="12"
                                cy="12"
                                r="9"
                            />

                            <path
                                d="M12 11v5"
                            />

                            <path
                                d="M12 8h.01"
                            />

                        </svg>

                        <span>
                            Recruiters can view your public link
                        </span>

                    </div>

                </div>


            </div>

        </div>

    );

}


export default ResumeUpload;
