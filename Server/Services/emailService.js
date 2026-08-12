const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST,
    port: Number(process.env.BREVO_SMTP_PORT) || 587,
    secure: false,

    auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_KEY,
    },
});

const sendEmail = async ({ to, subject, html }) => {
    try {
        console.log("=================================");
        console.log("EMAIL SERVICE");
        console.log("To:", to);
        console.log("Subject:", subject);
        console.log("SMTP Host:", process.env.BREVO_SMTP_HOST);
        console.log("SMTP Port:", process.env.BREVO_SMTP_PORT);
        console.log("SMTP User:", process.env.BREVO_SMTP_USER);
        console.log(
            "SMTP Key Loaded:",
            Boolean(process.env.BREVO_SMTP_KEY)
        );
        console.log(
            "From Email:",
            process.env.BREVO_FROM_EMAIL
        );
        console.log("=================================");

        // Check environment variables
        if (!process.env.BREVO_SMTP_HOST) {
            throw new Error(
                "BREVO_SMTP_HOST is not configured"
            );
        }

        if (!process.env.BREVO_SMTP_USER) {
            throw new Error(
                "BREVO_SMTP_USER is not configured"
            );
        }

        if (!process.env.BREVO_SMTP_KEY) {
            throw new Error(
                "BREVO_SMTP_KEY is not configured"
            );
        }

        if (!process.env.BREVO_FROM_EMAIL) {
            throw new Error(
                "BREVO_FROM_EMAIL is not configured"
            );
        }

        // Test SMTP connection
        await transporter.verify();

        console.log(
            "Brevo SMTP connection successful"
        );

        // Send email
        const info = await transporter.sendMail({
            from: {
                name:
                    process.env.BREVO_FROM_NAME ||
                    "Placement Management System",

                address:
                    process.env.BREVO_FROM_EMAIL,
            },

            to: to,
            subject: subject,
            html: html,
        });

        console.log("Email sent successfully");
        console.log("Message ID:", info.messageId);

        return info;
    } catch (error) {
        console.error("=================================");
        console.error("EMAIL SENDING FAILED");
        console.error("Message:", error.message);
        console.error("Code:", error.code);
        console.error("Command:", error.command);
        console.error("Response:", error.response);
        console.error("=================================");

        throw error;
    }
};

module.exports = sendEmail;