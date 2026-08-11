import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import Footer from "../Footer/Footer";

import { useLayout } from "../../context/LayoutContext";

import "./Layout.css";

function Layout({ children }) {

    const {
        sidebarOpen
    } = useLayout();


    return (

        <div className="layout">

            {/* =================================================
                FIXED SIDEBAR
            ================================================= */}

            <Sidebar />


            {/* =================================================
                MAIN APPLICATION AREA
            ================================================= */}

            <div
                className={
                    sidebarOpen
                        ? "main-content"
                        : "main-content collapsed"
                }
            >

                {/* =================================================
                    FIXED NAVBAR
                ================================================= */}

                <Navbar />


                {/* =================================================
                    PAGE AREA
                ================================================= */}

                <div className="main-wrapper">

                    <main className="content">

                        {children}

                    </main>


                    {/* =================================================
                        FOOTER
                    ================================================= */}

                    <Footer />

                </div>

            </div>

        </div>

    );

}

export default Layout;