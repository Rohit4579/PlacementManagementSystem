import {
    useEffect,
    useState
} from "react";

import {
    useLocation,
    useNavigate
} from "react-router-dom";

import {
    FaGraduationCap,
    FaEnvelope,
    FaLock
} from "react-icons/fa";

import {
    useAuth
} from "../../context/AuthContext";

import {
    loginUser,
    loginWithGoogle,
    resetPassword
} from "../../services/authService";

import sendEmail from "../../services/emailService";

import "./Login.css";


// =====================================================
// CONSTANTS
// =====================================================

const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;


// =====================================================
// HELPERS
// =====================================================

const normalizeEmail = (email) => {

    return String(email || "")
        .trim()
        .toLowerCase();

};


const isValidEmail = (email) => {

    if (
        !email ||
        email.length > MAX_EMAIL_LENGTH
    ) {
        return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(
        email
    );

};


// =====================================================
// ROLE NAVIGATION
// =====================================================

const navigateByRole = (
    user,
    navigate
) => {

    if (!user) {
        return false;
    }

    const role =
        String(user.role || "")
            .trim()
            .toLowerCase();


    if (role === "student") {

        navigate(
            "/student/dashboard",
            {
                replace: true
            }
        );

        return true;
    }


    if (role === "company") {

        navigate(
            "/company/dashboard",
            {
                replace: true
            }
        );

        return true;
    }


    if (role === "admin") {

        navigate(
            "/admin/dashboard",
            {
                replace: true
            }
        );

        return true;
    }


    return false;
};


// =====================================================
// GOOGLE ICON
// =====================================================

function GoogleIcon() {

    return (

        <svg
            className="google-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >

            <path
                fill="#4285F4"
                d="M21.35 12.27c0-.79-.07-1.55-.21-2.27H12v4.3h5.23a4.47 4.47 0 0 1-1.94 2.93v2.45h3.14c1.84-1.69 2.92-4.18 2.92-7.41z"
            />

            <path
                fill="#34A853"
                d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.29v2.53A9.74 9.74 0 0 0 12 21.75z"
            />

            <path
                fill="#FBBC05"
                d="M6.54 13.84A5.85 5.85 0 0 1 6.23 12c0-.64.11-1.26.31-1.84V7.63H3.29A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.04 4.37l3.25-2.53z"
            />

            <path
                fill="#EA4335"
                d="M12 6.13c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.84 3.2 14.63 2.25 12 2.25a9.74 9.74 0 0 0-8.71 5.38l3.25 2.53c.77-2.31 2.92-4.03 5.46-4.03z"
            />

        </svg>

    );

}


// =====================================================
// LOGIN
// =====================================================

function Login() {

    const navigate =
        useNavigate();

    const location =
        useLocation();


    const {
        user,
        loading: authLoading
    } = useAuth();


    // =================================================
    // FORM
    // =================================================

    const [data, setData] =
        useState({
            email: "",
            password: ""
        });


    // =================================================
    // LOADING
    // =================================================

    const [loading, setLoading] =
        useState(false);

    const [googleLoading, setGoogleLoading] =
        useState(false);

    const [resetLoading, setResetLoading] =
        useState(false);


    // =================================================
    // MESSAGES
    // =================================================

    const [errorMessage, setErrorMessage] =
        useState("");

    const [successMessage, setSuccessMessage] =
        useState("");


    // =================================================
    // AUTH SESSION RESTORATION
    // =================================================

    useEffect(() => {

        if (authLoading) {
            return;
        }


        if (!user) {
            return;
        }


        const navigated =
            navigateByRole(
                user,
                navigate
            );


        if (!navigated) {

            setErrorMessage(
                "Your account role could not be verified. Please contact the administrator."
            );
        }

    }, [
        user,
        authLoading,
        navigate
    ]);


    // =================================================
    // ROLE ERROR
    // =================================================

    useEffect(() => {

        if (
            location.state?.roleError
        ) {

            setErrorMessage(
                "Your account exists, but your account role could not be verified. Please contact the administrator."
            );


            navigate(
                location.pathname,
                {
                    replace: true,
                    state: {}
                }
            );
        }

    }, [
        location,
        navigate
    ]);


    // =================================================
    // INPUT CHANGE
    // =================================================

    const change = (e) => {

        const {
            name,
            value
        } = e.target;


        setErrorMessage("");
        setSuccessMessage("");


        setData(
            previousData => ({
                ...previousData,
                [name]: value
            })
        );
    };


    // =================================================
    // VALIDATE FORM
    // =================================================

    const validateForm = () => {

        const email =
            normalizeEmail(
                data.email
            );

        const password =
            data.password;


        if (!email) {
            return "Please enter your email address.";
        }


        if (
            email.length >
            MAX_EMAIL_LENGTH
        ) {
            return "Email address is too long.";
        }


        if (!isValidEmail(email)) {
            return "Please enter a valid email address.";
        }


        if (!password) {
            return "Please enter your password.";
        }


        if (
            password.length >
            MAX_PASSWORD_LENGTH
        ) {
            return "Invalid email or password.";
        }


        return null;
    };


    // =================================================
    // LOGIN EMAIL NOTIFICATION
    // =================================================

    const sendLoginNotification = async (
        authenticatedUser,
        google = false
    ) => {

        try {

            if (
                !authenticatedUser?.email
            ) {
                return;
            }


            await sendEmail({

                to:
                    authenticatedUser.email,

                subject:
                    google
                        ? "Successful Google Login - Placement Management System"
                        : "Successful Login - Placement Management System",

                message:

                    google

                        ? `Hello ${authenticatedUser.name || "User"},

You have successfully logged in to the Placement Management System using Google.

If this was not you, please contact the administrator immediately.

Regards,
Placement Management System`

                        : `Hello ${authenticatedUser.name || "User"},

You have successfully logged in to the Placement Management System.

Your account was accessed successfully.

If this was not you, please contact the administrator immediately.

Regards,
Placement Management System`

            });

        }
        catch (error) {

            console.error(
                "Login notification failed:",
                error
            );

            // Never block authentication.
        }
    };


    // =================================================
    // EMAIL/PASSWORD LOGIN
    // =================================================

    const submit = async (e) => {

        e.preventDefault();


        if (
            loading ||
            googleLoading ||
            resetLoading
        ) {
            return;
        }


        setErrorMessage("");
        setSuccessMessage("");


        const validationError =
            validateForm();


        if (validationError) {

            setErrorMessage(
                validationError
            );

            return;
        }


        const email =
            normalizeEmail(
                data.email
            );

        const password =
            data.password;


        try {

            setLoading(true);


            const authenticatedUser =
                await loginUser(
                    email,
                    password
                );


            if (!authenticatedUser) {

                setErrorMessage(
                    "Unable to load your account profile. Please try again."
                );

                return;
            }


            await sendLoginNotification(
                authenticatedUser,
                false
            );


            const navigated =
                navigateByRole(
                    authenticatedUser,
                    navigate
                );


            if (navigated) {
                return;
            }


            setErrorMessage(
                "Your account could not be authorized. Please contact the administrator."
            );

        }
        catch (error) {

            console.error(
                "Login authentication failed:",
                error
            );


            let message =
                "Invalid email or password.";


            switch (error?.code) {

                case "auth/too-many-requests":

                    message =
                        "Too many login attempts. Please wait and try again later.";

                    break;


                case "auth/network-request-failed":

                    message =
                        "Network error. Please check your connection and try again.";

                    break;


                case "auth/user-disabled":

                    message =
                        "This account is currently unavailable. Please contact the administrator.";

                    break;


                case "auth/invalid-email":

                    message =
                        "Please enter a valid email address.";

                    break;


                case "user-profile-not-found":

                    message =
                        "Your account was authenticated, but your user profile could not be found. Please contact the administrator.";

                    break;


                default:
                    break;
            }


            setErrorMessage(
                message
            );

        }
        finally {

            setLoading(false);
        }
    };


    // =================================================
    // GOOGLE LOGIN
    // =================================================

    const handleGoogleLogin = async () => {

        if (
            loading ||
            googleLoading ||
            resetLoading
        ) {
            return;
        }


        setErrorMessage("");
        setSuccessMessage("");


        /*
         * IMPORTANT:
         *
         * We intentionally pass the email/password
         * from the form.
         *
         * This allows authService to safely handle:
         *
         * Google account
         *       ↓
         * existing password account
         *       ↓
         * verify password
         *       ↓
         * link Google
         */

        const email =
            normalizeEmail(
                data.email
            );

        const password =
            data.password;


        try {

            setGoogleLoading(true);


            const authenticatedUser =
                await loginWithGoogle(
                    email,
                    password
                );


            if (!authenticatedUser) {

                setErrorMessage(
                    "Unable to complete Google login. Please try again."
                );

                return;
            }


            if (
                authenticatedUser.linkedGoogle
            ) {

                setSuccessMessage(
                    "Google has been safely linked to your existing account. Your existing password has not been changed."
                );
            }


            await sendLoginNotification(
                authenticatedUser,
                true
            );


            const navigated =
                navigateByRole(
                    authenticatedUser,
                    navigate
                );


            if (navigated) {
                return;
            }


            setErrorMessage(
                "Your account could not be authorized. Please contact the administrator."
            );

        }
        catch (error) {

            console.error(
                "Google login failed:",
                error
            );


            let message =
                "Unable to login with Google. Please try again.";


            switch (error?.code) {

                case "auth/password-required-for-linking":

                    message =
                        "This email already has a password account. Enter your existing password above, then click Continue with Google again to safely link Google.";

                    break;


                case "auth/wrong-password":

                    message =
                        "The existing password is incorrect. Enter your current password and try Google again.";

                    break;


                case "auth/invalid-credential":

                    message =
                        "The existing email or password could not be verified. Enter the current password for this account and try again.";

                    break;


                case "auth/user-not-found":

                    message =
                        "No password account was found for this email.";

                    break;


                case "auth/popup-closed-by-user":

                    message =
                        "Google login was cancelled.";

                    break;


                case "auth/popup-blocked":

                    message =
                        "Google login popup was blocked. Please allow popups and try again.";

                    break;


                case "auth/network-request-failed":

                    message =
                        "Network error. Please check your connection and try again.";

                    break;


                case "auth/credential-already-in-use":

                    message =
                        "This Google account is already connected to another Placement Management account.";

                    break;


                case "auth/provider-already-linked":

                    message =
                        "Google is already linked to this account.";

                    break;


                case "auth/email-already-in-use":

                    message =
                        "This email is already connected to another account.";

                    break;


                case "user-profile-not-found":

                    message =
                        "Your Google account was authenticated, but your Placement Management profile could not be found.";

                    break;


                case "google-credential-unavailable":

                    message =
                        "Google could not provide the required login information. Please try again.";

                    break;


                default:
                    break;
            }


            setErrorMessage(
                message
            );

        }
        finally {

            setGoogleLoading(false);
        }
    };


    // =================================================
    // FORGOT PASSWORD
    // =================================================

    const handleForgotPassword = async () => {

        if (
            loading ||
            googleLoading ||
            resetLoading
        ) {
            return;
        }


        setErrorMessage("");
        setSuccessMessage("");


        const email =
            normalizeEmail(
                data.email
            );


        if (!email) {

            setErrorMessage(
                "Please enter your email address first."
            );

            return;
        }


        if (!isValidEmail(email)) {

            setErrorMessage(
                "Please enter a valid email address."
            );

            return;
        }


        try {

            setResetLoading(true);


            await resetPassword(
                email
            );


            setSuccessMessage(
                "If an account exists with this email, a password reset link has been sent. Please check your inbox and spam folder."
            );

        }
        catch (error) {

            console.error(
                "Password reset failed:",
                error
            );


            let message =
                "Unable to process password reset. Please try again.";


            if (
                error?.code ===
                "auth/invalid-email"
            ) {

                message =
                    "Please enter a valid email address.";
            }

            else if (
                error?.code ===
                "auth/too-many-requests"
            ) {

                message =
                    "Too many password reset requests. Please try again later.";
            }

            else if (
                error?.code ===
                "auth/network-request-failed"
            ) {

                message =
                    "Network error. Please check your connection and try again.";
            }


            setErrorMessage(
                message
            );

        }
        finally {

            setResetLoading(false);
        }
    };


    // =================================================
    // REGISTER
    // =================================================

    const goToRegister = () => {

        if (
            !loading &&
            !googleLoading &&
            !resetLoading
        ) {

            navigate(
                "/register"
            );
        }
    };


    // =================================================
    // SESSION LOADING
    // =================================================

    if (authLoading) {

        return (

            <div className="auth-page">

                <div className="session-loading-card">

                    <div className="brand-mark small">

                        <FaGraduationCap />

                    </div>

                    <h2>
                        PlacementPro
                    </h2>

                    <p>
                        Checking your login session...
                    </p>

                    <div className="loading-spinner" />

                </div>

            </div>
        );
    }


    // =================================================
    // ALREADY LOGGED IN
    // =================================================

    if (user) {

        return (

            <div className="auth-page">

                <div className="session-loading-card">

                    <div className="brand-mark small">

                        <FaGraduationCap />

                    </div>

                    <h2>
                        PlacementPro
                    </h2>

                    <p>
                        Opening your dashboard...
                    </p>

                    <div className="loading-spinner" />

                </div>

            </div>
        );
    }


    // =================================================
    // DISABLED
    // =================================================

    const disabled =
        loading ||
        googleLoading ||
        resetLoading;


    // =================================================
    // RENDER
    // =================================================

    return (

        <div className="auth-page">

            <div className="auth-shell">


                {/* ==========================================
                    LEFT LOGIN PANEL
                ========================================== */}

                <section className="auth-form-panel">

                    <div className="auth-form-content">


                        {/* BRAND */}

                        <div className="auth-brand">

                            <div className="brand-mark">

                                <FaGraduationCap />

                            </div>

                            <div>

                                <div className="brand-name">

                                    Placement
                                    <span>
                                        Pro
                                    </span>

                                </div>

                                <div className="brand-subtitle">

                                    Placement Management System

                                </div>

                            </div>

                        </div>


                        {/* HEADING */}

                        <div className="auth-heading">

                            <h1>
                                Welcome Back!
                            </h1>

                            <p>
                                Sign in to continue your placement journey.
                            </p>

                        </div>


                        {/* ERROR */}

                        {errorMessage && (

                            <div
                                role="alert"
                                aria-live="polite"
                                className="auth-message error"
                            >

                                <span className="message-icon">
                                    !
                                </span>

                                <span>
                                    {errorMessage}
                                </span>

                            </div>

                        )}


                        {/* SUCCESS */}

                        {successMessage && (

                            <div
                                role="status"
                                aria-live="polite"
                                className="auth-message success"
                            >

                                <span className="message-icon">
                                    ✓
                                </span>

                                <span>
                                    {successMessage}
                                </span>

                            </div>

                        )}


                        {/* FORM */}

                        <form
                            onSubmit={submit}
                            noValidate
                            className="login-form"
                        >


                            {/* EMAIL */}

                            <div className="field-group">

                                <label htmlFor="login-email">
                                    Email Address
                                </label>

                                <div className="input-wrapper">

                                    <FaEnvelope className="field-icon" />

                                    <input
                                        id="login-email"
                                        name="email"
                                        type="email"
                                        placeholder="Email Address"
                                        value={data.email}
                                        onChange={change}
                                        required
                                        maxLength={MAX_EMAIL_LENGTH}
                                        autoComplete="email"
                                        autoCapitalize="none"
                                        spellCheck="false"
                                        inputMode="email"
                                        disabled={disabled}
                                    />

                                </div>

                            </div>


                            {/* PASSWORD */}

                            <div className="field-group">

                                <label htmlFor="login-password">
                                    Password
                                </label>

                                <div className="input-wrapper">

                                    <FaLock className="field-icon" />

                                    <input
                                        id="login-password"
                                        name="password"
                                        type="password"
                                        placeholder="Password"
                                        value={data.password}
                                        onChange={change}
                                        required
                                        maxLength={MAX_PASSWORD_LENGTH}
                                        autoComplete="current-password"
                                        disabled={disabled}
                                    />

                                </div>

                            </div>


                            {/* FORGOT PASSWORD */}

                            <div className="forgot-row">

                                <span />

                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    disabled={disabled}
                                    className="forgot-btn"
                                >

                                    {resetLoading
                                        ? "Sending..."
                                        : "Forgot Password?"
                                    }

                                </button>

                            </div>


                            {/* LOGIN */}

                            <button
                                type="submit"
                                className="auth-primary-btn"
                                disabled={disabled}
                            >

                                {loading && (
                                    <span className="button-spinner" />
                                )}

                                {loading
                                    ? "Logging in..."
                                    : "Login"
                                }

                            </button>

                        </form>


                        {/* DIVIDER */}

                        <div className="auth-divider">

                            <span />

                            <strong>
                                OR
                            </strong>

                            <span />

                        </div>


                        {/* GOOGLE */}

                        <button
                            type="button"
                            className="google-btn"
                            onClick={handleGoogleLogin}
                            disabled={disabled}
                        >

                            <GoogleIcon />

                            <span>

                                {googleLoading
                                    ? "Connecting to Google..."
                                    : "Continue with Google"
                                }

                            </span>

                        </button>


                        {/* GOOGLE HELP */}

                        <div
                            style={{
                                marginTop: "10px",
                                fontSize: "12px",
                                lineHeight: "1.5",
                                textAlign: "center",
                                color: "#64748b"
                            }}
                        >

                            If this email already has a password
                            account, enter your existing password
                            above before using Google for the first
                            time.

                        </div>


                        {/* REGISTER */}

                        <div className="auth-register">

                            <span>
                                New user?
                            </span>

                            <button
                                type="button"
                                onClick={goToRegister}
                                disabled={disabled}
                            >

                                Register

                            </button>

                        </div>

                    </div>

                </section>


                {/* ==========================================
                    RIGHT VISUAL PANEL
                ========================================== */}

                <section className="auth-visual-panel">

                    <img
                        src="/placementpro-auth-illustration.png"
                        alt="Placement management and career opportunities"
                        className="placement-illustration"
                    />

                </section>

            </div>

        </div>
    );
}


export default Login;