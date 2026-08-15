// src/pages/Landing/Landing.jsx

import { Link } from "react-router-dom";

import {
    FaUsers,
    FaBuilding,
    FaBriefcase,
    FaUserCheck,
    FaArrowRight,
    FaCheckCircle
} from "react-icons/fa";

import "./Landing.css";


function Landing() {

    return (

        <div className="landing-page">


            {/* =====================================================
                NAVBAR
            ===================================================== */}

            <nav className="landing-navbar">


                {/* LOGO */}

                <Link
                    to="/"
                    className="landing-logo"
                >

                    Placement<span>Connect</span>

                </Link>


                {/* AUTH ACTIONS */}

                <div className="landing-nav-actions">


                    {/* LOGIN */}

                    <Link
                        to="/login"
                        className="landing-login"
                    >

                        Login

                    </Link>


                    {/* REGISTER */}

                    <Link
                        to="/register"
                        className="landing-register"
                    >

                        Register

                    </Link>


                    {/* GET STARTED */}

                    <Link
                        to="/register"
                        className="landing-nav-button"
                    >

                        Get Started

                    </Link>


                </div>

            </nav>


            {/* =====================================================
                HERO SECTION
            ===================================================== */}

            <section className="landing-hero">


                {/* LEFT CONTENT */}

                <div className="hero-content">


                    <div className="hero-badge">

                        <span></span>

                        Smart Campus Placement Platform

                    </div>


                    <h1>

                        Simplify

                        <span>
                            {" "}Student Placements.
                        </span>

                    </h1>


                    <p>

                        PlacementConnect connects students, companies
                        and placement teams through one simple,
                        reliable and professional platform.

                    </p>


                    {/* HERO BUTTONS */}

                    <div className="hero-actions">


                        {/* REGISTER */}

                        <Link
                            to="/register"
                            className="hero-primary-button"
                        >

                            Get Started

                            <FaArrowRight />

                        </Link>


                        {/* LOGIN */}

                        <Link
                            to="/login"
                            className="hero-secondary-button"
                        >

                            Login

                        </Link>


                    </div>


                    {/* TRUST POINTS */}

                    <div className="hero-trust">


                        <div>

                            <FaCheckCircle />

                            <span>
                                Easy to use
                            </span>

                        </div>


                        <div>

                            <FaCheckCircle />

                            <span>
                                Centralized management
                            </span>

                        </div>


                        <div>

                            <FaCheckCircle />

                            <span>
                                Real-time information
                            </span>

                        </div>


                    </div>

                </div>


                {/* =================================================
                    RIGHT IMAGE
                ================================================= */}

                <div className="hero-image-container">


                    <div className="hero-image-glow"></div>


                    <div className="hero-image-frame">

                        <img
                            src="/landing-hero.png"
                            alt="PlacementConnect placement management platform"
                            className="landing-hero-image"
                        />

                    </div>


                    {/* FLOATING CARD */}

                    <div className="hero-floating-card">


                        <div className="floating-card-icon">

                            <FaUserCheck />

                        </div>


                        <div>

                            <strong>
                                Placement Success
                            </strong>

                            <span>
                                Track everything in one place
                            </span>

                        </div>

                    </div>


                </div>

            </section>


            {/* =====================================================
                STATS
            ===================================================== */}

            <section className="landing-stats">


                <div className="landing-stat">

                    <strong>
                        500+
                    </strong>

                    <span>
                        Students
                    </span>

                </div>


                <div className="landing-stat">

                    <strong>
                        50+
                    </strong>

                    <span>
                        Companies
                    </span>

                </div>


                <div className="landing-stat">

                    <strong>
                        120+
                    </strong>

                    <span>
                        Job Opportunities
                    </span>

                </div>


                <div className="landing-stat">

                    <strong>
                        350+
                    </strong>

                    <span>
                        Students Selected
                    </span>

                </div>


            </section>


            {/* =====================================================
                FEATURES
            ===================================================== */}

            <section
                className="landing-features"
                id="features"
            >


                <div className="section-heading">


                    <span>
                        PLATFORM FEATURES
                    </span>


                    <h2>

                        Everything needed for

                        <br />

                        successful placements.

                    </h2>


                    <p>

                        A centralized platform designed to make
                        placement management easier for everyone.

                    </p>


                </div>


                <div className="feature-grid">


                    {/* STUDENTS */}

                    <div className="feature-card">


                        <div className="feature-icon blue">

                            <FaUsers />

                        </div>


                        <h3>
                            Student Management
                        </h3>


                        <p>

                            Manage student profiles, applications,
                            resumes and placement activities from
                            one centralized platform.

                        </p>


                    </div>


                    {/* COMPANIES */}

                    <div className="feature-card">


                        <div className="feature-icon purple">

                            <FaBuilding />

                        </div>


                        <h3>
                            Company Management
                        </h3>


                        <p>

                            Connect companies with eligible students
                            and manage recruitment opportunities
                            efficiently.

                        </p>


                    </div>


                    {/* JOBS */}

                    <div className="feature-card">


                        <div className="feature-icon green">

                            <FaBriefcase />

                        </div>


                        <h3>
                            Job Opportunities
                        </h3>


                        <p>

                            Publish job openings, display requirements
                            and allow students to apply directly.

                        </p>


                    </div>


                    {/* PLACEMENT */}

                    <div className="feature-card">


                        <div className="feature-icon orange">

                            <FaUserCheck />

                        </div>


                        <h3>
                            Placement Tracking
                        </h3>


                        <p>

                            Track applications, selections, rejections
                            and overall placement performance.

                        </p>


                    </div>


                </div>

            </section>


            {/* =====================================================
                CTA
            ===================================================== */}

            <section className="landing-cta">


                <div>

                    <span>
                        READY TO GET STARTED?
                    </span>


                    <h2>
                        Make placements simpler.
                    </h2>


                    <p>

                        Bring students, companies and placement
                        teams together in one platform.

                    </p>

                </div>


                <Link
                    to="/register"
                    className="cta-button"
                >

                    Create Account

                    <FaArrowRight />

                </Link>


            </section>


            {/* =====================================================
                FOOTER
            ===================================================== */}

            <footer className="landing-footer">


                <div className="footer-logo">

                    Placement<span>Connect</span>

                </div>


                <p>
                    Smart Placement Management System
                </p>


                <span>

                    © {new Date().getFullYear()}
                    {" "}PlacementConnect

                </span>


            </footer>


        </div>

    );

}


export default Landing;