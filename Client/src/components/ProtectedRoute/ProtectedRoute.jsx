import { Navigate } from "react-router-dom";

import {
    useAuth
}
from "../../context/AuthContext";



function ProtectedRoute({children, role}){


    const {
        user,
        loading
    } = useAuth();



    // Firebase checking user

    if(loading){

        return (

            <h2>
                Loading...
            </h2>

        );

    }



    // User not logged in

    if(!user){

        return <Navigate to="/login" />;

    }



    // Role checking

    if(role && user.role !== role){


        return <Navigate to="/" />;


    }



    return children;


}



export default ProtectedRoute;