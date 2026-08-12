const express = require("express");
const cors = require("cors");
require("dotenv").config();

const emailRoutes = require("./routes/emailRoutes");

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "https://placement-management-system-7eg5gg89o-rohit4579s-projects.vercel.app",
    "https://placement-management-system-b46b7p6o9-rohit4579s-projects.vercel.app",
].filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests without an Origin
            // (Postman, server-to-server, etc.)
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            console.log("CORS blocked:", origin);

            return callback(null, false);
        },

        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

        allowedHeaders: [
            "Content-Type",
            "Authorization",
        ],

        credentials: true,
    })
);

// Handle preflight requests
app.options("*", cors());

app.use(express.json());

app.use("/api/email", emailRoutes);

app.get("/", (req, res) => {
    res.status(200).json({
        message: "Placement Management Server is running",
        status: "success",
    });
});

module.exports = app;

if (require.main === module) {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(
            `Server running on http://localhost:${PORT}`
        );
    });
}