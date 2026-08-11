
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Register.css";

import { registerUser } from "../../services/authService";


function Register() {

    const navigate = useNavigate();


    const [form, setForm] = useState({

        name: "",
        email: "",
        password: "",
        role: "student"

    });


    const [loading, setLoading] = useState(false);


    const handleChange = (e) => {

        const { name, value } = e.target;

        setForm((previousForm) => ({

            ...previousForm,

            [name]: value

        }));

    };


    const handleSubmit = async (e) => {

        e.preventDefault();


        if (loading) {
            return;
        }


        if (form.password.length < 6) {

            alert(
                "Password must be at least 6 characters."
            );

            return;

        }


        try {

            setLoading(true);


            await registerUser(

                form.name.trim(),

                form.email.trim().toLowerCase(),

                form.password,

                form.role

            );


            alert(
                "Registration Successful"
            );


            navigate("/login");

        }

        catch (error) {

            console.error(
                "Registration Error:",
                error
            );


            let message =
                "Registration failed.";


            if (
                error.code ===
                "auth/email-already-in-use"
            ) {

                message =
                    "This email is already registered.";

            }

            else if (
                error.code ===
                "auth/invalid-email"
            ) {

                message =
                    "Please enter a valid email address.";

            }

            else if (
                error.code ===
                "auth/weak-password"
            ) {

                message =
                    "Password is too weak.";

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
                    Create Account
                </h1>


                <form
                    onSubmit={handleSubmit}
                >

                    <input

                        type="text"

                        name="name"

                        placeholder="Full Name"

                        value={form.name}

                        onChange={handleChange}

                        required

                    />


                    <input

                        type="email"

                        name="email"

                        placeholder="Email Address"

                        value={form.email}

                        onChange={handleChange}

                        required

                    />


                    <input

                        type="password"

                        name="password"

                        placeholder="Password"

                        value={form.password}

                        onChange={handleChange}

                        required

                        minLength={6}

                    />


                    <select

                        name="role"

                        value={form.role}

                        onChange={handleChange}

                        required

                    >

                        <option value="student">
                            Student
                        </option>

                        <option value="company">
                            Company
                        </option>

                    </select>


                    <button

                        type="submit"

                        disabled={loading}

                    >

                        {

                            loading

                                ? "Creating Account..."

                                : "Register"

                        }

                    </button>

                </form>


                <p>

                    Already have account?


                    <span

                        onClick={() => {

                            if (!loading) {

                                navigate("/login");

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

                        Login

                    </span>

                </p>

            </div>

        </div>

    );

}


export default Register;

