// script.js
// This single file powers all the interactive behaviour of KhetBuddy:
//   1. Page navigation (Home / Farm Form / Timeline / SOS)
//   2. The rule-based recommendation engine
//   3. Saving farm data to the backend (SQLite via Express API)
//   4. The crop timeline + checklist (persisted with localStorage)
//   5. The Agriculture SOS symptom checker

// -----------------------------------------------------------
// 1. NAVIGATION
// -----------------------------------------------------------

function showPage(pageId) {
  document.querySelectorAll(".page").forEach((page) => page.classList.remove("active"));
  document.getElementById("page-" + pageId).classList.add("active");

  // Close mobile menu after a link is tapped
  document.getElementById("navLinks").classList.remove("show");

  // Refresh the timeline whenever that page is opened
  if (pageId === "timeline") {
    renderTimeline();
    renderChecklist();
  }
}

document.getElementById("hamburgerBtn").addEventListener("click", () => {
  document.getElementById("navLinks").classList.toggle("show");
});

// -----------------------------------------------------------
// 2. RECOMMENDATION ENGINE
// -----------------------------------------------------------
// The engine works in two layers:
//   a) A base recommendation for each Crop + Growth Stage combination.
//   b) Adjustments layered on top based on last irrigation, weather,
//      and any visible crop problem.

const baseRecommendations = {
  Rice: {
    Sowing: { water: "Keep soil consistently moist for even seed germination.", task: "Prepare and level the field, and clear any debris.", watch: "Watch for birds or rodents disturbing sown seeds." },
    Germination: { water: "Maintain a thin water layer in the field.", task: "Check seedling emergence across the field.", watch: "Look out for damping-off or weak seedlings." },
    "Vegetative Growth": { water: "Maintain 2–5 cm standing water in the field.", task: "Inspect the field for weeds and remove them.", watch: "Check leaves for early signs of pests or disease." },
    Flowering: { water: "Keep consistent water level; avoid letting the field dry out.", task: "Avoid heavy field activity that disturbs flowering.", watch: "Watch for stem borers and panicle pests." },
    Fruiting: { water: "Maintain moderate water level as grains fill.", task: "Monitor grain filling and support lodging-prone plants.", watch: "Check for grain discoloration or pest damage on panicles." },
    Harvest: { water: "Drain the field a few days before harvesting.", task: "Plan harvesting once grains turn golden and firm.", watch: "Watch weather forecasts to avoid harvesting in rain." },
  },
  Wheat: {
    Sowing: { water: "Ensure light irrigation right after sowing for germination.", task: "Check seed depth and row spacing.", watch: "Watch for uneven germination patches." },
    Germination: { water: "Keep soil moist but not waterlogged.", task: "Check for uniform seedling emergence.", watch: "Watch for termite or ant activity near roots." },
    "Vegetative Growth": { water: "Irrigate at the crown root initiation stage if soil looks dry.", task: "Remove weeds competing with young wheat plants.", watch: "Check lower leaves for rust-like yellow/orange spots." },
    Flowering: { water: "Irrigate lightly if there is no recent rainfall.", task: "Avoid nitrogen top-dressing during heavy wind.", watch: "Watch for aphids clustering near the ear." },
    Fruiting: { water: "Reduce irrigation frequency as grains begin to fill.", task: "Support the crop against lodging in windy weather.", watch: "Check for grain discoloration or fungal spots." },
    Harvest: { water: "Stop irrigation completely before harvest.", task: "Plan harvest when grains are hard and golden.", watch: "Watch for shattering if harvest is delayed too long." },
  },
  Maize: {
    Sowing: { water: "Irrigate lightly right after sowing to aid germination.", task: "Ensure proper spacing between seeds/rows.", watch: "Watch for seed/seedling damage from birds or insects." },
    Germination: { water: "Keep soil evenly moist during emergence.", task: "Check germination rate across the plot.", watch: "Watch for cutworm damage on young seedlings." },
    "Vegetative Growth": { water: "Irrigate every 5–7 days depending on soil moisture.", task: "Remove weeds and consider light earthing-up.", watch: "Check whorls for fall armyworm damage." },
    Flowering: { water: "Do not let the crop face water stress during tasseling.", task: "Ensure good pollination conditions; avoid disturbance.", watch: "Watch for silk-feeding insects." },
    Fruiting: { water: "Maintain steady soil moisture during cob development.", task: "Check cob filling and support heavy plants if needed.", watch: "Watch for cob borers or fungal growth on husks." },
    Harvest: { water: "Reduce irrigation as cobs mature and dry down.", task: "Harvest once husks turn brown and dry.", watch: "Watch for pest damage in stored/drying cobs." },
  },
  Mustard: {
    Sowing: { water: "Light irrigation helps even germination.", task: "Ensure shallow, even seed placement.", watch: "Watch for poor emergence in dry patches." },
    Germination: { water: "Keep topsoil slightly moist, avoid waterlogging.", task: "Thin out overcrowded seedlings if needed.", watch: "Watch for aphid clusters on young leaves." },
    "Vegetative Growth": { water: "Irrigate if soil moisture drops noticeably.", task: "Remove weeds competing with mustard plants.", watch: "Check leaves for aphids or powdery mildew." },
    Flowering: { water: "Avoid water stress; light irrigation helps flowering.", task: "Avoid disturbing plants during peak flowering.", watch: "Watch closely for aphid buildup on flower stalks." },
    Fruiting: { water: "Reduce irrigation as pods begin to form.", task: "Monitor pod development across the field.", watch: "Watch for pod-feeding insects." },
    Harvest: { water: "Stop irrigation before harvest to avoid pod shattering.", task: "Harvest when pods turn yellow-brown and dry.", watch: "Watch for shattering losses if harvest is delayed." },
  },
  Potato: {
    Sowing: { water: "Irrigate right after planting tubers.", task: "Ensure proper spacing and planting depth.", watch: "Watch for tuber rot in waterlogged patches." },
    Germination: { water: "Keep soil consistently moist during sprouting.", task: "Check emergence of shoots above soil.", watch: "Watch for cutworms damaging young shoots." },
    "Vegetative Growth": { water: "Irrigate every 5–7 days; avoid waterlogging.", task: "Earth-up soil around the base of plants.", watch: "Check leaves for early blight or aphids." },
    Flowering: { water: "Maintain steady soil moisture during tuber initiation.", task: "Avoid disturbing root zone during flowering.", watch: "Watch closely for late blight symptoms on leaves." },
    Fruiting: { water: "Keep consistent moisture as tubers bulk up.", task: "Monitor tuber size and hilling.", watch: "Watch for tuber moth or blight spreading." },
    Harvest: { water: "Stop irrigation 1–2 weeks before harvest.", task: "Harvest once foliage dries and skins set.", watch: "Watch for damaged or rotting tubers." },
  },
  Tomato: {
    Sowing: { water: "Keep nursery soil consistently moist.", task: "Prepare beds or seedling trays properly.", watch: "Watch for damping-off in overly wet nursery soil." },
    Germination: { water: "Maintain light, even moisture for seedlings.", task: "Check seedling health before transplanting.", watch: "Watch for weak or leggy seedlings." },
    "Vegetative Growth": { water: "Irrigate every 3–5 days depending on weather.", task: "Stake plants and remove weeds.", watch: "Check leaves for early blight or aphids." },
    Flowering: { water: "Avoid water stress during flowering for good fruit set.", task: "Support plants and avoid excess nitrogen.", watch: "Watch for flower drop due to heat or pests." },
    Fruiting: { water: "Maintain steady, even watering to prevent fruit cracking.", task: "Monitor fruit development and support heavy branches.", watch: "Watch for fruit borers and blossom-end rot." },
    Harvest: { water: "Irrigate moderately; avoid overwatering near harvest.", task: "Harvest fruits at the right ripeness stage regularly.", watch: "Watch for overripe fruit attracting pests." },
  },
};

// Generic fallback used for "Other" crop or any unmapped combination.
const genericRecommendation = {
  water: "Check soil moisture and irrigate if the topsoil feels dry.",
  task: "Inspect the field generally and remove weeds if present.",
  watch: "Keep an eye on leaves and stems for anything unusual.",
};

// Weather-based adjustments to the water advice.
function getWeatherNote(weather) {
  switch (weather) {
    case "Rain expected":
      return "Rain expected — avoid unnecessary irrigation today.";
    case "Sunny":
      return "Sunny conditions — soil may dry faster, monitor moisture.";
    case "Cloudy":
      return "Cloudy skies — normal watering schedule should be fine.";
    default:
      return "Weather unclear — check a local forecast before planning irrigation.";
  }
}

// Problem-based override for the "Watch For" section and priority.
const problemGuidance = {
  "Yellow leaves": "Yellowing could point to a nutrient issue or overwatering — inspect closely.",
  "Brown spots": "Brown spots may indicate a fungal issue — inspect affected leaves closely.",
  "Holes in leaves": "Holes usually mean chewing insects are active — check leaf undersides.",
  Wilting: "Wilting can mean water stress or root issues — check soil moisture and roots.",
  "Pest/insect visible": "Insects are visible — inspect the extent of infestation before acting.",
  Other: "An unusual symptom was noted — inspect the crop closely today.",
};

function generateActionPlan(inputs) {
  const { crop, stage, irrigation, problem, weather } = inputs;

  const cropData = baseRecommendations[crop] || {};
  const base = cropData[stage] || genericRecommendation;

  let water = base.water;
  let task = base.task;
  let watch = base.watch;
  let priority = task;
  let healthStatus = "Looking Good";

  // Adjust for last irrigation
  if (irrigation === "More than 3 days ago" && weather !== "Rain expected") {
    water = "Field looks overdue for water — irrigate soon if soil is dry. " + water;
  }

  // Adjust for weather
  const weatherNote = getWeatherNote(weather);
  if (weather === "Rain expected") {
    water = "Rain expected — hold off on irrigation for now.";
  }

  // Adjust for visible problem
  if (problem && problem !== "No problem") {
    watch = problemGuidance[problem] || watch;
    priority = "Inspect the crop closely for " + problem.toLowerCase() + " before taking further action.";
    healthStatus = "Needs Attention";
  } else {
    priority = task;
  }

  return {
    water,
    task,
    watch,
    weatherNote,
    priority,
    healthStatus,
  };
}

// -----------------------------------------------------------
// 3. FORM HANDLING + SAVING TO BACKEND
// -----------------------------------------------------------

function fillDemoData() {
  document.getElementById("farmerName").value = "Ramesh";
  document.getElementById("location").value = "Duliajan, Assam";
  document.getElementById("crop").value = "Rice";
  document.getElementById("stage").value = "Vegetative Growth";
  document.getElementById("irrigation").value = "Yesterday";
  document.getElementById("problem").value = "No problem";
  document.getElementById("weather").value = "Rain expected";
}

let currentFarmId = null;

document.getElementById("farmForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const inputs = {
    name: document.getElementById("farmerName").value.trim(),
    location: document.getElementById("location").value.trim(),
    crop: document.getElementById("crop").value,
    stage: document.getElementById("stage").value,
    irrigation: document.getElementById("irrigation").value,
    problem: document.getElementById("problem").value,
    weather: document.getElementById("weather").value,
  };

  // Generate the plan instantly on the client side (works even if the
  // backend is briefly unavailable, since this is pure JavaScript logic).
  const plan = generateActionPlan(inputs);
  displayPlan(inputs, plan);

  // Save the farm + default checklist tasks to the backend/SQLite database.
  try {
    const response = await fetch("/api/farms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: inputs.name,
        location: inputs.location,
        crop: inputs.crop,
        growth_stage: inputs.stage,
        last_irrigation: inputs.irrigation,
        crop_problem: inputs.problem,
        weather: inputs.weather,
      }),
    });

    const data = await response.json();
    currentFarmId = data.farm_id;

    // Store crop/stage locally so the Timeline page can use them.
    localStorage.setItem("khetbuddy_crop", inputs.crop);
    localStorage.setItem("khetbuddy_stage", inputs.stage);
    localStorage.setItem("khetbuddy_farm_id", currentFarmId || "");

    // Seed a fresh checklist for this farm (also saved to the backend).
    seedChecklist(inputs.stage, inputs.problem);
  } catch (error) {
    // If the backend isn't running, the plan still works locally.
    console.warn("Could not reach backend. The plan above still works offline.", error);
    localStorage.setItem("khetbuddy_crop", inputs.crop);
    localStorage.setItem("khetbuddy_stage", inputs.stage);
    seedChecklist(inputs.stage, inputs.problem);
  }
});

function displayPlan(inputs, plan) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  document.getElementById("greetingText").textContent =
    `${greeting}, ${inputs.name || "Farmer"}! 🌱 Here's what your farm needs today.`;

  document.getElementById("resultCrop").textContent = inputs.crop;
  document.getElementById("resultStage").textContent = inputs.stage;

  document.getElementById("planWater").textContent = plan.water;
  document.getElementById("planTask").textContent = plan.task;
  document.getElementById("planWatch").textContent = plan.watch;
  document.getElementById("planWeather").textContent = plan.weatherNote;
  document.getElementById("planPriority").textContent = plan.priority;

  const healthEl = document.getElementById("healthIndicator");
  healthEl.textContent = "Crop Status: " + plan.healthStatus;
  healthEl.className = "health-indicator " + (plan.healthStatus === "Looking Good" ? "good" : "attention");

  document.getElementById("resultCard").classList.remove("hidden");
  document.getElementById("resultCard").scrollIntoView({ behavior: "smooth" });
}

// -----------------------------------------------------------
// 4. CROP TIMELINE + CHECKLIST (localStorage-backed)
// -----------------------------------------------------------

const stageOrder = ["Sowing", "Germination", "Vegetative Growth", "Flowering", "Fruiting", "Harvest"];

function renderTimeline() {
  const currentStage = localStorage.getItem("khetbuddy_stage") || "Sowing";
  document.querySelectorAll(".timeline-step").forEach((step) => {
    step.classList.toggle("current", step.dataset.stage === currentStage);
  });
}

// Default checklist items depending on stage, with an extra item if a problem was reported.
function getDefaultChecklist(stage, problem) {
  const common = {
    Sowing: ["Check seed/soil preparation", "Confirm proper spacing", "Record sowing date"],
    Germination: ["Check water level", "Inspect seedling emergence", "Note any bare patches"],
    "Vegetative Growth": ["Check water level", "Inspect leaves for pests", "Remove weeds", "Record crop condition"],
    Flowering: ["Check water level", "Avoid disturbing flowering plants", "Watch for pests near flowers"],
    Fruiting: ["Check water level", "Monitor fruit/grain development", "Support heavy branches if needed"],
    Harvest: ["Check crop readiness", "Plan harvesting date", "Arrange storage/transport"],
  };

  const items = common[stage] || ["Check water level", "Inspect the field", "Record crop condition"];

  if (problem && problem !== "No problem") {
    items.push("Closely inspect for: " + problem);
  }

  return items;
}

function seedChecklist(stage, problem) {
  const items = getDefaultChecklist(stage, problem).map((task, index) => ({
    id: "task-" + Date.now() + "-" + index,
    task,
    completed: false,
  }));

  localStorage.setItem("khetbuddy_checklist", JSON.stringify(items));

  // Also try saving each task to the backend so it's stored in SQLite.
  const farmId = localStorage.getItem("khetbuddy_farm_id");
  if (farmId) {
    items.forEach((item) => {
      fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farm_id: farmId, task: item.task }),
      }).catch(() => {
        /* Backend may be offline — checklist still works via localStorage. */
      });
    });
  }
}

function renderChecklist() {
  const stage = localStorage.getItem("khetbuddy_stage") || "Sowing";
  document.getElementById("checklistTitle").textContent = "Checklist — " + stage;

  let items = JSON.parse(localStorage.getItem("khetbuddy_checklist") || "null");
  if (!items) {
    items = getDefaultChecklist(stage, null).map((task, index) => ({
      id: "task-" + index,
      task,
      completed: false,
    }));
    localStorage.setItem("khetbuddy_checklist", JSON.stringify(items));
  }

  const list = document.getElementById("checklistItems");
  list.innerHTML = "";

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = item.completed ? "done" : "";
    li.innerHTML = `
      <input type="checkbox" ${item.completed ? "checked" : ""} />
      <span>${item.task}</span>
    `;
    li.querySelector("input").addEventListener("change", (e) => {
      item.completed = e.target.checked;
      li.classList.toggle("done", item.completed);
      localStorage.setItem("khetbuddy_checklist", JSON.stringify(items));
    });
    list.appendChild(li);
  });
}

// -----------------------------------------------------------
// 5. AGRICULTURE SOS
// -----------------------------------------------------------

document.getElementById("imageUpload").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    document.getElementById("imagePreview").src = event.target.result;
    document.getElementById("imagePreviewWrap").classList.remove("hidden");
  };
  reader.readAsDataURL(file);
});

const sosGuidance = {
  "Yellow leaves": {
    issue: "Possible nutrient deficiency or overwatering.",
    check: "Check soil moisture and look at whether yellowing starts from older (lower) leaves.",
    avoid: "Do not add extra fertilizer immediately without confirming the cause.",
    expert: "If yellowing spreads quickly across the field, consult a local agricultural expert.",
  },
  "Brown spots": {
    issue: "Possible fungal leaf spot issue.",
    check: "Inspect the pattern and size of the spots, and check nearby plants for similar symptoms.",
    avoid: "Do not immediately apply pesticides without identifying the problem.",
    expert: "If spots increase rapidly or affect many plants, consult a local agricultural expert.",
  },
  "Holes in leaves": {
    issue: "Possible pest or leaf-chewing insect issue.",
    check: "Inspect the underside of leaves and nearby plants for insects.",
    avoid: "Do not immediately apply pesticides without identifying the problem.",
    expert: "If the problem spreads rapidly or affects a large part of the field, consult a local agricultural expert.",
  },
  Wilting: {
    issue: "Possible water stress or root-related issue.",
    check: "Check soil moisture levels and inspect the base of the stem and roots if possible.",
    avoid: "Do not overwater immediately — confirm whether the soil is actually dry first.",
    expert: "If wilting continues despite normal watering, consult a local agricultural expert.",
  },
  "Insects visible": {
    issue: "Possible pest infestation.",
    check: "Identify how many plants are affected and where the insects are concentrated.",
    avoid: "Do not apply chemical pesticides without confirming the pest type and safe dosage.",
    expert: "If the infestation is spreading, consult a local agricultural expert promptly.",
  },
  "Stunted growth": {
    issue: "Possible nutrient, soil, or root development issue.",
    check: "Compare affected plants with healthy ones and check soil condition around roots.",
    avoid: "Do not assume a single cause — avoid unnecessary chemical treatments right away.",
    expert: "If many plants show stunted growth, consult a local agricultural expert for soil testing.",
  },
};

document.querySelectorAll(".symptom-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".symptom-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");

    const symptom = btn.dataset.symptom;
    const info = sosGuidance[symptom];

    document.getElementById("sosIssue").textContent = info.issue;
    document.getElementById("sosCheck").textContent = info.check;
    document.getElementById("sosAvoid").textContent = info.avoid;
    document.getElementById("sosExpert").textContent = info.expert;

    document.getElementById("sosResult").classList.remove("hidden");
    document.getElementById("sosResult").scrollIntoView({ behavior: "smooth" });
  });
});

// -----------------------------------------------------------
// INITIAL LOAD
// -----------------------------------------------------------
renderTimeline();
