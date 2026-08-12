const API_URL = import.meta.env.VITE_API_URL;

const sendEmail = async ({
    to,
    subject,
    message,
}) => {
    try {
        console.log("=================================");
        console.log("SENDING EMAIL");
        console.log("API URL:", API_URL);
        console.log("To:", to);
        console.log("Subject:", subject);
        console.log("=================================");

        if (!API_URL) {
            throw new Error(
                "VITE_API_URL is not configured."
            );
        }

        const response = await fetch(
            `${API_URL}/api/email/send`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                },

                body: JSON.stringify({
                    to,
                    subject,
                    message,
                }),
            }
        );

        const data = await response.json();

        console.log("Email API response:", data);

        if (!response.ok) {
            throw new Error(
                data?.message ||
                "Unable to send email."
            );
        }

        console.log(
            "✅ Email request successful"
        );

        return data;

    } catch (error) {
        console.error(
            "❌ Email Service Error:",
            error
        );

        throw error;
    }
};

export default sendEmail;