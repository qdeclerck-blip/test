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

  // Visit date badge for "Visite planifiée"
  let visitBadgeHtml = "";
  if (prop.status === "Visite planifiée" && prop.visitDate) {
    const vd = new Date(prop.visitDate);
    const visitStr = vd.toLocaleDateString("fr-BE", { day: "numeric", month: "short" })
      + " " + vd.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
    visitBadgeHtml = `<div class="card-visit-date">&#x1F4C5; ${visitStr}</div>`;
  }

  card.innerHTML = `
    <input type="checkbox" class="card-checkbox" ${isChecked} data-id="${escapeAttr(prop.id)}">
    ${imageHtml}
    <div class="card-body">
      <div class="card-price">${formatEur(prop.price)}</div>
      <div class="card-address" title="${escapeAttr(prop.address)}">${escapeHtml(prop.address || "Adresse non renseignée")}</div>
      ${visitBadgeHtml}
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
    ["Rdt brut optimiste", ...selected.map((p) => (p.computedOptimistic ? p.computedOptimistic.grossYield.toFixed(2) + " %" : "—"))],
    ["Cash-flow optimiste", ...selected.map((p) => (p.computedOptimistic ? formatEur(p.computedOptimistic.monthlyCashflow) : "—"))],
    ["Rdt brut pessimiste", ...selected.map((p) => (p.computedPessimistic ? p.computedPessimistic.grossYield.toFixed(2) + " %" : "—"))],
    ["Cash-flow pessimiste", ...selected.map((p) => (p.computedPessimistic ? formatEur(p.computedPessimistic.monthlyCashflow) : "—"))],
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

  const calc = prop.calculator || {};
  const opti = prop.calculatorOptimistic || {};
  const pessi = prop.calculatorPessimistic || {};

  const body = document.getElementById("edit-modal-body");
  body.innerHTML = `
    <div class="edit-form">
      <label>Titre<input type="text" id="edit-title" value="${escapeAttr(prop.title)}"></label>
      <label>Prix (€)<input type="number" id="edit-price" value="${prop.price}" min="0"></label>
      <label>Surface (m²)<input type="number" id="edit-surface" value="${prop.surface}" min="0"></label>
      <label>Chambres<input type="number" id="edit-rooms" value="${prop.rooms}" min="0"></label>
      <label>Adresse<input type="text" id="edit-address" value="${escapeAttr(prop.address)}"></label>
      <label>Notes<textarea id="edit-notes" rows="2">${escapeHtml(prop.notes || "")}</textarea></label>

      <h4 class="edit-section-title">Analyse de base</h4>
      <label>Loyer estimé (€)<input type="number" id="edit-rent" value="${calc.monthlyRent || 0}" min="0"></label>
      <label>Charges (€)<input type="number" id="edit-charges" value="${calc.monthlyCharges || 0}" min="0"></label>
      <label>Frais notaire (€)<input type="number" id="edit-notary" value="${calc.notaryFees || 0}" min="0"></label>
      <label>Travaux (€)<input type="number" id="edit-renovation" value="${calc.renovationCost || 0}" min="0"></label>

      <h4 class="edit-section-title">&#x1F31E; Scénario optimiste</h4>
      <label>Loyer (€)<input type="number" id="edit-rent-opti" value="${opti.monthlyRent || 0}" min="0"></label>
      <label>Charges (€)<input type="number" id="edit-charges-opti" value="${opti.monthlyCharges || 0}" min="0"></label>
      <label>Travaux (€)<input type="number" id="edit-renovation-opti" value="${opti.renovationCost || 0}" min="0"></label>

      <h4 class="edit-section-title">&#x1F327;&#xFE0F; Scénario pessimiste</h4>
      <label>Loyer (€)<input type="number" id="edit-rent-pessi" value="${pessi.monthlyRent || 0}" min="0"></label>
      <label>Charges (€)<input type="number" id="edit-charges-pessi" value="${pessi.monthlyCharges || 0}" min="0"></label>
      <label>Travaux (€)<input type="number" id="edit-renovation-pessi" value="${pessi.renovationCost || 0}" min="0"></label>

      <h4 class="edit-section-title">Pipeline</h4>
      <label>Statut
        <select id="edit-status">
          ${STATUSES.map((s) => `<option ${s === prop.status ? "selected" : ""}>${s}</option>`).join("")}
        </select>
      </label>
      <label>Date de visite<input type="datetime-local" id="edit-visit-date" value="${escapeAttr(prop.visitDate || "")}"></label>

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
    prop.visitDate = body.querySelector("#edit-visit-date").value || "";

    if (!prop.calculator) prop.calculator = {};
    prop.calculator.monthlyRent = parseFloat(body.querySelector("#edit-rent").value) || 0;
    prop.calculator.monthlyCharges = parseFloat(body.querySelector("#edit-charges").value) || 0;
    prop.calculator.notaryFees = parseFloat(body.querySelector("#edit-notary").value) || 0;
    prop.calculator.renovationCost = parseFloat(body.querySelector("#edit-renovation").value) || 0;

    if (!prop.calculatorOptimistic) prop.calculatorOptimistic = {};
    prop.calculatorOptimistic.monthlyRent = parseFloat(body.querySelector("#edit-rent-opti").value) || 0;
    prop.calculatorOptimistic.monthlyCharges = parseFloat(body.querySelector("#edit-charges-opti").value) || 0;
    prop.calculatorOptimistic.renovationCost = parseFloat(body.querySelector("#edit-renovation-opti").value) || 0;

    if (!prop.calculatorPessimistic) prop.calculatorPessimistic = {};
    prop.calculatorPessimistic.monthlyRent = parseFloat(body.querySelector("#edit-rent-pessi").value) || 0;
    prop.calculatorPessimistic.monthlyCharges = parseFloat(body.querySelector("#edit-charges-pessi").value) || 0;
    prop.calculatorPessimistic.renovationCost = parseFloat(body.querySelector("#edit-renovation-pessi").value) || 0;

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
  const calc = prop.calculator || {};
  const r = calc.monthlyRent || 0;
  const c = calc.monthlyCharges || 0;
  const nf = calc.notaryFees || 0;
  const rv = calc.renovationCost || 0;
  const total = p + nf + rv;

  if (!prop.computed) prop.computed = {};
  prop.computed.totalAcquisitionPrice = total;
  prop.computed.grossYield = p > 0 ? ((r * 12) / p) * 100 : 0;
  prop.computed.netYield = total > 0 ? (((r - c) * 12) / total) * 100 : 0;

  const mRate = 0.035 / 12;
  const months = 25 * 12;

  const loanAmount = total * 0.8;
  let mp = 0;
  if (loanAmount > 0) {
    mp = (loanAmount * mRate * Math.pow(1 + mRate, months)) / (Math.pow(1 + mRate, months) - 1);
  }
  prop.computed.monthlyCashflow = r - c - mp;
  prop.computed.pricePerSqm = prop.surface > 0 ? p / prop.surface : 0;

  // Optimistic
  const o = prop.calculatorOptimistic || {};
  if (!prop.computedOptimistic) prop.computedOptimistic = {};
  const totalO = p + nf + (o.renovationCost || rv);
  prop.computedOptimistic.grossYield = p > 0 ? (((o.monthlyRent || 0) * 12) / p) * 100 : 0;
  prop.computedOptimistic.netYield = totalO > 0 ? ((((o.monthlyRent || 0) - (o.monthlyCharges || 0)) * 12) / totalO) * 100 : 0;
  const loanO = totalO * 0.8;
  const mpO = loanO > 0 ? (loanO * mRate * Math.pow(1 + mRate, months)) / (Math.pow(1 + mRate, months) - 1) : 0;
  prop.computedOptimistic.monthlyCashflow = (o.monthlyRent || 0) - (o.monthlyCharges || 0) - mpO;

  // Pessimistic
  const pe = prop.calculatorPessimistic || {};
  if (!prop.computedPessimistic) prop.computedPessimistic = {};
  const totalP = p + nf + (pe.renovationCost || rv);
  prop.computedPessimistic.grossYield = p > 0 ? (((pe.monthlyRent || 0) * 12) / p) * 100 : 0;
  prop.computedPessimistic.netYield = totalP > 0 ? ((((pe.monthlyRent || 0) - (pe.monthlyCharges || 0)) * 12) / totalP) * 100 : 0;
  const loanP = totalP * 0.8;
  const mpP = loanP > 0 ? (loanP * mRate * Math.pow(1 + mRate, months)) / (Math.pow(1 + mRate, months) - 1) : 0;
  prop.computedPessimistic.monthlyCashflow = (pe.monthlyRent || 0) - (pe.monthlyCharges || 0) - mpP;
}

// --- CSV Export ---
function exportCSV() {
  if (properties.length === 0) return;

  const headers = [
    "Titre", "Prix", "Surface", "Chambres", "Adresse", "URL", "Date",
    "Notes", "Tags", "Statut", "Score", "Date de visite",
    "Loyer", "Charges", "Frais notaire", "Travaux",
    "Prix total acquisition", "Rendement brut (%)", "Rendement net (%)",
    "Cash-flow mensuel", "Prix/m²",
    "Loyer optimiste", "Charges optimiste", "Travaux optimiste",
    "Rdt brut optimiste (%)", "Rdt net optimiste (%)", "Cash-flow optimiste",
    "Loyer pessimiste", "Charges pessimiste", "Travaux pessimiste",
    "Rdt brut pessimiste (%)", "Rdt net pessimiste (%)", "Cash-flow pessimiste",
  ];

  const rows = properties.map((p) => {
    const calc = p.calculator || {};
    const comp = p.computed || {};
    const opti = p.calculatorOptimistic || {};
    const compO = p.computedOptimistic || {};
    const pessi = p.calculatorPessimistic || {};
    const compP = p.computedPessimistic || {};
    return [
      csvSafe(p.title), p.price, p.surface, p.rooms,
      csvSafe(p.address), csvSafe(p.url), p.savedAt,
      csvSafe(p.notes), csvSafe((p.tags || []).join(", ")),
      csvSafe(p.status), p.score, csvSafe(p.visitDate || ""),
      calc.monthlyRent || 0, calc.monthlyCharges || 0, calc.notaryFees || 0, calc.renovationCost || 0,
      comp.totalAcquisitionPrice || 0, (comp.grossYield || 0).toFixed(2), (comp.netYield || 0).toFixed(2),
      (comp.monthlyCashflow || 0).toFixed(2), (comp.pricePerSqm || 0).toFixed(2),
      opti.monthlyRent || 0, opti.monthlyCharges || 0, opti.renovationCost || 0,
      (compO.grossYield || 0).toFixed(2), (compO.netYield || 0).toFixed(2), (compO.monthlyCashflow || 0).toFixed(2),
      pessi.monthlyRent || 0, pessi.monthlyCharges || 0, pessi.renovationCost || 0,
      (compP.grossYield || 0).toFixed(2), (compP.netYield || 0).toFixed(2), (compP.monthlyCashflow || 0).toFixed(2),
    ];
  });

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
