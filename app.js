/***********************
 * FinanzasPro AR - Vanilla JS
 ***********************/

const STORAGE_KEY = "finanzaspro_ar_movements_v1";
const STORAGE_MONTH_KEY = "finanzaspro_ar_selected_month_v1";

// Seed opcional
const ENABLE_SEED = true; // <- ponelo en false si no querés ejemplos

const EXPENSE_CATEGORIES = [
  "Consumo General",
  "Gasto Fijo (Alquiler/Servicios)",
  "Tarjeta de Crédito",
  "Préstamo Personal",
];

const INCOME_CATEGORIES = [
  "Sueldo",
  "Cliente",
  "Extra",
];

// DOM
const tabDashboard = document.getElementById("tabDashboard");
const tabMonth = document.getElementById("tabMonth");
const viewDashboard = document.getElementById("viewDashboard");
const viewMonth = document.getElementById("viewMonth");

const monthInput = document.getElementById("monthInput");
const heroMonthLabel = document.getElementById("heroMonthLabel");

const remainValue = document.getElementById("remainValue");
const incomeValue = document.getElementById("incomeValue");
const expenseValue = document.getElementById("expenseValue");
const paidMeta = document.getElementById("paidMeta");

const projectionGrid = document.getElementById("projectionGrid");

const monthIncomeTotal = document.getElementById("monthIncomeTotal");
const monthExpenseTotal = document.getElementById("monthExpenseTotal");
const monthIncomeBody = document.getElementById("monthIncomeBody");
const monthExpenseBody = document.getElementById("monthExpenseBody");

const btnOpenModal = document.getElementById("btnOpenModal");
const fabOpenModal = document.getElementById("fabOpenModal");
const btnCloseModal = document.getElementById("btnCloseModal");
const modalOverlay = document.getElementById("modalOverlay");

const modalTabExpense = document.getElementById("modalTabExpense");
const modalTabIncome = document.getElementById("modalTabIncome");

const movementForm = document.getElementById("movementForm");
const descInput = document.getElementById("descInput");
const amountInput = document.getElementById("amountInput");
const amountLabel = document.getElementById("amountLabel");
const startMonthInput = document.getElementById("startMonthInput");
const categorySelect = document.getElementById("categorySelect");

const installmentsBox = document.getElementById("installmentsBox");
const installmentsInput = document.getElementById("installmentsInput");
const installmentsMath = document.getElementById("installmentsMath");
const installmentsHint = document.getElementById("installmentsHint");

// State
let currentView = "dashboard";
let currentType = "gasto"; // gasto | ingreso

/***********************
 * Helpers
 ***********************/
function formatARS(value) {
  const n = Number(value || 0);
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

function todayMonthKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthLabelEs(monthKey) {
  const [y, m] = monthKey.split("-").map(Number);
  const meses = [
    "enero","febrero","marzo","abril","mayo","junio",
    "julio","agosto","septiembre","octubre","noviembre","diciembre"
  ];
  return `${meses[m - 1]} de ${y}`;
}

function addMonthsToMonthKey(monthKey, add) {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  d.setMonth(d.getMonth() + add);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Math.random().toString(16).slice(2) + "-" + Date.now();
}

function loadMovements() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveMovements(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function getSelectedMonthKey() {
  const stored = localStorage.getItem(STORAGE_MONTH_KEY);
  return monthInput.value || stored || todayMonthKey();
}

function setSelectedMonthKey(monthKey) {
  monthInput.value = monthKey;
  localStorage.setItem(STORAGE_MONTH_KEY, monthKey);
}

function sumByMonth(movements, monthKey, type) {
  return movements
    .filter(m => m.mesInicio === monthKey && m.tipo === type)
    .reduce((acc, m) => acc + Number(m.monto || 0), 0);
}

function hasSalaryInMonth(movements, monthKey) {
  return movements.some(m =>
    m.tipo === "ingreso" &&
    (m.categoria || "").toLowerCase() === "sueldo" &&
    m.mesInicio === monthKey
  );
}

function findLastKnownSalary(movements, upToMonthKey) {
  const salaries = movements
    .filter(m => m.tipo === "ingreso" && (m.categoria || "").toLowerCase() === "sueldo")
    .slice();

  if (!salaries.length) return 0;

  salaries.sort((a, b) => (a.mesInicio > b.mesInicio ? 1 : a.mesInicio < b.mesInicio ? -1 : 0));

  let last = 0;
  for (const s of salaries) {
    if (s.mesInicio <= upToMonthKey) last = Number(s.monto || 0);
  }
  return last;
}

/***********************
 * Seed (opcional)
 ***********************/
function ensureSeed() {
  const existing = loadMovements();
  if (existing.length > 0) return;

  if (!ENABLE_SEED) return;

  const mk = getSelectedMonthKey();

  const seed = [
    {
      id: uid(),
      tipo: "ingreso",
      descripcion: "Sueldo",
      monto: 250000,
      mesInicio: mk,
      categoria: "Sueldo",
      cuotas: null,
      seriesId: null,
      createdAt: Date.now(),
    },
    {
      id: uid(),
      tipo: "gasto",
      descripcion: "Supermercado",
      monto: 65000,
      mesInicio: mk,
      categoria: "Consumo General",
      cuotas: null,
      seriesId: null,
      createdAt: Date.now(),
    },
  ];

  saveMovements(seed);
}

/***********************
 * UI - Tabs / Views
 ***********************/
function setView(view) {
  currentView = view;

  if (view === "dashboard") {
    tabDashboard.classList.add("active");
    tabMonth.classList.remove("active");
    viewDashboard.classList.remove("hidden");
    viewMonth.classList.add("hidden");
  } else {
    tabMonth.classList.add("active");
    tabDashboard.classList.remove("active");
    viewMonth.classList.remove("hidden");
    viewDashboard.classList.add("hidden");
  }
}

/***********************
 * Modal
 ***********************/
function openModal() {
  modalOverlay.classList.remove("hidden");
  modalOverlay.setAttribute("aria-hidden", "false");

  // Sync month
  startMonthInput.value = getSelectedMonthKey();

  // Default: gasto
  setModalType(currentType);

  // Reset basic fields
  descInput.value = "";
  amountInput.value = "";
  installmentsInput.value = 1;

  // focus
  setTimeout(() => descInput.focus(), 50);
}

function closeModal() {
  modalOverlay.classList.add("hidden");
  modalOverlay.setAttribute("aria-hidden", "true");
}

function setModalType(type) {
  currentType = type;

  if (type === "gasto") {
    modalTabExpense.classList.add("active");
    modalTabIncome.classList.remove("active");
    amountLabel.textContent = "Monto";
  } else {
    modalTabIncome.classList.add("active");
    modalTabExpense.classList.remove("active");
    amountLabel.textContent = "Monto";
  }

  // categories
  renderCategoryOptions();
  onCategoryChange(); // show/hide cuotas if needed
  updateInstallmentsMath();
}

function renderCategoryOptions() {
  const list = (currentType === "ingreso") ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  categorySelect.innerHTML = "";

  for (const c of list) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    categorySelect.appendChild(opt);
  }
}

function categoryUsesInstallments(category) {
  return category === "Tarjeta de Crédito" || category === "Préstamo Personal";
}

function onCategoryChange() {
  const cat = categorySelect.value;
  const show = (currentType === "gasto") && categoryUsesInstallments(cat);

  installmentsBox.classList.toggle("hidden", !show);

  // texto del hint
  const mk = startMonthInput.value || getSelectedMonthKey();
  const n = Number(installmentsInput.value || 1);
  installmentsHint.textContent =
    `El sistema generará automáticamente ${n} registros mensuales comenzando en ${mk}.`;

  updateInstallmentsMath();
}

function updateInstallmentsMath() {
  const val = Number(amountInput.value || 0);
  const n = Number(installmentsInput.value || 1);
  const total = val * n;

  installmentsMath.textContent = `x ${formatARS(val)} = Total ${formatARS(total)}`;

  const mk = startMonthInput.value || getSelectedMonthKey();
  installmentsHint.textContent =
    `El sistema generará automáticamente ${n} registros mensuales comenzando en ${mk}.`;
}

/***********************
 * Save movement
 ***********************/
function createMovementBase() {
  return {
    tipo: currentType,
    descripcion: descInput.value.trim(),
    monto: Number(amountInput.value || 0),
    mesInicio: startMonthInput.value,
    categoria: categorySelect.value,
    cuotas: null,
    seriesId: null,
    createdAt: Date.now(),
  };
}

function saveMovement(e) {
  e.preventDefault();

  const base = createMovementBase();

  if (!base.descripcion) return;

  const list = loadMovements();

  // Ingreso normal
  if (base.tipo === "ingreso") {
    list.push({ ...base, id: uid() });
    saveMovements(list);
    closeModal();
    renderAll();
    return;
  }

  // Gasto
  const uses = categoryUsesInstallments(base.categoria);

  if (!uses) {
    list.push({ ...base, id: uid() });
    saveMovements(list);
    closeModal();
    renderAll();
    return;
  }

  // Gasto con cuotas (monto = valor de la cuota)
  const n = Math.max(1, Number(installmentsInput.value || 1));
  const seriesId = uid();
  const start = base.mesInicio;

  for (let i = 0; i < n; i++) {
    const mk = addMonthsToMonthKey(start, i);
    list.push({
      ...base,
      id: uid(),
      mesInicio: mk,
      cuotas: n,
      seriesId,
    });
  }

  saveMovements(list);
  closeModal();
  renderAll();
}

/***********************
 * Delete movement
 ***********************/
function deleteMovement(id, seriesId) {
  const list = loadMovements();

  let next;
  if (seriesId) {
    const ok = confirm("Este movimiento pertenece a una serie de cuotas.\n¿Querés borrar TODA la serie?");
    if (ok) {
      next = list.filter(m => m.seriesId !== seriesId);
    } else {
      next = list.filter(m => m.id !== id);
    }
  } else {
    const ok = confirm("¿Eliminar este movimiento?");
    if (!ok) return;
    next = list.filter(m => m.id !== id);
  }

  saveMovements(next);
  renderAll();
}

/***********************
 * Render: Dashboard + Mi Mes + Proyección
 ***********************/
function renderHeader() {
  const mk = getSelectedMonthKey();
  heroMonthLabel.textContent = monthLabelEs(mk);
}

function renderDashboard() {
  const mk = getSelectedMonthKey();
  const movements = loadMovements();

  const incomes = sumByMonth(movements, mk, "ingreso");
  const expenses = sumByMonth(movements, mk, "gasto");
  const remain = incomes - expenses;

  incomeValue.textContent = formatARS(incomes);
  expenseValue.textContent = formatARS(expenses);
  remainValue.textContent = formatARS(remain);

  // Pagados de X (usamos cantidad de gastos como proxy)
  const expCount = movements.filter(m => m.mesInicio === mk && m.tipo === "gasto").length;
  paidMeta.textContent = `0 pagados de ${expCount}`;

  renderProjection6Months();
}

function renderMonthView() {
  const mk = getSelectedMonthKey();
  const movements = loadMovements();

  const incomeItems = movements
    .filter(m => m.mesInicio === mk && m.tipo === "ingreso")
    .sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));

  const expenseItems = movements
    .filter(m => m.mesInicio === mk && m.tipo === "gasto")
    .sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));

  const incTotal = incomeItems.reduce((acc, m) => acc + Number(m.monto || 0), 0);
  const expTotal = expenseItems.reduce((acc, m) => acc + Number(m.monto || 0), 0);

  monthIncomeTotal.textContent = formatARS(incTotal);
  monthExpenseTotal.textContent = formatARS(expTotal);

  // Ingresos panel
  monthIncomeBody.innerHTML = "";
  if (incomeItems.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No hay ingresos registrados.";
    empty.style.color = "var(--muted)";
    empty.style.fontWeight = "800";
    empty.style.padding = "4px 0 8px";
    monthIncomeBody.appendChild(empty);
  } else {
    for (const it of incomeItems) {
      const el = document.createElement("div");
      el.className = "item";
      el.innerHTML = `
        <div class="item-left">
          <div class="item-title">${escapeHtml(it.descripcion)}</div>
          <div class="item-meta">${escapeHtml(it.categoria)} · ${shortMonthLabel(mk)}</div>
        </div>
        <div class="item-right">
          <div class="item-amount green">${formatARS(it.monto)}</div>
          <button class="trash-btn" type="button" title="Eliminar">🗑️</button>
        </div>
      `;
      el.querySelector(".trash-btn").addEventListener("click", () => deleteMovement(it.id, it.seriesId));
      monthIncomeBody.appendChild(el);
    }
  }

  // Gastos table
  monthExpenseBody.innerHTML = "";
  if (expenseItems.length === 0) {
    const row = document.createElement("div");
    row.className = "table-row";
    row.innerHTML = `
      <div class="cell-detail">
        <div class="cell-meta">Todo limpio por aquí.</div>
      </div>
      <div class="right cell-meta"> </div>
    `;
    monthExpenseBody.appendChild(row);
  } else {
    for (const it of expenseItems) {
      const row = document.createElement("div");
      row.className = "table-row";
      row.innerHTML = `
        <div class="cell-detail">
          <div class="cell-title">${escapeHtml(it.descripcion)}</div>
          <div class="cell-meta">${escapeHtml(it.categoria)} · ${shortMonthLabel(mk)}</div>
        </div>
        <div class="right" style="display:flex; gap:10px; align-items:center; justify-content:flex-end;">
          <div class="cell-amount">${formatARS(it.monto)}</div>
          <button class="trash-btn" type="button" title="Eliminar">🗑️</button>
        </div>
      `;
      row.querySelector(".trash-btn").addEventListener("click", () => deleteMovement(it.id, it.seriesId));
      monthExpenseBody.appendChild(row);
    }
  }
}

function renderProjection6Months() {
  const mk = getSelectedMonthKey();
  const movements = loadMovements();

  const cards = Array.from(projectionGrid.querySelectorAll(".proj-card"));
  if (cards.length < 6) return;

  for (let i = 0; i < 6; i++) {
    const mki = addMonthsToMonthKey(mk, i);

    const ingresosReales = sumByMonth(movements, mki, "ingreso");

    // sueldo proyectado si ese mes no tiene sueldo cargado
    const sueldoExtra = hasSalaryInMonth(movements, mki) ? 0 : findLastKnownSalary(movements, mki);
    const ingresosProyectados = ingresosReales + sueldoExtra;

    const gastos = sumByMonth(movements, mki, "gasto");

    const neto = ingresosProyectados - gastos;
    const netClass = neto >= 0 ? "positive" : "negative";

    cards[i].innerHTML = `
      <div class="proj-month">${monthLabelEs(mki)}</div>

      <div class="proj-lines">
        <div class="proj-row">
          <span>Ingresos</span>
          <strong>${formatARS(ingresosProyectados)}</strong>
        </div>
        <div class="proj-row">
          <span>Gastos</span>
          <strong>${formatARS(gastos)}</strong>
        </div>
      </div>

      <div class="proj-net ${netClass}">
        <span>Te queda</span>
        <span>${formatARS(neto)}</span>
      </div>
    `;
  }
}

function renderAll() {
  renderHeader();
  renderDashboard();
  renderMonthView();
}

/***********************
 * Small helpers UI
 ***********************/
function shortMonthLabel(monthKey) {
  // "Feb 2026"
  const [y, m] = monthKey.split("-").map(Number);
  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${meses[m - 1]} ${y}`;
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/***********************
 * Events
 ***********************/
tabDashboard.addEventListener("click", () => setView("dashboard"));
tabMonth.addEventListener("click", () => setView("month"));

btnOpenModal.addEventListener("click", openModal);
fabOpenModal.addEventListener("click", openModal);

btnCloseModal.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modalOverlay.classList.contains("hidden")) closeModal();
});

modalTabExpense.addEventListener("click", () => setModalType("gasto"));
modalTabIncome.addEventListener("click", () => setModalType("ingreso"));

categorySelect.addEventListener("change", onCategoryChange);
amountInput.addEventListener("input", updateInstallmentsMath);
installmentsInput.addEventListener("input", updateInstallmentsMath);
startMonthInput.addEventListener("change", updateInstallmentsMath);

movementForm.addEventListener("submit", saveMovement);

monthInput.addEventListener("change", () => {
  setSelectedMonthKey(monthInput.value);
  renderAll();
});

document.getElementById("btnImportPdf").addEventListener("click", () => {
  alert("Importar PDF: UI por ahora (sin parse real).");
});

/***********************
 * Init
 ***********************/
(function init() {
  const savedMonth = localStorage.getItem(STORAGE_MONTH_KEY) || todayMonthKey();
  setSelectedMonthKey(savedMonth);

  ensureSeed();

  // inicializar categorías del modal
  renderCategoryOptions();
  onCategoryChange();

  renderAll();
})();
