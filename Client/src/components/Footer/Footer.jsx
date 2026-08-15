import { Link } from "react-router-dom";
import { FaGraduationCap, FaEnvelope } from "react-icons/fa";
import "./Footer.css";

function Footer() {
    return (
        <footer className="site-footer">

            <div className="footer-main">

                {/* Brand */}
                <div className="footer-brand">

                    <Link to="/dashboard" className="footer-logo">
                        <span className="footer-logo-icon">
                            <FaGraduationCap />
                        </span>

                        <span>
                            Placement<span>Connect</span>
                        </span>
                    </Link>

                    <p>
                        Smart placement management for students,
                        companies and placement teams.
                    </p>

                </div>

                {/* Contact */}
                <div className="footer-contact">

                    <h4>Contact Us</h4>

                    <a href="mailto:support@placementconnect.com">
                        <span className="contact-icon">
                            <FaEnvelope />
                        </span>

                        support@placementconnect.com
                    </a>

                </div>

            </div>

            {/* Bottom */}
            <div className="footer-bottom">

                <span>
                    © {new Date().getFullYear()} PlacementConnect
                </span>

                <span>
                    Built for better placements
                </span>

            </div>

        </footer>
    );
}

export default Footer;