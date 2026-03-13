"use strict";

const STATUSES = [
  "À étudier",
  "À visiter",
  "Visite planifiée",
  "Visité",
  "Offre faite",
  "Acquis",
  "Abandonné",
];

let properties = [];
let selectedIds = new Set();

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  loadProperties();

  document.getElementById("btn-compare").addEventListener("click", openCompareModal);
  document.getElementById("btn-export").addEventListener("click", exportCSV);
  document.getElementById("modal-close").addEventListener("click", () => {
    document.getElementById("compare-modal").classList.remove("visible");
  });
  document.getElementById("edit-modal-close").addEventListener("click", () => {
    document.getElementById("edit-modal").classList.remove("visible");
  });
});

function loadProperties() {
  chrome.storage.local.get({ immotracker_properties: [] }, (result) => {
    properties = result.immotracker_properties;
    renderBoard();
  });
}

function saveProperties(cb) {
  chrome.storage.local.set({ immotracker_properties: properties }, cb);
}

// --- Kanban Rendering ---
function renderBoard() {
  const board = document.getElementById("kanban-board");
  board.innerHTML = "";

  STATUSES.forEach((status) => {
    const col = document.createElement("div");
    col.className = "kanban-column";
    col.dataset.status = status;

    const items = properties.filter((p) => p.status === status);

    col.innerHTML = `
      <div class="kanban-column-header">
        <span>${status}</span>
        <span class="count">${items.length}</span>
      </div>
    `;

    const cardsContainer = document.createElement("div");
    cardsContainer.className = "kanban-cards";

    if (items.length === 0) {
      cardsContainer.innerHTML = '<div class="kanban-empty">Aucun bien</div>';
    }

    items.forEach((prop) => {
      cardsContainer.appendChild(createCard(prop));
    });

    col.appendChild(cardsContainer);

    // Drag & drop targets
    col.addEventListener("dragover", (e) => {
      e.preventDefault();
      col.classList.add("drag-over");
    });
    col.addEventListener("dragleave", () => {
      col.classList.remove("drag-over");
    });
    col.addEventListener("drop", (e) => {
      e.preventDefault();
      col.classList.remove("drag-over");
      const id = e.dataTransfer.getData("text/plain");
      const prop = properties.find((p) => p.id === id);
      if (prop && prop.status !== status) {
        prop.status = status;
        saveProperties(() => renderBoard());
      }
    });

    board.appendChild(col);
  });

  updateCompareButton();
}

function createCard(prop) {
  const card = document.createElement("div");
  card.className = "kanban-card";
  card.draggable = true;
  card.dataset.id = prop.id;

  card.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", prop.id);
    card.classList.add("dragging");
  });
  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
  });

  const starsHtml = renderStars(prop.score);
  const grossYield = prop.computed ? prop.computed.grossYield : 0;
  const yieldClass = grossYield >= 5 ? "positive" : grossYield > 0 ? "" : "negative";
  const dateStr = prop.savedAt ? new Date(prop.savedAt).toLocaleDateString("fr-BE") : "";

  const isChecked = selectedIds.has(prop.id) ? "checked" : "";

  let imageHtml;
  if (prop.imageUrl) {
    imageHtml = `<img class="card-image" src="${escapeAttr(prop.imageUrl)}" alt="" onerror="this.outerHTML='<div class=\\'card-image-placeholder\\'>🏠</div>'">`;
  } else {
    imageHtml = '<div class="card-image-placeholder">🏠</div>';
  }

  card.innerHTML = `
    <input type="checkbox" class="card-checkbox" ${isChecked} data-id="${escapeAttr(prop.id)}">
    ${imageHtml}
    <div class="card-body">
      <div class="card-price">${formatEur(prop.price)}</div>
      <div class="card-address" title="${escapeAttr(prop.address)}">${escapeHtml(prop.address || "Adresse non renseignée")}</div>
      <div class="card-meta">
        <span class="card-stars">${starsHtml}</span>
        <span class="card-yield ${yieldClass}">${grossYield.toFixed(1)}%</span>
      </div>
      <div class="card-date">${dateStr}</div>
    </div>
    <div class="card-actions">
      <button class="card-btn btn-view" data-url="${escapeAttr(prop.url)}">Voir</button>
      <button class="card-btn btn-edit" data-id="${escapeAttr(prop.id)}">Modifier</button>
      <button class="card-btn danger btn-delete" data-id="${escapeAttr(prop.id)}">Supprimer</button>
    </div>
  `;

  // Events
  card.querySelector(".card-checkbox").addEventListener("change", (e) => {
    toggleSelect(prop.id, e.target.checked);
  });

  card.querySelector(".btn-view").addEventListener("click", () => {
    chrome.tabs.create({ url: prop.url });
  });

  card.querySelector(".btn-edit").addEventListener("click", () => {
    openEditModal(prop.id);
  });

  card.querySelector(".btn-delete").addEventListener("click", () => {
    if (confirm("Supprimer ce bien ?")) {
      properties = properties.filter((p) => p.id !== prop.id);
      selectedIds.delete(prop.id);
      saveProperties(() => renderBoard());
    }
  });

  return card;
}

function renderStars(score) {
  let s = "";
  for (let i = 1; i <= 5; i++) {
    s += i <= score ? "★" : "☆";
  }
  return s;
}

function formatEur(v) {
  return (v || 0).toLocaleString("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

// --- Selection ---
function toggleSelect(id, checked) {
  if (checked) {
    if (selectedIds.size >= 3) {
      // Uncheck - too many
      const card = document.querySelector(`.card-checkbox[data-id="${id}"]`);
      if (card) card.checked = false;
      return;
    }
    selectedIds.add(id);
  } else {
    selectedIds.delete(id);
  }
  updateCompareButton();
}

function updateCompareButton() {
  const btn = document.getElementById("btn-compare");
  const count = document.getElementById("compare-count");
  count.textContent = selectedIds.size;
  btn.disabled = selectedIds.size < 2;
}

// --- Compare ---
function openCompareModal() {
  const selected = properties.filter((p) => selectedIds.has(p.id));
  if (selected.length < 2) return;

  const table = document.getElementById("compare-table");
  const headers = ["Critère", ...selected.map((p) => p.address || p.title || "Bien")];

  const rows = [
    ["Prix", ...selected.map((p) => formatEur(p.price))],
    ["Surface", ...selected.map((p) => (p.surface ? p.surface + " m²" : "—"))],
    ["Prix/m²", ...selected.map((p) => (p.computed && p.computed.pricePerSqm ? formatEur(p.computed.pricePerSqm) : "—"))],
    ["Loyer estimé", ...selected.map((p) => (p.calculator ? formatEur(p.calculator.monthlyRent) : "—"))],
    ["Rendement brut", ...selected.map((p) => (p.computed ? p.computed.grossYield.toFixed(2) + " %" : "—"))],
    ["Rendement net", ...selected.map((p) => (p.computed ? p.computed.netYield.toFixed(2) + " %" : "—"))],
    ["Cash-flow", ...selected.map((p) => (p.computed ? formatEur(p.computed.monthlyCashflow) : "—"))],
    ["Score", ...selected.map((p) => renderStars(p.score))],
    ["Statut", ...selected.map((p) => p.status)],
    ["Notes", ...selected.map((p) => escapeHtml(p.notes || "—"))],
  ];

  let html = "<thead><tr>";
  headers.forEach((h) => (html += `<th>${escapeHtml(h)}</th>`));
  html += "</tr></thead><tbody>";
  rows.forEach((row) => {
    html += "<tr>";
    row.forEach((cell) => (html += `<td>${cell}</td>`));
    html += "</tr>";
  });
  html += "</tbody>";
  table.innerHTML = html;

  document.getElementById("compare-modal").classList.add("visible");
}

// --- Edit modal ---
function openEditModal(id) {
  const prop = properties.find((p) => p.id === id);
  if (!prop) return;

  const body = document.getElementById("edit-modal-body");
  body.innerHTML = `
    <div class="edit-form">
      <label>Titre<input type="text" id="edit-title" value="${escapeAttr(prop.title)}"></label>
      <label>Prix (€)<input type="number" id="edit-price" value="${prop.price}" min="0"></label>
      <label>Surface (m²)<input type="number" id="edit-surface" value="${prop.surface}" min="0"></label>
      <label>Chambres<input type="number" id="edit-rooms" value="${prop.rooms}" min="0"></label>
      <label>Adresse<input type="text" id="edit-address" value="${escapeAttr(prop.address)}"></label>
      <label>Notes<textarea id="edit-notes" rows="2">${escapeHtml(prop.notes || "")}</textarea></label>
      <label>Loyer estimé (€)<input type="number" id="edit-rent" value="${prop.calculator ? prop.calculator.monthlyRent : 0}" min="0"></label>
      <label>Charges (€)<input type="number" id="edit-charges" value="${prop.calculator ? prop.calculator.monthlyCharges : 0}" min="0"></label>
      <label>Frais notaire (€)<input type="number" id="edit-notary" value="${prop.calculator ? prop.calculator.notaryFees : 0}" min="0"></label>
      <label>Travaux (€)<input type="number" id="edit-renovation" value="${prop.calculator ? prop.calculator.renovationCost : 0}" min="0"></label>
      <label>Statut
        <select id="edit-status">
          ${STATUSES.map((s) => `<option ${s === prop.status ? "selected" : ""}>${s}</option>`).join("")}
        </select>
      </label>
      <label>Score</label>
      <div class="edit-stars" id="edit-stars">
        ${[1, 2, 3, 4, 5].map((i) => `<span class="edit-star ${i <= prop.score ? "active" : ""}" data-v="${i}">★</span>`).join("")}
      </div>
      <button class="edit-save-btn" id="edit-save">Sauvegarder</button>
    </div>
  `;

  let editScore = prop.score;

  body.querySelectorAll(".edit-star").forEach((star) => {
    star.addEventListener("click", () => {
      editScore = parseInt(star.dataset.v, 10);
      body.querySelectorAll(".edit-star").forEach((s, i) => {
        s.classList.toggle("active", i < editScore);
      });
    });
  });

  body.querySelector("#edit-save").addEventListener("click", () => {
    prop.title = body.querySelector("#edit-title").value;
    prop.price = parseFloat(body.querySelector("#edit-price").value) || 0;
    prop.surface = parseFloat(body.querySelector("#edit-surface").value) || 0;
    prop.rooms = parseInt(body.querySelector("#edit-rooms").value, 10) || 0;
    prop.address = body.querySelector("#edit-address").value;
    prop.notes = body.querySelector("#edit-notes").value;
    prop.status = body.querySelector("#edit-status").value;
    prop.score = editScore;

    if (!prop.calculator) prop.calculator = {};
    prop.calculator.monthlyRent = parseFloat(body.querySelector("#edit-rent").value) || 0;
    prop.calculator.monthlyCharges = parseFloat(body.querySelector("#edit-charges").value) || 0;
    prop.calculator.notaryFees = parseFloat(body.querySelector("#edit-notary").value) || 0;
    prop.calculator.renovationCost = parseFloat(body.querySelector("#edit-renovation").value) || 0;

    recompute(prop);
    saveProperties(() => {
      document.getElementById("edit-modal").classList.remove("visible");
      renderBoard();
    });
  });

  document.getElementById("edit-modal").classList.add("visible");
}

function recompute(prop) {
  const p = prop.price;
  const r = prop.calculator.monthlyRent;
  const c = prop.calculator.monthlyCharges;
  const nf = prop.calculator.notaryFees;
  const rv = prop.calculator.renovationCost;
  const total = p + nf + rv;

  if (!prop.computed) prop.computed = {};

  prop.computed.totalAcquisitionPrice = total;
  prop.computed.grossYield = p > 0 ? ((r * 12) / p) * 100 : 0;
  prop.computed.netYield = total > 0 ? (((r - c) * 12) / total) * 100 : 0;

  const loanAmount = total * 0.8;
  const mRate = 0.035 / 12;
  const months = 25 * 12;
  let mp = 0;
  if (loanAmount > 0) {
    mp = (loanAmount * mRate * Math.pow(1 + mRate, months)) / (Math.pow(1 + mRate, months) - 1);
  }
  prop.computed.monthlyCashflow = r - c - mp;
  prop.computed.pricePerSqm = prop.surface > 0 ? p / prop.surface : 0;
}

// --- CSV Export ---
function exportCSV() {
  if (properties.length === 0) return;

  const headers = [
    "Titre", "Prix", "Surface", "Chambres", "Adresse", "URL", "Date",
    "Notes", "Tags", "Statut", "Score",
    "Loyer", "Charges", "Frais notaire", "Travaux",
    "Prix total acquisition", "Rendement brut (%)", "Rendement net (%)",
    "Cash-flow mensuel", "Prix/m²",
  ];

  const rows = properties.map((p) => [
    csvSafe(p.title),
    p.price,
    p.surface,
    p.rooms,
    csvSafe(p.address),
    csvSafe(p.url),
    p.savedAt,
    csvSafe(p.notes),
    csvSafe((p.tags || []).join(", ")),
    csvSafe(p.status),
    p.score,
    p.calculator ? p.calculator.monthlyRent : 0,
    p.calculator ? p.calculator.monthlyCharges : 0,
    p.calculator ? p.calculator.notaryFees : 0,
    p.calculator ? p.calculator.renovationCost : 0,
    p.computed ? p.computed.totalAcquisitionPrice : 0,
    p.computed ? p.computed.grossYield.toFixed(2) : 0,
    p.computed ? p.computed.netYield.toFixed(2) : 0,
    p.computed ? p.computed.monthlyCashflow.toFixed(2) : 0,
    p.computed ? p.computed.pricePerSqm.toFixed(2) : 0,
  ]);

  let csv = "\uFEFF"; // BOM for Excel
  csv += headers.join(";") + "\n";
  rows.forEach((row) => (csv += row.join(";") + "\n"));

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "immotracker_export.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function csvSafe(str) {
  if (!str) return "";
  str = String(str).replace(/"/g, '""');
  if (str.includes(";") || str.includes('"') || str.includes("\n")) {
    return '"' + str + '"';
  }
  return str;
}

// --- Utilities ---
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
