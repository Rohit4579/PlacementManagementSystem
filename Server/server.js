const express = require("express");
const cors = require("cors");
require("dotenv").config();

const emailRoutes = require("./routes/emailRoutes");

const app = express();

// Allowed frontend URLs
const allowedOrigins = [
    "http://localhost:5173",
    process.env.CLIENT_URL,
].filter(Boolean);

console.log("Allowed CORS origins:", allowedOrigins);

// CORS configuration
app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests without an origin
            // (Postman, server-to-server, etc.)
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            console.error("❌ CORS blocked:", origin);

            return callback(
                new Error("Not allowed by CORS")
            );
        },

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization",
        ],

        credentials: true,
    })
);

// Parse JSON request body
app.use(express.json());

// Email routes
app.use("/api/email", emailRoutes);

// Test route
app.get("/", (req, res) => {
    res.json({
        message: "Placement Management Server is running",
        status: "success",
    });
});

// Export app for Vercel
module.exports = app;

// Run locally
if (require.main === module) {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(
            `Server running on http://localhost:${PORT}`
        );
    });
}