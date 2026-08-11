
import { NavLink } from "react-router-dom";

import {
    FaHome,
    FaUsers,
    FaBuilding,
    FaBriefcase,
    FaClipboardList,
    FaUserCheck,
    FaChartBar,
    FaCog
} from "react-icons/fa";


function AdminSidebar() {

    return (

        <>


            <NavLink to="/admin/dashboard">

                <FaHome />

                <span>
                    Dashboard
                </span>

            </NavLink>



            <NavLink to="/admin/students">

                <FaUsers />

                <span>
                    Manage Students
                </span>

            </NavLink>



            <NavLink to="/admin/companies">

                <FaBuilding />

                <span>
                    Manage Companies
                </span>

            </NavLink>



            <NavLink to="/admin/jobs">

                <FaBriefcase />

                <span>
                    Manage Jobs
                </span>

            </NavLink>



            <NavLink to="/admin/applications">

                <FaClipboardList />

                <span>
                    Applications
                </span>

            </NavLink>



            <NavLink to="/admin/placements">

                <FaUserCheck />

                <span>
                    Placements
                </span>

            </NavLink>



            <NavLink to="/admin/reports">

                <FaChartBar />

                <span>
                    Placement Reports
                </span>

            </NavLink>



        </>

    );

}


export default AdminSidebar;

