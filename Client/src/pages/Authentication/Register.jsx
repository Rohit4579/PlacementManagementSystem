// src/pages/Authentication/Register.jsx

import {
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    FaGraduationCap,
    FaEnvelope,
    FaLock,
    FaUser,
    FaUserTie
} from "react-icons/fa";

import "./Register.css";

import {
    registerUser
} from "../../services/authService";


// =====================================================
// VALIDATION CONSTANTS
// =====================================================

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 80;

const MAX_EMAIL_LENGTH = 254;


// =====================================================
// HELPERS
// =====================================================

const normalizeName = (name) => {

    return name
        .trim()
        .replace(/\s+/g, " ");

};


const normalizeEmail = (email) => {

    return email
        .trim()
        .toLowerCase();

};


const isValidName = (name) => {

    if (
        name.length < MIN_NAME_LENGTH ||
        name.length > MAX_NAME_LENGTH
    ) {

        return false;

    }


    return /^[\p{L}\p{M}]+(?:[ .'-][\p{L}\p{M}]+)*$/u.test(name);

};


const isValidEmail = (email) => {

    if (
        !email ||
        email.length > MAX_EMAIL_LENGTH
    ) {

        return false;

    }


    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

};


const getPasswordErrors = (password) => {

    const errors = [];


    if (
        password.length <
        MIN_PASSWORD_LENGTH
    ) {

        errors.push(
            `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
        );

    }


    if (
        password.length >
        MAX_PASSWORD_LENGTH
    ) {

        errors.push(
            `Password must not exceed ${MAX_PASSWORD_LENGTH} characters.`
        );

    }


    if (!/[a-z]/.test(password)) {

        errors.push(
            "Password must contain at least one lowercase letter."
        );

    }


    if (!/[A-Z]/.test(password)) {

        errors.push(
            "Password must contain at least one uppercase letter."
        );

    }


    if (!/[0-9]/.test(password)) {

        errors.push(
            "Password must contain at least one number."
        );

    }


    if (!/[^A-Za-z0-9]/.test(password)) {

        errors.push(
            "Password must contain at least one special character."
        );

    }


    return errors;

};


// =====================================================
// REGISTER
// =====================================================

function Register() {

    const navigate = useNavigate();


    const [form, setForm] = useState({

        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "student"

    });


    const [loading, setLoading] =
        useState(false);


    const [errorMessage, setErrorMessage] =
        useState("");


    const [successMessage, setSuccessMessage] =
        useState("");


    // =================================================
    // INPUT
    // =================================================

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;


        setErrorMessage("");

        setSuccessMessage("");


        setForm((previousForm) => ({

            ...previousForm,

            [name]: value

        }));

    };


    // =================================================
    // VALIDATION
    // =================================================

    const validateForm = () => {

        const name =
            normalizeName(form.name);

        const email =
            normalizeEmail(form.email);

        const password =
            form.password;

        const confirmPassword =
            form.confirmPassword;


        if (!name) {

            return "Please enter your full name.";

        }


        if (
            name.length <
            MIN_NAME_LENGTH
        ) {

            return `Name must be at least ${MIN_NAME_LENGTH} characters.`;

        }


        if (
            name.length >
            MAX_NAME_LENGTH
        ) {

            return `Name must not exceed ${MAX_NAME_LENGTH} characters.`;

        }


        if (!isValidName(name)) {

            return "Name contains invalid characters.";

        }


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


        const passwordErrors =
            getPasswordErrors(password);


        if (
            passwordErrors.length > 0
        ) {

            return passwordErrors[0];

        }


        if (!confirmPassword) {

            return "Please confirm your password.";

        }


        if (
            password !== confirmPassword
        ) {

            return "Passwords do not match.";

        }


        const allowedRoles = [
            "student",
            "company"
        ];


        if (
            !allowedRoles.includes(form.role)
        ) {

            return "Invalid account type.";

        }


        return null;

    };


    // =================================================
    // SUBMIT
    // =================================================

    const handleSubmit = async (e) => {

        e.preventDefault();


        if (loading) {

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


        const name =
            normalizeName(form.name);

        const email =
            normalizeEmail(form.email);

        const password =
            form.password;


        const allowedRoles = [
            "student",
            "company"
        ];


        if (
            !allowedRoles.includes(form.role)
        ) {

            setErrorMessage(
                "Invalid account type."
            );

            return;

        }


        const role =
            form.role;


        try {

            setLoading(true);


            await registerUser(
                name,
                email,
                password,
                role
            );


            setSuccessMessage(
                "Registration successful. Redirecting to login..."
            );


            setForm({

                name: "",
                email: "",
                password: "",
                confirmPassword: "",
                role: "student"

            });


            setTimeout(() => {

                navigate("/login");

            }, 1000);

        }


        catch (error) {

            console.error(
                "Registration failed."
            );


            let message =
                "Registration failed. Please try again.";


            if (
                error?.code ===
                "auth/email-already-in-use"
            ) {

                message =
                    "This email cannot be used for registration.";

            }


            else if (
                error?.code ===
                "auth/invalid-email"
            ) {

                message =
                    "Please enter a valid email address.";

            }


            else if (
                error?.code ===
                "auth/weak-password"
            ) {

                message =
                    "Please choose a stronger password.";

            }


            else if (
                error?.code ===
                "auth/operation-not-allowed"
            ) {

                message =
                    "Registration is currently unavailable.";

            }


            else if (
                error?.code ===
                "auth/network-request-failed"
            ) {

                message =
                    "Network error. Please check your connection and try again.";

            }


            setErrorMessage(message);

        }


        finally {

            setLoading(false);

        }

    };


    // =================================================
    // LOGIN
    // =================================================

    const handleLogin = () => {

        if (!loading) {

            navigate("/login");

        }

    };


    // =================================================
    // RENDER
    // =================================================

    return (

        <div className="register-page">

            <div className="register-shell">

                {/* =====================================
                    LEFT VISUAL
                ===================================== */}

                <section className="register-visual">

                    <img
                        src="/placementpro-auth-illustration.png"
                        alt="Students and career opportunities"
                        className="register-illustration"
                    />

                </section>


                {/* =====================================
                    RIGHT FORM
                ===================================== */}

                <section className="register-form-panel">

                    <div className="register-form-content">

                        {/* BRAND */}

                        <div className="register-brand">

                            <div className="register-brand-mark">

                                <FaGraduationCap />

                            </div>

                            <div>

                                <div className="register-brand-name">

                                    Placement
                                    <span>
                                        Pro
                                    </span>

                                </div>

                                <div className="register-brand-subtitle">

                                    Placement Management System

                                </div>

                            </div>

                        </div>


                        {/* HEADING */}

                        <div className="register-heading">

                            <h1>
                                Create Account
                            </h1>

                            <p>
                                Start your placement journey today.
                            </p>

                        </div>


                        {/* ERROR */}

                        {errorMessage && (

                            <div
                                role="alert"
                                aria-live="polite"
                                className="register-message error"
                            >

                                <span className="register-message-icon">
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
                                className="register-message success"
                            >

                                <span className="register-message-icon">
                                    ✓
                                </span>

                                <span>
                                    {successMessage}
                                </span>

                            </div>

                        )}


                        {/* FORM */}

                        <form
                            onSubmit={handleSubmit}
                            noValidate
                            className="register-form"
                        >

                            {/* NAME */}

                            <div className="register-field">

                                <label htmlFor="register-name">
                                    Full Name
                                </label>

                                <div className="register-input-wrapper">

                                    <FaUser className="register-field-icon" />

                                    <input
                                        id="register-name"
                                        type="text"
                                        name="name"
                                        placeholder="Full Name"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                        minLength={MIN_NAME_LENGTH}
                                        maxLength={MAX_NAME_LENGTH}
                                        autoComplete="name"
                                        autoCapitalize="words"
                                        spellCheck="false"
                                        disabled={loading}
                                    />

                                </div>

                            </div>


                            {/* EMAIL */}

                            <div className="register-field">

                                <label htmlFor="register-email">
                                    Email Address
                                </label>

                                <div className="register-input-wrapper">

                                    <FaEnvelope className="register-field-icon" />

                                    <input
                                        id="register-email"
                                        type="email"
                                        name="email"
                                        placeholder="Email Address"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                        maxLength={MAX_EMAIL_LENGTH}
                                        autoComplete="email"
                                        inputMode="email"
                                        spellCheck="false"
                                        disabled={loading}
                                    />

                                </div>

                            </div>


                            {/* PASSWORD */}

                            <div className="register-field">

                                <label htmlFor="register-password">
                                    Password
                                </label>

                                <div className="register-input-wrapper">

                                    <FaLock className="register-field-icon" />

                                    <input
                                        id="register-password"
                                        type="password"
                                        name="password"
                                        placeholder="Password"
                                        value={form.password}
                                        onChange={handleChange}
                                        required
                                        minLength={MIN_PASSWORD_LENGTH}
                                        maxLength={MAX_PASSWORD_LENGTH}
                                        autoComplete="new-password"
                                        disabled={loading}
                                    />

                                </div>

                            </div>


                            {/* PASSWORD HELP */}

                            <small className="password-help">

                                At least 12 characters with uppercase,
                                lowercase, a number and a special character.

                            </small>


                            {/* CONFIRM */}

                            <div className="register-field">

                                <label htmlFor="register-confirm-password">
                                    Confirm Password
                                </label>

                                <div className="register-input-wrapper">

                                    <FaLock className="register-field-icon" />

                                    <input
                                        id="register-confirm-password"
                                        type="password"
                                        name="confirmPassword"
                                        placeholder="Confirm Password"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        minLength={MIN_PASSWORD_LENGTH}
                                        maxLength={MAX_PASSWORD_LENGTH}
                                        autoComplete="new-password"
                                        disabled={loading}
                                    />

                                </div>

                            </div>


                            {/* ROLE */}

                            <div className="register-field">

                                <label htmlFor="register-role">
                                    Account Type
                                </label>

                                <div className="register-input-wrapper">

                                    <FaUserTie className="register-field-icon" />

                                    <select
                                        id="register-role"
                                        name="role"
                                        value={form.role}
                                        onChange={handleChange}
                                        required
                                        disabled={loading}
                                    >

                                        <option value="student">
                                            Student
                                        </option>

                                        <option value="company">
                                            Company
                                        </option>

                                    </select>

                                </div>

                            </div>


                            {/* SUBMIT */}

                            <button
                                type="submit"
                                className="register-submit"
                                disabled={loading}
                            >

                                {loading && (
                                    <span className="register-spinner" />
                                )}

                                {loading
                                    ? "Creating Account..."
                                    : "Create Account"
                                }

                            </button>

                        </form>


                        {/* LOGIN */}

                        <div className="register-login">

                            <span>
                                Already have an account?
                            </span>

                            <button
                                type="button"
                                onClick={handleLogin}
                                disabled={loading}
                            >

                                Login

                            </button>

                        </div>

                    </div>

                </section>

            </div>

        </div>

    );

}


export default Register;