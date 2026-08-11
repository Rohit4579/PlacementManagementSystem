import "./Sidebar.css";

import { useLayout } from "../../context/LayoutContext";
import { useAuth } from "../../context/AuthContext";

import StudentSidebar from "./StudentSidebar";
import CompanySidebar from "./CompanySidebar";
import AdminSidebar from "./AdminSidebar";



function Sidebar(){


    const { sidebarOpen, closeSidebar } = useLayout();


    const { user } = useAuth();





    return(


        <>


            {/* Mobile Overlay */}

            {
                sidebarOpen &&

                <div

                    className="sidebar-overlay"

                    onClick={closeSidebar}

                ></div>

            }





            <aside

                className={

                    sidebarOpen

                    ?

                    "sidebar sidebar-open"

                    :

                    "sidebar sidebar-close"

                }

            >



                <div className="sidebar-links">





                    {
                        user?.role === "student" &&

                        <StudentSidebar />

                    }





                    {
                        user?.role === "company" &&

                        <CompanySidebar />

                    }





                    {
                        user?.role === "admin" &&

                        <AdminSidebar />

                    }




                </div>



            </aside>



        </>


    );


}


export default Sidebar;