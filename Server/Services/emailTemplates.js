const applicationSubmittedTemplate = ({
    studentName,
    jobTitle,
    companyName
}) => {

    return {

        subject:
            `Application Submitted - ${jobTitle}`,

        html: `
            <div style="
                font-family: Arial, sans-serif;
                background: #f5f7fb;
                padding: 30px;
            ">

                <div style="
                    max-width: 600px;
                    margin: auto;
                    background: white;
                    padding: 30px;
                    border-radius: 14px;
                ">

                    <h2>
                        Application Submitted
                    </h2>

                    <p>
                        Hello ${studentName || "Student"},
                    </p>

                    <p>
                        Your application for
                        <strong>${jobTitle}</strong>
                        at
                        <strong>${companyName}</strong>
                        has been submitted successfully.
                    </p>

                    <p>
                        You can log in to your placement
                        portal to track your application.
                    </p>

                    <p>
                        Best regards,<br>
                        Placement Management Team
                    </p>

                </div>

            </div>
        `

    };
};


const applicationStatusTemplate = ({
    studentName,
    jobTitle,
    companyName,
    status
}) => {

    return {

        subject:
            `Application Status - ${jobTitle}`,

        html: `
            <div style="
                font-family: Arial, sans-serif;
                background: #f5f7fb;
                padding: 30px;
            ">

                <div style="
                    max-width: 600px;
                    margin: auto;
                    background: white;
                    padding: 30px;
                    border-radius: 14px;
                ">

                    <h2>
                        Application Status Updated
                    </h2>

                    <p>
                        Hello ${studentName || "Student"},
                    </p>

                    <p>
                        Your application for
                        <strong>${jobTitle}</strong>
                        at
                        <strong>${companyName}</strong>
                        has been updated.
                    </p>

                    <p>
                        Current status:
                        <strong>${status}</strong>
                    </p>

                    <p>
                        Please log in to the placement
                        portal for more details.
                    </p>

                </div>

            </div>
        `

    };
};


module.exports = {
    applicationSubmittedTemplate,
    applicationStatusTemplate
};