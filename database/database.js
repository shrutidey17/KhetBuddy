// database.js
// This file sets up the SQLite database for KhetBuddy.
// It uses "better-sqlite3" because it is simple, fast, and synchronous
// (no callbacks/promises needed) -- perfect for a beginner-friendly project.

const path = require("path");
const Database = require("better-sqlite3");

// The database file will be created automatically inside the /database folder.
const dbPath = path.join(__dirname, "khetbuddy.db");
const db = new Database(dbPath);

// Turn on foreign key support so farm_tasks.farm_id -> farms.id works correctly.
db.pragma("foreign_keys = ON");

// -----------------------------
// CREATE TABLES (only if they don't already exist)
// -----------------------------

// Table 1: farmers -> stores basic farmer details
db.exec(`
  CREATE TABLE IF NOT EXISTS farmers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL
  )
`);

// Table 2: farms -> stores one farm/crop entry per farmer
db.exec(`
  CREATE TABLE IF NOT EXISTS farms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farmer_id INTEGER NOT NULL,
    crop TEXT NOT NULL,
    growth_stage TEXT NOT NULL,
    last_irrigation TEXT NOT NULL,
    crop_problem TEXT NOT NULL,
    weather TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers (id)
  )
`);

// Table 3: farm_tasks -> stores the daily checklist tasks for a farm
db.exec(`
  CREATE TABLE IF NOT EXISTS farm_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    task TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    FOREIGN KEY (farm_id) REFERENCES farms (id)
  )
`);

// Export the database connection so routes.js can use it.
module.exports = db;
