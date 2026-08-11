import { NavLink } from "react-router-dom";


import {
    FaHome,
    FaPlusCircle,
    FaBriefcase,
    FaUsers,
    FaUser
} from "react-icons/fa";



function CompanySidebar(){


    return(

        <>


            <NavLink to="/company/dashboard">


                <FaHome/>


                <span>
                    Dashboard
                </span>


            </NavLink>





            <NavLink to="/company/profile">


                <FaUser/>


                <span>
                    Profile
                </span>


            </NavLink>





            <NavLink to="/company/add-job">


                <FaPlusCircle/>


                <span>
                    Add Job
                </span>


            </NavLink>






            <NavLink to="/company/jobs">


                <FaBriefcase/>


                <span>
                    Manage Jobs
                </span>


            </NavLink>







            <NavLink to="/company/applicants">


                <FaUsers/>


                <span>
                    Applicants
                </span>


            </NavLink>



        </>

    );


}


export default CompanySidebar;