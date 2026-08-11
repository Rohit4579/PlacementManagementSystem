
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Login.css";

import { loginUser } from "../../services/authService";


function Login() {

    const navigate = useNavigate();


    const [data, setData] = useState({

        email: "",
        password: ""

    });


    const [loading, setLoading] = useState(false);


    const change = (e) => {

        const { name, value } = e.target;

        setData((previousData) => ({

            ...previousData,

            [name]: value

        }));

    };


    const submit = async (e) => {

        e.preventDefault();


        if (loading) {
            return;
        }


        try {

            setLoading(true);


            const user = await loginUser(

                data.email.trim().toLowerCase(),

                data.password

            );


            if (!user) {

                alert(
                    "User profile not found."
                );

                return;

            }


            console.log(
                "Logged in user:",
                user
            );


            // -----------------------------------------
            // STUDENT
            // -----------------------------------------

            if (user.role === "student") {

                navigate(
                    "/student/dashboard"
                );

                return;

            }


            // -----------------------------------------
            // COMPANY
            // -----------------------------------------

            if (user.role === "company") {

                navigate(
                    "/company/dashboard"
                );

                return;

            }


            // -----------------------------------------
            // ADMIN / TPO
            // -----------------------------------------

            if (user.role === "admin") {

                navigate(
                    "/admin/dashboard"
                );

                return;

            }


            // -----------------------------------------
            // INVALID ROLE
            // -----------------------------------------

            alert(
                "Invalid user role. Please contact the administrator."
            );

        }

        catch (error) {

            console.error(
                "Login Error:",
                error
            );


            let message =
                "Login failed.";


            if (
                error.code ===
                "auth/invalid-credential"
            ) {

                message =
                    "Invalid email or password.";

            }

            else if (
                error.code ===
                "auth/user-not-found"
            ) {

                message =
                    "No account exists with this email.";

            }

            else if (
                error.code ===
                "auth/wrong-password"
            ) {

                message =
                    "Incorrect password.";

            }

            else if (
                error.code ===
                "auth/too-many-requests"
            ) {

                message =
                    "Too many login attempts. Please try again later.";

            }

            else if (error.message) {

                message =
                    error.message;

            }


            alert(message);

        }

        finally {

            setLoading(false);

        }

    };


    return (

        <div className="auth-container">

            <div className="auth-box">

                <h1>
                    Login
                </h1>


                <form
                    onSubmit={submit}
                >

                    <input

                        name="email"

                        type="email"

                        placeholder="Email"

                        value={data.email}

                        onChange={change}

                        required

                    />


                    <input

                        name="password"

                        type="password"

                        placeholder="Password"

                        value={data.password}

                        onChange={change}

                        required

                    />


                    <button

                        type="submit"

                        disabled={loading}

                    >

                        {

                            loading

                                ? "Logging in..."

                                : "Login"

                        }

                    </button>

                </form>


                <p>

                    New user?


                    <span

                        onClick={() => {

                            if (!loading) {

                                navigate("/register");

                            }

                        }}

                        style={{

                            cursor:
                                loading
                                    ? "default"
                                    : "pointer",

                            color: "#667eea",

                            marginLeft: "5px"

                        }}

                    >

                        Register

                    </span>

                </p>

            </div>

        </div>

    );

}


export default Login;

