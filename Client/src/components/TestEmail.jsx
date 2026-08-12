import { useState } from "react";

import sendEmail from "../services/emailService";


function TestEmail() {

    const [loading, setLoading] =
        useState(false);

    const [message, setMessage] =
        useState("");


    const handleSendEmail = async () => {

        try {

            setLoading(true);

            setMessage("");


            const result =
                await sendEmail({

                    to: "student@example.com",

                    subject:
                        "Application Submitted",

                    message:
                        "Your job application has been submitted successfully."

                });


            setMessage(
                result.message
            );


        } catch (error) {

            setMessage(
                error.message ||
                "Failed to send email."
            );

        } finally {

            setLoading(false);

        }
    };


    return (

        <div>

            <button
                type="button"
                onClick={handleSendEmail}
                disabled={loading}
            >

                {loading
                    ? "Sending..."
                    : "Send Test Email"
                }

            </button>


            {message && (

                <p>
                    {message}
                </p>

            )}

        </div>
    );
}


export default TestEmail;