const express = require("express");
const sendEmail = require("../Services/emailService");

const router = express.Router();

router.post("/send", async (req, res) => {
    try {

        const { to, subject, message } = req.body;

        console.log("=================================");
        console.log("EMAIL REQUEST RECEIVED");
        console.log("To:", to);
        console.log("Subject:", subject);
        console.log("=================================");

        if (!to || !subject || !message) {

            return res.status(400).json({
                success: false,
                message: "to, subject and message are required",
            });

        }

        await sendEmail({
            to,
            subject,
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2>${subject}</h2>
                    <p>${message}</p>
                </div>
            `,
        });

        console.log("EMAIL SENT SUCCESSFULLY");

        res.status(200).json({
            success: true,
            message: "Email sent successfully",
        });

    } catch (error) {

        console.error("=================================");
        console.error("EMAIL ROUTE ERROR");
        console.error("Message:", error.message);
        console.error("Code:", error.code);
        console.error("Response:", error.response);
        console.error("=================================");

        res.status(500).json({
            success: false,
            message: error.message || "Failed to send email",
        });
    }
});

module.exports = router;