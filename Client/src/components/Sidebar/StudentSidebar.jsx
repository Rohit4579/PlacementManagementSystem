import { NavLink } from "react-router-dom";

import {
    FaHome,
    FaUser,
    FaFileAlt,
    FaBriefcase,
    FaClipboardList,
    FaCog
} from "react-icons/fa";

function StudentSidebar() {

    return (

        <>

            <NavLink to="/student/dashboard">
                <FaHome />
                <span>Dashboard</span>
            </NavLink>

            <NavLink to="/student/profile">
                <FaUser />
                <span>My Profile</span>
            </NavLink>

            <NavLink to="/student/resume">
                <FaFileAlt />
                <span>Resume</span>
            </NavLink>

            <NavLink to="/student/jobs">
                <FaBriefcase />
                <span>Available Jobs</span>
            </NavLink>

            <NavLink to="/student/applied-jobs">
                <FaClipboardList />
                <span>Applied Jobs</span>
            </NavLink>


        </>

    );

}

export default StudentSidebar;