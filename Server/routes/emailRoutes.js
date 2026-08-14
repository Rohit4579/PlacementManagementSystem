const express = require("express");

const sendEmail = require("../Services/emailService");

const router = express.Router();


// =====================================================
// NORMAL EMAIL
// EXISTING ENDPOINT — DO NOT REMOVE
// =====================================================

router.post("/send", async (req, res) => {

    try {

        const {
            to,
            subject,
            message,
        } = req.body;


        console.log(
            "================================="
        );

        console.log(
            "EMAIL REQUEST RECEIVED"
        );

        console.log(
            "To:",
            to
        );

        console.log(
            "Subject:",
            subject
        );

        console.log(
            "================================="
        );


        // =================================================
        // VALIDATION
        // =================================================

        if (
            !to ||
            !subject ||
            !message
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "to, subject and message are required",

            });

        }


        // =================================================
        // SEND NORMAL EMAIL
        // =================================================

        await sendEmail({

            to,

            subject,

            html: `
                <div
                    style="
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                    "
                >

                    <h2>
                        ${subject}
                    </h2>

                    <p>
                        ${message}
                    </p>

                </div>
            `,

            text: message,

        });


        console.log(
            "EMAIL SENT SUCCESSFULLY"
        );


        return res.status(200).json({

            success: true,

            message:
                "Email sent successfully",

        });

    }

    catch (error) {

        console.error(
            "================================="
        );

        console.error(
            "EMAIL ROUTE ERROR"
        );

        console.error(
            "Message:",
            error?.message
        );

        console.error(
            "Code:",
            error?.code
        );

        console.error(
            "Response:",
            error?.response
        );

        console.error(
            "================================="
        );


        return res.status(500).json({

            success: false,

            message:
                error?.message ||
                "Failed to send email",

        });

    }

});


// =====================================================
// PASSWORD RESET
// FIREBASE ADMIN + BREVO
// =====================================================

router.post(
    "/password-reset",
    async (req, res) => {

        try {

            const {
                email
            } = req.body;


            console.log(
                "================================="
            );

            console.log(
                "PASSWORD RESET REQUEST"
            );

            console.log(
                "Email:",
                email
            );

            console.log(
                "================================="
            );


            // =================================================
            // VALIDATE EMAIL
            // =================================================

            if (!email) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Email address is required",

                });

            }


            const normalizedEmail =
                String(email)
                    .trim()
                    .toLowerCase();


            // =================================================
            // LOAD FIREBASE ADMIN
            // =================================================

            let admin;

            try {

                admin =
                    require("firebase-admin");

            }

            catch (error) {

                console.error(
                    "Firebase Admin SDK is not installed."
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Firebase Admin SDK is not configured on the server.",

                });

            }


            // =================================================
            // INITIALIZE FIREBASE ADMIN
            // =================================================

            if (
                !admin.apps.length
            ) {

                const privateKey =
                    process.env.FIREBASE_PRIVATE_KEY
                        ? process.env.FIREBASE_PRIVATE_KEY
                            .replace(
                                /\\n/g,
                                "\n"
                            )
                        : "";


                if (
                    !process.env.FIREBASE_PROJECT_ID ||
                    !process.env.FIREBASE_CLIENT_EMAIL ||
                    !privateKey
                ) {

                    console.error(
                        "Firebase Admin environment variables are missing."
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Firebase Admin configuration is missing.",

                    });

                }


                admin.initializeApp({

                    credential:
                        admin.credential.cert({

                            projectId:
                                process.env.FIREBASE_PROJECT_ID,

                            clientEmail:
                                process.env.FIREBASE_CLIENT_EMAIL,

                            privateKey,

                        }),

                });

            }


            // =================================================
            // CHECK FIREBASE AUTH USER
            // =================================================

            let firebaseUser;

            try {

                firebaseUser =
                    await admin
                        .auth()
                        .getUserByEmail(
                            normalizedEmail
                        );

            }

            catch (error) {

                /*
                 * IMPORTANT:
                 *
                 * We don't tell the user whether
                 * an account exists.
                 *
                 * This prevents account enumeration.
                 */

                console.log(
                    "No Firebase account found for password reset request."
                );


                return res.status(200).json({

                    success: true,

                    message:
                        "If an account exists with this email, a password reset link has been sent.",

                });

            }


            // =================================================
            // GENERATE FIREBASE RESET LINK
            // =================================================

            const continueUrl =
                process.env.PASSWORD_RESET_CONTINUE_URL ||
                "http://localhost:5173/login";


            const resetLink =
                await admin
                    .auth()
                    .generatePasswordResetLink(
                        normalizedEmail,
                        {
                            url:
                                continueUrl,

                            handleCodeInApp:
                                false,
                        }
                    );


            console.log(
                "Firebase password reset link generated."
            );


            // =================================================
            // USER NAME
            // =================================================

            const userName =
                firebaseUser.displayName ||
                "User";


            // =================================================
            // HTML EMAIL
            // =================================================

            const html = `

<!DOCTYPE html>

<html>

<head>

    <meta
        charset="UTF-8"
    />

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    />

    <title>
        Reset Your Password
    </title>

</head>


<body
    style="
        margin:0;
        padding:0;
        background:#f4f7fb;
        font-family:Arial,Helvetica,sans-serif;
    "
>


<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    style="
        padding:40px 15px;
    "
>

<tr>

<td
    align="center"
>


<table
    width="600"
    cellpadding="0"
    cellspacing="0"
    style="
        max-width:600px;
        background:#ffffff;
        border-radius:16px;
        overflow:hidden;
        box-shadow:
            0 8px 30px
            rgba(0,0,0,0.08);
    "
>


<!-- HEADER -->

<tr>

<td
    style="
        background:
            linear-gradient(
                135deg,
                #2563eb,
                #4f46e5
            );

        padding:32px;

        text-align:center;

        color:white;
    "
>


<div
    style="
        font-size:30px;
        font-weight:700;
    "
>

    Placement
    <span
        style="
            color:#dbeafe;
        "
    >
        Pro
    </span>

</div>


<div
    style="
        font-size:14px;
        margin-top:8px;
        opacity:0.9;
    "
>

    Placement Management System

</div>


</td>

</tr>


<!-- CONTENT -->

<tr>

<td
    style="
        padding:40px 35px;
    "
>


<h2
    style="
        margin:0 0 18px;
        color:#172033;
        font-size:25px;
    "
>

    Reset Your Password

</h2>


<p
    style="
        color:#5b6475;
        font-size:15px;
        line-height:1.7;
    "
>

    Hello ${userName},

</p>


<p
    style="
        color:#5b6475;
        font-size:15px;
        line-height:1.7;
    "
>

    We received a request to reset the password
    for your PlacementPro account.

</p>


<p
    style="
        color:#5b6475;
        font-size:15px;
        line-height:1.7;
    "
>

    Click the button below to create a new password.

</p>


<!-- BUTTON -->

<div
    style="
        text-align:center;
        margin:30px 0;
    "
>

<a
    href="${resetLink}"
    style="
        display:inline-block;
        padding:14px 28px;
        background:#2563eb;
        color:#ffffff;
        text-decoration:none;
        font-size:15px;
        font-weight:600;
        border-radius:8px;
    "
>

    Reset Password

</a>

</div>


<p
    style="
        color:#7b8494;
        font-size:13px;
        line-height:1.6;
    "
>

    If you did not request a password reset,
    you can safely ignore this email.

</p>


<p
    style="
        color:#7b8494;
        font-size:13px;
        line-height:1.6;
    "
>

    For your security, please do not share
    this link with anyone.

</p>


</td>

</tr>


<!-- FOOTER -->

<tr>

<td
    style="
        background:#f8fafc;
        padding:22px;
        text-align:center;
        color:#8a93a3;
        font-size:12px;
    "
>

    © ${new Date().getFullYear()}
    PlacementPro.
    All rights reserved.

</td>

</tr>


</table>


</td>

</tr>

</table>


</body>

</html>

`;


            // =================================================
            // PLAIN TEXT VERSION
            // =================================================

            const text = `

Hello ${userName},

We received a request to reset the password
for your PlacementPro account.

Reset your password using this link:

${resetLink}

If you did not request a password reset,
you can safely ignore this email.

Regards,
PlacementPro

`;


            // =================================================
            // SEND THROUGH BREVO
            // =================================================

            await sendEmail({

                to:
                    normalizedEmail,

                subject:
                    "Reset Your PlacementPro Password",

                html,

                text,

            });


            // =================================================
            // SUCCESS
            // =================================================

            console.log(
                "PASSWORD RESET EMAIL SENT SUCCESSFULLY"
            );

            console.log(
                "To:",
                normalizedEmail
            );

            console.log(
                "================================="
            );


            return res.status(200).json({

                success: true,

                message:
                    "If an account exists with this email, a password reset link has been sent.",

            });

        }

        catch (error) {

            console.error(
                "================================="
            );

            console.error(
                "PASSWORD RESET ROUTE ERROR"
            );

            console.error(
                "Message:",
                error?.message
            );

            console.error(
                "Code:",
                error?.code
            );

            console.error(
                "Response:",
                error?.response
            );

            console.error(
                "Stack:",
                error?.stack
            );

            console.error(
                "================================="
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to send password reset email. Please try again later.",

            });

        }

    }
);


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;