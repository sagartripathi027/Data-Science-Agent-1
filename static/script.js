// ── Element References ──────────────────────────────────────────────────────
const dropZone   = document.getElementById("drop-zone");
const fileInput  = document.getElementById("file-input");
const fileNameEl = document.getElementById("file-name");
const analyzeBtn = document.getElementById("analyze-btn");
const uploadForm = document.getElementById("upload-form");

// ── Validation ───────────────────────────────────────────────────────────────
const MAX_SIZE_MB  = 50;
const MAX_SIZE_B   = MAX_SIZE_MB * 1024 * 1024;

/**
 * Validates the chosen file.
 * Returns an error string, or null when the file is valid.
 */
function validate(file) {
  if (!file) return "No file selected.";
  if (!file.name.toLowerCase().endsWith(".csv")) return "Only .csv files are allowed.";
  if (file.size > MAX_SIZE_B) return `File exceeds ${MAX_SIZE_MB} MB limit.`;
  return null;
}

// ── UI Helpers ────────────────────────────────────────────────────────────────
function setFile(file) {
  const error = validate(file);
  if (error) {
    fileNameEl.textContent = `⚠️ ${error}`;
    fileNameEl.style.color = "#e05252";
    analyzeBtn.disabled = true;
    return;
  }

  // Sync the hidden input when file comes from drag-and-drop
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  fileInput.files = dataTransfer.files;

  fileNameEl.textContent = `✅ ${file.name}`;
  fileNameEl.style.color = "#4caf7d";
  analyzeBtn.disabled = false;
}

function setDragging(active) {
  dropZone.classList.toggle("drag-over", active);
}

// ── File Input (click / browse) ───────────────────────────────────────────────
fileInput.addEventListener("change", () => {
  setFile(fileInput.files[0] || null);
});

// ── Drag-and-Drop ─────────────────────────────────────────────────────────────
dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();           // allow drop
  setDragging(true);
});

dropZone.addEventListener("dragleave", (e) => {
  // Only clear when leaving the zone itself (not a child element)
  if (!dropZone.contains(e.relatedTarget)) setDragging(false);
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  setDragging(false);
  const file = e.dataTransfer.files[0] || null;
  setFile(file);
});

// ── Form Submit ───────────────────────────────────────────────────────────────
uploadForm.addEventListener("submit", (e) => {
  const error = validate(fileInput.files[0]);
  if (error) {
    e.preventDefault();
    fileNameEl.textContent = `⚠️ ${error}`;
    fileNameEl.style.color = "#e05252";
  }
});