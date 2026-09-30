// server.js
// This is the main entry point for the KhetBuddy backend.
// It starts an Express server that:
//   1. Serves the frontend (HTML/CSS/JS) as static files.
//   2. Exposes the REST API routes under /api.

const express = require("express");
const path = require("path");
const routes = require("./routes.js");

const app = express();
const PORT = 5000;

// Allow the server to understand JSON data sent from the frontend.
app.use(express.json());

// Serve everything inside the frontend folder (index.html, style.css, script.js, assets)
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

// All API endpoints (POST /api/farms, GET /api/farms/:id, etc.) live here.
app.use("/api", routes);

// Any unknown route falls back to index.html (simple single-page app behaviour).
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(PORT, () => {
  console.log("========================================");
  console.log("  KhetBuddy server is running!");
  console.log(`  Open your browser and go to: http://localhost:${PORT}`);
  console.log("========================================");
});
