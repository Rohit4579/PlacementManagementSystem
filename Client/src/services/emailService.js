const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://placement-management-system-b46b7p6o9-rohit4579s-projects.vercel.app";

const sendEmail = async ({ to, subject, message }) => {
    try {
        console.log("Sending email...");
        console.log("API URL:", API_URL);
        console.log("To:", to);
        console.log("Subject:", subject);

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
                data?.message || "Unable to send email."
            );
        }

        return data;

    } catch (error) {
        console.error(
            "Email Service Error:",
            error
        );

        throw error;
    }
};

export default sendEmail;