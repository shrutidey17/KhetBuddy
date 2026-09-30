// routes.js
// This file defines all the REST API endpoints for KhetBuddy.
// It talks to the SQLite database using simple, synchronous queries.

const express = require("express");
const router = express.Router();
const db = require("../database/database.js");

// -----------------------------------------------------------
// POST /api/farms
// Saves a new farmer (if needed) + their farm/crop information.
// -----------------------------------------------------------
router.post("/farms", (req, res) => {
  try {
    const {
      name,
      location,
      crop,
      growth_stage,
      last_irrigation,
      crop_problem,
      weather,
    } = req.body;

    // Basic validation - make sure required fields are present.
    if (!name || !location || !crop || !growth_stage) {
      return res.status(400).json({ error: "Missing required farm fields." });
    }

    // Step 1: Insert the farmer.
    const insertFarmer = db.prepare(
      "INSERT INTO farmers (name, location) VALUES (?, ?)"
    );
    const farmerResult = insertFarmer.run(name, location);
    const farmerId = farmerResult.lastInsertRowid;

    // Step 2: Insert the farm entry linked to that farmer.
    const insertFarm = db.prepare(`
      INSERT INTO farms
        (farmer_id, crop, growth_stage, last_irrigation, crop_problem, weather)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const farmResult = insertFarm.run(
      farmerId,
      crop,
      growth_stage,
      last_irrigation || "Unknown",
      crop_problem || "No problem",
      weather || "Unknown"
    );

    const farmId = farmResult.lastInsertRowid;

    // Send back the new IDs so the frontend can use them.
    res.status(201).json({
      message: "Farm saved successfully.",
      farmer_id: farmerId,
      farm_id: farmId,
    });
  } catch (error) {
    console.error("Error saving farm:", error);
    res.status(500).json({ error: "Something went wrong while saving the farm." });
  }
});

// -----------------------------------------------------------
// GET /api/farms/:id
// Retrieves one farm (joined with its farmer info).
// -----------------------------------------------------------
router.get("/farms/:id", (req, res) => {
  try {
    const farmId = req.params.id;

    const farm = db
      .prepare(
        `
        SELECT
          farms.id AS farm_id,
          farms.crop,
          farms.growth_stage,
          farms.last_irrigation,
          farms.crop_problem,
          farms.weather,
          farms.created_at,
          farmers.id AS farmer_id,
          farmers.name AS farmer_name,
          farmers.location
        FROM farms
        JOIN farmers ON farms.farmer_id = farmers.id
        WHERE farms.id = ?
      `
      )
      .get(farmId);

    if (!farm) {
      return res.status(404).json({ error: "Farm not found." });
    }

    // Also fetch the tasks that belong to this farm.
    const tasks = db
      .prepare("SELECT * FROM farm_tasks WHERE farm_id = ?")
      .all(farmId);

    res.json({ ...farm, tasks });
  } catch (error) {
    console.error("Error fetching farm:", error);
    res.status(500).json({ error: "Something went wrong while fetching the farm." });
  }
});

// -----------------------------------------------------------
// POST /api/tasks
// Saves a new checklist task for a farm.
// -----------------------------------------------------------
router.post("/tasks", (req, res) => {
  try {
    const { farm_id, task } = req.body;

    if (!farm_id || !task) {
      return res.status(400).json({ error: "farm_id and task are required." });
    }

    const insertTask = db.prepare(
      "INSERT INTO farm_tasks (farm_id, task, completed) VALUES (?, ?, 0)"
    );
    const result = insertTask.run(farm_id, task);

    res.status(201).json({
      message: "Task saved successfully.",
      task_id: result.lastInsertRowid,
    });
  } catch (error) {
    console.error("Error saving task:", error);
    res.status(500).json({ error: "Something went wrong while saving the task." });
  }
});

// -----------------------------------------------------------
// PUT /api/tasks/:id
// Marks a task as completed (or not completed).
// -----------------------------------------------------------
router.put("/tasks/:id", (req, res) => {
  try {
    const taskId = req.params.id;
    const { completed } = req.body;

    const updateTask = db.prepare(
      "UPDATE farm_tasks SET completed = ? WHERE id = ?"
    );
    const result = updateTask.run(completed ? 1 : 0, taskId);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Task not found." });
    }

    res.json({ message: "Task updated successfully." });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Something went wrong while updating the task." });
  }
});

module.exports = router;
