const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";


const sendEmail = async ({
    to,
    subject,
    message
}) => {

    try {

        const response = await fetch(
            `${API_URL}/api/email/send`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    to,
                    subject,
                    message
                })
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data?.message ||
                "Unable to send email."
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