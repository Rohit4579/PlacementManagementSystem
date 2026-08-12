const express = require("express");
const cors = require("cors");
require("dotenv").config();

const emailRoutes = require("./routes/emailRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/email", emailRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Placement Management Server is running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});