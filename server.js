// Import dependencies
const express = require("express");
const cors = require("cors");

// Create Express app
const app = express();

// Middleware
app.use(cors());        // Enable CORS for frontend
app.use(express.json()); // Parse JSON bodies

// Routes
app.get("/", (req, res) => {
  res.send("Backend connected");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
