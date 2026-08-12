const {
    sendEmail
} = require("../services/emailService");


const sendCustomEmail = async (req, res) => {

    try {

        const {
            to,
            subject,
            message
        } = req.body;


        if (!to) {

            return res.status(400).json({
                success: false,
                message: "Recipient email is required."
            });

        }


        if (!subject) {

            return res.status(400).json({
                success: false,
                message: "Email subject is required."
            });

        }


        if (!message) {

            return res.status(400).json({
                success: false,
                message: "Email message is required."
            });

        }


        const html = `
            <div style="
                font-family: Arial, sans-serif;
                background: #f5f7fb;
                padding: 30px;
            ">

                <div style="
                    max-width: 600px;
                    margin: auto;
                    background: #ffffff;
                    padding: 30px;
                    border-radius: 12px;
                    border: 1px solid #e2e7ef;
                ">

                    <h2 style="
                        margin-top: 0;
                        color: #172033;
                    ">
                        Placement Management System
                    </h2>

                    <div style="
                        color: #4b5568;
                        font-size: 15px;
                        line-height: 1.7;
                    ">
                        ${message}
                    </div>

                    <hr style="
                        margin: 25px 0;
                        border: none;
                        border-top: 1px solid #e5e7eb;
                    ">

                    <p style="
                        color: #8a94a6;
                        font-size: 12px;
                        margin-bottom: 0;
                    ">
                        This is an automated email from
                        the Placement Management System.
                    </p>

                </div>

            </div>
        `;


        const result = await sendEmail({

            to,

            subject,

            html,

            text: message

        });


        return res.status(200).json({

            success: true,

            message: "Email sent successfully.",

            messageId: result.messageId

        });


    } catch (error) {

        console.error(
            "Send Email Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error?.message ||
                "Unable to send email."

        });

    }
};


module.exports = {
    sendCustomEmail
};