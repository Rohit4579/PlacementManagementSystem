const express = require("express");
const cors = require("cors");
require("dotenv").config();

const emailRoutes = require("./routes/emailRoutes");

const app = express();

// CORS
app.use(
    cors({
        origin: true,
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

app.use(express.json());

// Email routes
app.use("/api/email", emailRoutes);

// Test backend
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Placement Management Server is running",
        status: "success",
    });
});

module.exports = app;

// Local development only
if (require.main === module) {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}