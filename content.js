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

  // --- Normalize URL for matching (strip query/hash) ---
  function normalizeUrl(url) {
    try {
      const u = new URL(url);
      return u.origin + u.pathname.replace(/\/+$/, "");
    } catch (e) {
      return url;
    }
  }

  // --- State ---
  let existingProperty = null; // set if this URL was already saved
  let tags = [];
  let currentScore = 0;

  // --- Floating button ---
  const fab = document.createElement("button");
  fab.id = "immotracker-fab";
  document.body.appendChild(fab);

  // --- Sidebar ---
  const overlay = document.createElement("div");
  overlay.id = "immotracker-overlay";
  document.body.appendChild(overlay);

  const sidebar = document.createElement("div");
  sidebar.id = "immotracker-sidebar";
  sidebar.innerHTML = buildSidebarHTML();
  document.body.appendChild(sidebar);

  // Check if property already exists on load
  chrome.storage.local.get({ immotracker_properties: [] }, (result) => {
    const currentUrl = normalizeUrl(window.location.href);
    existingProperty = result.immotracker_properties.find(
      (p) => normalizeUrl(p.url) === currentUrl
    ) || null;
    updateFabLabel();
  });

  function updateFabLabel() {
    if (existingProperty) {
      fab.innerHTML = "&#x270F;&#xFE0F; Modifier mon analyse";
    } else {
      fab.innerHTML = "&#x1F4BE; Sauvegarder ce bien";
    }
  }

  fab.addEventListener("click", openSidebar);
  overlay.addEventListener("click", closeSidebar);

  function openSidebar() {
    if (existingProperty) {
      populateFromExisting(existingProperty);
    } else {
      const scraped = scrapeProperty();
      populateForm(scraped);
    }
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
    // Optimistic
    getEl("it-rent-opti").value = "";
    getEl("it-charges-opti").value = "";
    getEl("it-renovation-opti").value = "";
    // Pessimistic
    getEl("it-rent-pessi").value = "";
    getEl("it-charges-pessi").value = "";
    getEl("it-renovation-pessi").value = "";
    getEl("it-status").value = "À étudier";
    getEl("it-visit-date").value = "";
    setScore(0);
    tags = [];
    getEl("it-save").textContent = "Sauvegarder";
  }

  function populateFromExisting(prop) {
    getEl("it-title").value = prop.title || "";
    getEl("it-price").value = prop.price || 0;
    getEl("it-surface").value = prop.surface || 0;
    getEl("it-rooms").value = prop.rooms || 0;
    getEl("it-address").value = prop.address || "";
    getEl("it-url").value = prop.url || "";
    getEl("it-imageUrl").value = prop.imageUrl || "";
    getEl("it-notes").value = prop.notes || "";
    getEl("it-tags-input").value = "";

    const calc = prop.calculator || {};
    getEl("it-rent").value = calc.monthlyRent || "";
    getEl("it-charges").value = calc.monthlyCharges || "";
    getEl("it-notary").value = calc.notaryFees || "";
    getEl("it-renovation").value = calc.renovationCost || "";

    // Optimistic
    const opti = prop.calculatorOptimistic || {};
    getEl("it-rent-opti").value = opti.monthlyRent || "";
    getEl("it-charges-opti").value = opti.monthlyCharges || "";
    getEl("it-renovation-opti").value = opti.renovationCost || "";

    // Pessimistic
    const pessi = prop.calculatorPessimistic || {};
    getEl("it-rent-pessi").value = pessi.monthlyRent || "";
    getEl("it-charges-pessi").value = pessi.monthlyCharges || "";
    getEl("it-renovation-pessi").value = pessi.renovationCost || "";

    getEl("it-status").value = prop.status || "À étudier";
    getEl("it-visit-date").value = prop.visitDate || "";

    tags = prop.tags ? [...prop.tags] : [];
    renderTags();
    setScore(prop.score || 0);
    getEl("it-save").textContent = "Mettre à jour";
  }

  function getEl(id) {
    return sidebar.querySelector("#" + id);
  }

  // --- Tags ---
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
  function setScore(n) {
    currentScore = n;
    const stars = sidebar.querySelectorAll(".it-star");
    stars.forEach((s, i) => {
      s.classList.toggle("active", i < n);
    });
  }

  // --- Calculator ---
  function computeScenario(price, rent, charges, notary, renovation, surface) {
    const totalAcquisition = price + notary + renovation;
    const grossYield = price > 0 ? ((rent * 12) / price) * 100 : 0;
    const netYield = totalAcquisition > 0 ? (((rent - charges) * 12) / totalAcquisition) * 100 : 0;
    const loanAmount = totalAcquisition * 0.8;
    const monthlyRate = 0.035 / 12;
    const n = 25 * 12;
    let monthlyPayment = 0;
    if (loanAmount > 0 && monthlyRate > 0) {
      monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    }
    const cashflow = rent - charges - monthlyPayment;
    const pricePerSqm = surface > 0 ? price / surface : 0;
    return { totalAcquisition, grossYield, netYield, cashflow, pricePerSqm };
  }

  function recalculate() {
    const price = parseFloat(getEl("it-price").value) || 0;
    const rent = parseFloat(getEl("it-rent").value) || 0;
    const charges = parseFloat(getEl("it-charges").value) || 0;
    const notary = parseFloat(getEl("it-notary").value) || 0;
    const renovation = parseFloat(getEl("it-renovation").value) || 0;
    const surface = parseFloat(getEl("it-surface").value) || 0;

    // Base scenario
    const base = computeScenario(price, rent, charges, notary, renovation, surface);
    getEl("it-total-acquisition").textContent = formatEur(base.totalAcquisition);
    getEl("it-gross-yield").textContent = base.grossYield.toFixed(2) + " %";
    getEl("it-net-yield").textContent = base.netYield.toFixed(2) + " %";
    getEl("it-cashflow").textContent = formatEur(base.cashflow);
    getEl("it-cashflow").className = "it-result-value " + (base.cashflow >= 0 ? "positive" : "negative");
    getEl("it-price-sqm").textContent = surface > 0 ? formatEur(base.pricePerSqm) : "—";

    // Optimistic scenario
    const rentO = parseFloat(getEl("it-rent-opti").value) || 0;
    const chargesO = parseFloat(getEl("it-charges-opti").value) || 0;
    const renovationO = parseFloat(getEl("it-renovation-opti").value) || 0;
    if (rentO || chargesO || renovationO) {
      const opti = computeScenario(price, rentO, chargesO, notary, renovationO, surface);
      getEl("it-gross-yield-opti").textContent = opti.grossYield.toFixed(2) + " %";
      getEl("it-net-yield-opti").textContent = opti.netYield.toFixed(2) + " %";
      getEl("it-cashflow-opti").textContent = formatEur(opti.cashflow);
      getEl("it-cashflow-opti").className = "it-result-value " + (opti.cashflow >= 0 ? "positive" : "negative");
    } else {
      getEl("it-gross-yield-opti").textContent = "—";
      getEl("it-net-yield-opti").textContent = "—";
      getEl("it-cashflow-opti").textContent = "—";
      getEl("it-cashflow-opti").className = "it-result-value";
    }

    // Pessimistic scenario
    const rentP = parseFloat(getEl("it-rent-pessi").value) || 0;
    const chargesP = parseFloat(getEl("it-charges-pessi").value) || 0;
    const renovationP = parseFloat(getEl("it-renovation-pessi").value) || 0;
    if (rentP || chargesP || renovationP) {
      const pessi = computeScenario(price, rentP, chargesP, notary, renovationP, surface);
      getEl("it-gross-yield-pessi").textContent = pessi.grossYield.toFixed(2) + " %";
      getEl("it-net-yield-pessi").textContent = pessi.netYield.toFixed(2) + " %";
      getEl("it-cashflow-pessi").textContent = formatEur(pessi.cashflow);
      getEl("it-cashflow-pessi").className = "it-result-value " + (pessi.cashflow >= 0 ? "positive" : "negative");
    } else {
      getEl("it-gross-yield-pessi").textContent = "—";
      getEl("it-net-yield-pessi").textContent = "—";
      getEl("it-cashflow-pessi").textContent = "—";
      getEl("it-cashflow-pessi").className = "it-result-value";
    }
  }

  function formatEur(v) {
    return v.toLocaleString("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  }

  // --- Save ---
  function saveProperty() {
    const property = {
      id: existingProperty ? existingProperty.id : generateUUID(),
      title: getEl("it-title").value,
      price: parseFloat(getEl("it-price").value) || 0,
      surface: parseFloat(getEl("it-surface").value) || 0,
      rooms: parseInt(getEl("it-rooms").value, 10) || 0,
      address: getEl("it-address").value,
      url: getEl("it-url").value,
      imageUrl: getEl("it-imageUrl").value,
      savedAt: existingProperty ? existingProperty.savedAt : new Date().toISOString(),
      notes: getEl("it-notes").value,
      tags: [...tags],
      status: getEl("it-status").value,
      score: currentScore,
      visitDate: getEl("it-visit-date").value || "",
      calculator: {
        monthlyRent: parseFloat(getEl("it-rent").value) || 0,
        monthlyCharges: parseFloat(getEl("it-charges").value) || 0,
        notaryFees: parseFloat(getEl("it-notary").value) || 0,
        renovationCost: parseFloat(getEl("it-renovation").value) || 0,
      },
      calculatorOptimistic: {
        monthlyRent: parseFloat(getEl("it-rent-opti").value) || 0,
        monthlyCharges: parseFloat(getEl("it-charges-opti").value) || 0,
        renovationCost: parseFloat(getEl("it-renovation-opti").value) || 0,
      },
      calculatorPessimistic: {
        monthlyRent: parseFloat(getEl("it-rent-pessi").value) || 0,
        monthlyCharges: parseFloat(getEl("it-charges-pessi").value) || 0,
        renovationCost: parseFloat(getEl("it-renovation-pessi").value) || 0,
      },
      computed: { totalAcquisitionPrice: 0, grossYield: 0, netYield: 0, monthlyCashflow: 0, pricePerSqm: 0 },
      computedOptimistic: { grossYield: 0, netYield: 0, monthlyCashflow: 0 },
      computedPessimistic: { grossYield: 0, netYield: 0, monthlyCashflow: 0 },
    };

    // Recompute base
    recomputeProperty(property);

    chrome.storage.local.get({ immotracker_properties: [] }, (result) => {
      let list = result.immotracker_properties;
      if (existingProperty) {
        list = list.map((p) => (p.id === existingProperty.id ? property : p));
      } else {
        list.push(property);
      }
      chrome.storage.local.set({ immotracker_properties: list }, () => {
        existingProperty = property;
        updateFabLabel();
        showToast(existingProperty ? "Analyse mise à jour !" : "Bien sauvegardé !");
        closeSidebar();
      });
    });
  }

  function recomputeProperty(prop) {
    const p = prop.price;
    const calc = prop.calculator;
    const total = p + calc.notaryFees + calc.renovationCost;
    prop.computed.totalAcquisitionPrice = total;
    prop.computed.grossYield = p > 0 ? ((calc.monthlyRent * 12) / p) * 100 : 0;
    prop.computed.netYield = total > 0 ? (((calc.monthlyRent - calc.monthlyCharges) * 12) / total) * 100 : 0;
    const loanAmount = total * 0.8;
    const mRate = 0.035 / 12;
    const months = 25 * 12;
    let mp = 0;
    if (loanAmount > 0) {
      mp = (loanAmount * mRate * Math.pow(1 + mRate, months)) / (Math.pow(1 + mRate, months) - 1);
    }
    prop.computed.monthlyCashflow = calc.monthlyRent - calc.monthlyCharges - mp;
    prop.computed.pricePerSqm = prop.surface > 0 ? p / prop.surface : 0;

    // Optimistic
    const o = prop.calculatorOptimistic;
    const totalO = p + calc.notaryFees + (o.renovationCost || calc.renovationCost);
    prop.computedOptimistic.grossYield = p > 0 ? (((o.monthlyRent || 0) * 12) / p) * 100 : 0;
    prop.computedOptimistic.netYield = totalO > 0 ? ((((o.monthlyRent || 0) - (o.monthlyCharges || 0)) * 12) / totalO) * 100 : 0;
    let loanO = totalO * 0.8;
    let mpO = loanO > 0 ? (loanO * mRate * Math.pow(1 + mRate, months)) / (Math.pow(1 + mRate, months) - 1) : 0;
    prop.computedOptimistic.monthlyCashflow = (o.monthlyRent || 0) - (o.monthlyCharges || 0) - mpO;

    // Pessimistic
    const pe = prop.calculatorPessimistic;
    const totalP = p + calc.notaryFees + (pe.renovationCost || calc.renovationCost);
    prop.computedPessimistic.grossYield = p > 0 ? (((pe.monthlyRent || 0) * 12) / p) * 100 : 0;
    prop.computedPessimistic.netYield = totalP > 0 ? ((((pe.monthlyRent || 0) - (pe.monthlyCharges || 0)) * 12) / totalP) * 100 : 0;
    let loanP = totalP * 0.8;
    let mpP = loanP > 0 ? (loanP * mRate * Math.pow(1 + mRate, months)) / (Math.pow(1 + mRate, months) - 1) : 0;
    prop.computedPessimistic.monthlyCashflow = (pe.monthlyRent || 0) - (pe.monthlyCharges || 0) - mpP;
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
          <h3>Analyse de base</h3>
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

        <section class="it-section it-scenario-section">
          <h3>&#x1F31E; Scénario optimiste</h3>
          <label>Loyer (€)<input type="number" id="it-rent-opti" min="0" placeholder="Loyer optimiste"></label>
          <label>Charges (€)<input type="number" id="it-charges-opti" min="0" placeholder="Charges optimistes"></label>
          <label>Travaux (€)<input type="number" id="it-renovation-opti" min="0" placeholder="Travaux optimistes"></label>
          <div class="it-results it-results-opti">
            <div class="it-result-row"><span>Rendement brut</span><span id="it-gross-yield-opti" class="it-result-value">—</span></div>
            <div class="it-result-row"><span>Rendement net</span><span id="it-net-yield-opti" class="it-result-value">—</span></div>
            <div class="it-result-row"><span>Cash-flow mensuel</span><span id="it-cashflow-opti" class="it-result-value">—</span></div>
          </div>
        </section>

        <section class="it-section it-scenario-section">
          <h3>&#x1F327;&#xFE0F; Scénario pessimiste</h3>
          <label>Loyer (€)<input type="number" id="it-rent-pessi" min="0" placeholder="Loyer pessimiste"></label>
          <label>Charges (€)<input type="number" id="it-charges-pessi" min="0" placeholder="Charges pessimistes"></label>
          <label>Travaux (€)<input type="number" id="it-renovation-pessi" min="0" placeholder="Travaux pessimistes"></label>
          <div class="it-results it-results-pessi">
            <div class="it-result-row"><span>Rendement brut</span><span id="it-gross-yield-pessi" class="it-result-value">—</span></div>
            <div class="it-result-row"><span>Rendement net</span><span id="it-net-yield-pessi" class="it-result-value">—</span></div>
            <div class="it-result-row"><span>Cash-flow mensuel</span><span id="it-cashflow-pessi" class="it-result-value">—</span></div>
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
          <label class="it-visit-date-label">Date de visite<input type="datetime-local" id="it-visit-date"></label>
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
  [
    "it-price", "it-surface", "it-rent", "it-charges", "it-notary", "it-renovation",
    "it-rent-opti", "it-charges-opti", "it-renovation-opti",
    "it-rent-pessi", "it-charges-pessi", "it-renovation-pessi",
  ].forEach((id) => {
    sidebar.querySelector("#" + id).addEventListener("input", recalculate);
  });
})();
