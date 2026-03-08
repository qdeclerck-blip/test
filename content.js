"use strict";

(function () {
  if (document.getElementById("immotracker-fab")) return;

  // --- Scraping helpers ---
  function scrapeProperty() {
    const getText = (sel) => {
      const el = document.querySelector(sel);
      return el ? el.textContent.trim() : "";
    };

    const title = getText("h1.classified__title") || getText("h1") || "";

    let price = 0;
    const priceEl =
      document.querySelector('p.classified__price span.sr-only') ||
      document.querySelector('.classified__header--immoweb-code')?.parentElement?.querySelector('[class*="price"]') ||
      document.querySelector('[class*="price"]');
    if (priceEl) {
      const m = priceEl.textContent.replace(/\s/g, "").match(/([\d.,]+)/);
      if (m) price = parseInt(m[1].replace(/\./g, "").replace(",", ""), 10) || 0;
    }

    let surface = 0;
    const surfaceEl = document.querySelector('[class*="surface"]');
    if (surfaceEl) {
      const m = surfaceEl.textContent.replace(/\s/g, "").match(/([\d.,]+)/);
      if (m) surface = parseFloat(m[1].replace(",", ".")) || 0;
    }
    if (!surface) {
      document.querySelectorAll("th, td, .classified-table__header").forEach((el) => {
        if (/surface|superficie/i.test(el.textContent)) {
          const next = el.nextElementSibling;
          if (next) {
            const m2 = next.textContent.replace(/\s/g, "").match(/([\d.,]+)/);
            if (m2) surface = parseFloat(m2[1].replace(",", ".")) || 0;
          }
        }
      });
    }

    let rooms = 0;
    document.querySelectorAll("th, td, .classified-table__header").forEach((el) => {
      if (/chambres|pièces|rooms|bedrooms/i.test(el.textContent)) {
        const next = el.nextElementSibling;
        if (next) {
          const m = next.textContent.match(/(\d+)/);
          if (m) rooms = parseInt(m[1], 10) || 0;
        }
      }
    });

    const address =
      getText(".classified__information--address") ||
      getText('[class*="address"]') ||
      getText(".classified__information--address-row") ||
      "";

    let imageUrl = "";
    const img =
      document.querySelector(".classified__gallery img") ||
      document.querySelector('[class*="gallery"] img') ||
      document.querySelector("main img");
    if (img) imageUrl = img.src || img.dataset.src || "";

    return {
      title,
      price,
      surface,
      rooms,
      address,
      url: window.location.href,
      imageUrl,
      savedAt: new Date().toISOString(),
    };
  }

  function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // --- Floating button ---
  const fab = document.createElement("button");
  fab.id = "immotracker-fab";
  fab.innerHTML = "&#x1F4BE; Sauvegarder ce bien";
  document.body.appendChild(fab);

  // --- Sidebar ---
  const overlay = document.createElement("div");
  overlay.id = "immotracker-overlay";
  document.body.appendChild(overlay);

  const sidebar = document.createElement("div");
  sidebar.id = "immotracker-sidebar";
  sidebar.innerHTML = buildSidebarHTML();
  document.body.appendChild(sidebar);

  let currentData = null;

  fab.addEventListener("click", openSidebar);
  overlay.addEventListener("click", closeSidebar);

  function openSidebar() {
    currentData = scrapeProperty();
    populateForm(currentData);
    sidebar.classList.add("open");
    overlay.classList.add("open");
    recalculate();
  }

  function closeSidebar() {
    sidebar.classList.remove("open");
    overlay.classList.remove("open");
  }

  function populateForm(data) {
    getEl("it-title").value = data.title;
    getEl("it-price").value = data.price;
    getEl("it-surface").value = data.surface;
    getEl("it-rooms").value = data.rooms;
    getEl("it-address").value = data.address;
    getEl("it-url").value = data.url;
    getEl("it-imageUrl").value = data.imageUrl;
    getEl("it-notes").value = "";
    getEl("it-tags-input").value = "";
    getEl("it-tags-list").innerHTML = "";
    getEl("it-rent").value = "";
    getEl("it-charges").value = "";
    getEl("it-notary").value = "";
    getEl("it-renovation").value = "";
    getEl("it-status").value = "À étudier";
    setScore(0);
    tags = [];
  }

  function getEl(id) {
    return sidebar.querySelector("#" + id);
  }

  // --- Tags ---
  let tags = [];

  function addTag(text) {
    text = text.trim().replace(/^#*/, "");
    if (!text || tags.includes(text)) return;
    tags.push(text);
    renderTags();
  }

  function removeTag(text) {
    tags = tags.filter((t) => t !== text);
    renderTags();
  }

  function renderTags() {
    const list = getEl("it-tags-list");
    list.innerHTML = "";
    tags.forEach((t) => {
      const span = document.createElement("span");
      span.className = "it-tag";
      span.textContent = "#" + t;
      const btn = document.createElement("button");
      btn.textContent = "×";
      btn.addEventListener("click", () => removeTag(t));
      span.appendChild(btn);
      list.appendChild(span);
    });
  }

  // --- Score ---
  let currentScore = 0;

  function setScore(n) {
    currentScore = n;
    const stars = sidebar.querySelectorAll(".it-star");
    stars.forEach((s, i) => {
      s.classList.toggle("active", i < n);
    });
  }

  // --- Calculator ---
  function recalculate() {
    const price = parseFloat(getEl("it-price").value) || 0;
    const rent = parseFloat(getEl("it-rent").value) || 0;
    const charges = parseFloat(getEl("it-charges").value) || 0;
    const notary = parseFloat(getEl("it-notary").value) || 0;
    const renovation = parseFloat(getEl("it-renovation").value) || 0;
    const surface = parseFloat(getEl("it-surface").value) || 0;

    const totalAcquisition = price + notary + renovation;
    const grossYield = price > 0 ? ((rent * 12) / price) * 100 : 0;
    const netYield = totalAcquisition > 0 ? (((rent - charges) * 12) / totalAcquisition) * 100 : 0;

    // Mortgage: 80% of total over 25 years at 3.5%
    const loanAmount = totalAcquisition * 0.8;
    const monthlyRate = 0.035 / 12;
    const n = 25 * 12;
    let monthlyPayment = 0;
    if (loanAmount > 0 && monthlyRate > 0) {
      monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    }
    const cashflow = rent - charges - monthlyPayment;
    const pricePerSqm = surface > 0 ? price / surface : 0;

    getEl("it-total-acquisition").textContent = formatEur(totalAcquisition);
    getEl("it-gross-yield").textContent = grossYield.toFixed(2) + " %";
    getEl("it-net-yield").textContent = netYield.toFixed(2) + " %";
    getEl("it-cashflow").textContent = formatEur(cashflow);
    getEl("it-price-sqm").textContent = surface > 0 ? formatEur(pricePerSqm) : "—";

    const cfEl = getEl("it-cashflow");
    cfEl.className = "it-result-value " + (cashflow >= 0 ? "positive" : "negative");
  }

  function formatEur(v) {
    return v.toLocaleString("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  }

  // --- Save ---
  function saveProperty() {
    const property = {
      id: generateUUID(),
      title: getEl("it-title").value,
      price: parseFloat(getEl("it-price").value) || 0,
      surface: parseFloat(getEl("it-surface").value) || 0,
      rooms: parseInt(getEl("it-rooms").value, 10) || 0,
      address: getEl("it-address").value,
      url: getEl("it-url").value,
      imageUrl: getEl("it-imageUrl").value,
      savedAt: new Date().toISOString(),
      notes: getEl("it-notes").value,
      tags: [...tags],
      status: getEl("it-status").value,
      score: currentScore,
      calculator: {
        monthlyRent: parseFloat(getEl("it-rent").value) || 0,
        monthlyCharges: parseFloat(getEl("it-charges").value) || 0,
        notaryFees: parseFloat(getEl("it-notary").value) || 0,
        renovationCost: parseFloat(getEl("it-renovation").value) || 0,
      },
      computed: {
        totalAcquisitionPrice: 0,
        grossYield: 0,
        netYield: 0,
        monthlyCashflow: 0,
        pricePerSqm: 0,
      },
    };

    // Recompute for storage
    const p = property.price;
    const r = property.calculator.monthlyRent;
    const c = property.calculator.monthlyCharges;
    const nf = property.calculator.notaryFees;
    const rv = property.calculator.renovationCost;
    const total = p + nf + rv;
    property.computed.totalAcquisitionPrice = total;
    property.computed.grossYield = p > 0 ? ((r * 12) / p) * 100 : 0;
    property.computed.netYield = total > 0 ? (((r - c) * 12) / total) * 100 : 0;
    const loanAmount = total * 0.8;
    const mRate = 0.035 / 12;
    const months = 25 * 12;
    let mp = 0;
    if (loanAmount > 0) {
      mp = (loanAmount * mRate * Math.pow(1 + mRate, months)) / (Math.pow(1 + mRate, months) - 1);
    }
    property.computed.monthlyCashflow = r - c - mp;
    property.computed.pricePerSqm = property.surface > 0 ? p / property.surface : 0;

    chrome.storage.local.get({ immotracker_properties: [] }, (result) => {
      const list = result.immotracker_properties;
      list.push(property);
      chrome.storage.local.set({ immotracker_properties: list }, () => {
        showToast("Bien sauvegardé !");
        closeSidebar();
      });
    });
  }

  function showToast(msg) {
    const toast = document.createElement("div");
    toast.className = "it-toast";
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  // --- Sidebar HTML ---
  function buildSidebarHTML() {
    return `
      <div class="it-sidebar-header">
        <h2>ImmoTracker</h2>
        <button id="it-close" class="it-close-btn">×</button>
      </div>
      <div class="it-sidebar-body">
        <section class="it-section">
          <h3>Informations du bien</h3>
          <label>Titre<input type="text" id="it-title"></label>
          <label>Prix (€)<input type="number" id="it-price" min="0"></label>
          <label>Surface (m²)<input type="number" id="it-surface" min="0"></label>
          <label>Chambres<input type="number" id="it-rooms" min="0"></label>
          <label>Adresse<input type="text" id="it-address"></label>
          <label>URL<input type="text" id="it-url"></label>
          <label>Image URL<input type="text" id="it-imageUrl"></label>
        </section>

        <section class="it-section">
          <h3>Notes</h3>
          <textarea id="it-notes" placeholder="Mes impressions..." rows="3"></textarea>
          <div class="it-tags-row">
            <input type="text" id="it-tags-input" placeholder="Ajouter un tag (ex: travaux)">
            <button id="it-add-tag" class="it-btn-sm">+</button>
          </div>
          <div id="it-tags-list" class="it-tags-list"></div>
        </section>

        <section class="it-section">
          <h3>Calculateur de rentabilité</h3>
          <label>Loyer mensuel estimé (€)<input type="number" id="it-rent" min="0"></label>
          <label>Charges mensuelles (€)<input type="number" id="it-charges" min="0"></label>
          <label>Frais de notaire (€)<input type="number" id="it-notary" min="0"></label>
          <label>Travaux (€)<input type="number" id="it-renovation" min="0"></label>
          <div class="it-results">
            <div class="it-result-row"><span>Prix total d'acquisition</span><span id="it-total-acquisition" class="it-result-value">—</span></div>
            <div class="it-result-row"><span>Rendement brut</span><span id="it-gross-yield" class="it-result-value">—</span></div>
            <div class="it-result-row"><span>Rendement net</span><span id="it-net-yield" class="it-result-value">—</span></div>
            <div class="it-result-row"><span>Cash-flow mensuel</span><span id="it-cashflow" class="it-result-value">—</span></div>
            <div class="it-result-row"><span>Prix / m²</span><span id="it-price-sqm" class="it-result-value">—</span></div>
          </div>
        </section>

        <section class="it-section">
          <h3>Statut pipeline</h3>
          <select id="it-status">
            <option>À étudier</option>
            <option>À visiter</option>
            <option>Visite planifiée</option>
            <option>Visité</option>
            <option>Offre faite</option>
            <option>Acquis</option>
            <option>Abandonné</option>
          </select>
        </section>

        <section class="it-section">
          <h3>Score personnel</h3>
          <div class="it-stars">
            <span class="it-star" data-v="1">★</span>
            <span class="it-star" data-v="2">★</span>
            <span class="it-star" data-v="3">★</span>
            <span class="it-star" data-v="4">★</span>
            <span class="it-star" data-v="5">★</span>
          </div>
        </section>

        <button id="it-save" class="it-btn-save">Sauvegarder</button>
      </div>
    `;
  }

  // --- Event delegation inside sidebar ---
  sidebar.addEventListener("click", (e) => {
    if (e.target.id === "it-close") closeSidebar();
    if (e.target.id === "it-save") saveProperty();
    if (e.target.id === "it-add-tag") {
      addTag(getEl("it-tags-input").value);
      getEl("it-tags-input").value = "";
    }
    if (e.target.classList.contains("it-star")) {
      setScore(parseInt(e.target.dataset.v, 10));
    }
  });

  sidebar.addEventListener("keydown", (e) => {
    if (e.target.id === "it-tags-input" && e.key === "Enter") {
      e.preventDefault();
      addTag(e.target.value);
      e.target.value = "";
    }
  });

  // Recalculate on input changes
  ["it-price", "it-surface", "it-rent", "it-charges", "it-notary", "it-renovation"].forEach((id) => {
    sidebar.querySelector("#" + id).addEventListener("input", recalculate);
  });
})();
