
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST,
    port: Number(process.env.BREVO_SMTP_PORT),
    secure: false,

    auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_KEY,
    },
});


const sendEmail = async ({
    to,
    subject,
    html
}) => {

    try {

        console.log("=================================");
        console.log("EMAIL SERVICE");
        console.log("To:", to);
        console.log("Subject:", subject);

        console.log(
            "SMTP HOST:",
            process.env.BREVO_SMTP_HOST
        );

        console.log(
            "SMTP PORT:",
            process.env.BREVO_SMTP_PORT
        );

        console.log(
            "SMTP USER:",
            process.env.BREVO_SMTP_USER
        );

        console.log(
            "SMTP KEY LOADED:",
            Boolean(process.env.BREVO_SMTP_KEY)
        );

        console.log(
            "SMTP KEY LENGTH:",
            process.env.BREVO_SMTP_KEY
                ? process.env.BREVO_SMTP_KEY.length
                : 0
        );

        console.log(
            "FROM EMAIL:",
            process.env.BREVO_FROM_EMAIL
        );

        console.log("=================================");


        // Test SMTP connection
        await transporter.verify();

        console.log(
            "✅ Brevo SMTP authentication successful"
        );


        // Send email
        const info = await transporter.sendMail({

            from: {
                name:
                    process.env.BREVO_FROM_NAME ||
                    "Placement Management System",

                address:
                    process.env.BREVO_FROM_EMAIL
            },

            to,

            subject,

            html,

        });


        console.log(
            "✅ Email sent successfully"
        );

        console.log(
            "Message ID:",
            info.messageId
        );


        return info;

    } catch (error) {

        console.error(
            "❌ EMAIL SENDING FAILED"
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "Code:",
            error.code
        );

        console.error(
            "Command:",
            error.command
        );

        console.error(
            "Response:",
            error.response
        );

        throw error;

    }

};


module.exports = sendEmail;
