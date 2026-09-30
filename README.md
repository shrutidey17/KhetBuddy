# 🌱 KhetBuddy — Farmer's Daily Decision Assistant

KhetBuddy answers one simple question for a farmer:

> **"What should I do on my farm today?"**

A farmer fills in a few quick details about their farm and crop, and KhetBuddy
instantly generates a **Today's Farm Action Plan** — plus a crop growth
timeline with a checklist, and an "Agriculture SOS" symptom checker.

---

## 📁 Folder Structure

```text
KhetBuddy/
│
├── frontend/
│   ├── index.html      → All pages (Home, Farm Form, Timeline, SOS)
│   ├── style.css        → Green agricultural theme, fully responsive
│   ├── script.js         → Navigation + recommendation engine + timeline + SOS logic
│   └── assets/            → (empty folder for any extra images/icons)
│
├── backend/
│   ├── server.js         → Express server (serves frontend + API)
│   ├── routes.js          → REST API endpoints
│   └── package.json        → Backend dependencies
│
├── database/
│   ├── database.js        → SQLite table setup (better-sqlite3)
│   └── khetbuddy.db         → Created automatically the first time you run the server
│
└── README.md
```

---

## 🚀 How to Run the Project (Windows / Mac / Linux)

### Requirements
- [Node.js](https://nodejs.org) installed (version 16 or higher recommended)

### Steps

1. **Unzip** the KhetBuddy folder anywhere on your computer.
2. Open a terminal / Command Prompt.
3. Go into the backend folder:
   ```bash
   cd KhetBuddy/backend
   ```
4. Install the dependencies:
   ```bash
   npm install
   ```
5. Start the server:
   ```bash
   node server.js
   ```
   (or `npm start`, which does the same thing)
6. You should see:
   ```text
   ========================================
     KhetBuddy server is running!
     Open your browser and go to: http://localhost:5000
   ========================================
   ```
7. Open your browser and visit:
   ```text
   http://localhost:5000
   ```

That's it — the frontend, backend, and database are all connected and running
from a single server on port 5000.

> 💡 On the "My Farm" page there is a **"✨ Fill Demo Data"** button that
> instantly fills the form with a realistic example (Ramesh, Duliajan Assam,
> Rice, Vegetative Growth) so you can demo the app immediately.

---

## 🔌 How the Frontend Talks to the Backend

- The Express server (`backend/server.js`) serves the static files inside
  `frontend/` **and** exposes API routes under `/api/...` — so everything
  runs from one URL (`http://localhost:5000`), with no CORS setup needed.
- When the farmer submits the form, `script.js`:
  1. Instantly generates the action plan **in the browser** using the
     JavaScript recommendation engine (works even if the backend is down).
  2. Sends a `POST /api/farms` request to save the farmer + farm details
     into the SQLite database.
  3. Sends `POST /api/tasks` requests to save the day's checklist items,
     linked to that farm.

## 💾 How SQLite Works Here

- `database/database.js` uses the `better-sqlite3` package, which is
  synchronous and beginner-friendly (no callbacks needed).
- On first run, it automatically creates `database/khetbuddy.db` and three
  tables: `farmers`, `farms`, and `farm_tasks`.
- All farm data you submit through the form is permanently stored there —
  you can inspect it with any SQLite viewer (e.g., "DB Browser for SQLite").

## 🔗 API Endpoints (backend/routes.js)

| Method | Endpoint          | Purpose                              |
|--------|-------------------|---------------------------------------|
| POST   | `/api/farms`      | Save a new farmer + farm/crop entry   |
| GET    | `/api/farms/:id`  | Retrieve one farm (with its tasks)    |
| POST   | `/api/tasks`      | Save a new checklist task for a farm  |
| PUT    | `/api/tasks/:id`  | Mark a task as completed              |

## 🧠 How the Recommendation Engine Works

All recommendation logic lives in `frontend/script.js`, inside:

- `baseRecommendations` — a lookup object with tailored advice for each
  **Crop × Growth Stage** combination (Rice, Wheat, Maize, Mustard, Potato,
  Tomato — each with all 6 stages).
- `getWeatherNote()` — adjusts the water/weather advice based on the
  selected weather (e.g., "Rain expected" → skip irrigation).
- `problemGuidance` — overrides the "Watch For" advice and sets
  **Today's Priority** whenever the farmer reports a visible crop problem.
- `generateActionPlan()` — combines all three layers above into the final
  plan shown on screen, and also sets the **Crop Status** indicator
  ("Looking Good" vs "Needs Attention") based only on the reported symptoms.

This is a plain rule-based system (`if/else` + lookup tables) — **no AI or
external APIs** are used, exactly as intended for this prototype.

### ✏️ How to Modify Crops / Recommendations

Open `frontend/script.js` and edit the `baseRecommendations` object. Each
crop has an entry for every growth stage with `water`, `task`, and `watch`
fields — just change the text, or add a new crop by following the same
pattern. To add a new "Visible Crop Problem" option, add it to the dropdown
in `index.html` and to the `problemGuidance` object in `script.js`.

The Agriculture SOS symptom guidance (separate from the form) lives in the
`sosGuidance` object in the same file.

---

## 🛡️ Safety Note

This is an **educational prototype**. It never claims to diagnose a disease
or give guaranteed advice — all guidance uses language like "Possible
issue" and "Needs further checking," and always encourages contacting a
qualified agricultural expert for serious or spreading problems. No
pesticide dosage instructions are given anywhere in the app.

---

## 🎭 Demo Data (for quick presentation)

```text
Farmer:          Ramesh
Location:        Duliajan, Assam
Crop:            Rice
Growth Stage:    Vegetative Growth
Last Irrigation: Yesterday
Problem:         No problem
Weather:         Rain expected
```

Click **"✨ Fill Demo Data"** on the Farm Form page to auto-fill these
values, then click **"🌾 Generate My Farm Plan"**.

---

## 🏆 The Big Idea

> Most agriculture websites tell farmers *what agriculture is*.
> **KhetBuddy tells farmers what to do next.**
