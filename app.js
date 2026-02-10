/* FinanzasPro AR - Vanilla JS
   - Guarda en localStorage
   - Cuotas generan N registros mensuales
   - UI: Dashboard + Mi Mes + Modal
   - Incluye eliminar movimientos desde "Mi Mes"
*/

const STORAGE_KEY = "finanzaspro_ar_movements_v1";
const ENABLE_SEED = true; // <- ponelo en false si no querés movimientos de ejemplo

// ---------- Helpers ----------
function $(sel) { return document.querySelector(sel); }
function moneyARS(n) {
  const val = Number(n || 0);
  return val.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });
}
function monthToLabel(yyyyMm) {
  if (!yyyyMm) return "—";
  const [y, m] = yyyyMm.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}
function addMonths(yyyyMm, add) {
  const [y, m] = yyyyMm.split("-").map(Number);
  const d = new Date(y, (m - 1) + add, 1);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}
function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Math.random().toString(16).slice(2) + "-" + Date.now();
}

// ---------- State ----------
let selectedMonth = "";
let modalType = "gasto"; // 'gasto' | 'ingreso'

// ---------- Storage ----------
function loadMovements() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function saveMovements(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

// Seed inicial (opcional)
function ensureSeedIfEmpty() {
  const current = loadMovements();
  if (current.length > 0) return;

  if (!ENABLE_SEED) return;

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const baseMonth = `${yyyy}-${mm}`;

  const seed = [
    {
      id: uid(),
      type: "ingreso",
      descripcion: "Sueldo",
      monto: 250000,
      mes: baseMonth,
      categoria: "Consumo General",
      cuotas: 1,
      createdAt: Date.now()
    },
    {
      id: uid(),
      type: "gasto",
      descripcion: "Supermercado",
      monto: 65000,
      mes: baseMonth,
      categoria: "Consumo General",
      cuotas: 1,
      createdAt: Date.now()
    }
  ];
  saveMovements(seed);
}

// ---------- UI refs ----------
const tabDashboard = $("#tabDashboard");
const tabMiMes = $("#tabMiMes");
const viewDashboard = $("#viewDashboard");
const viewMiMes = $("#viewMiMes");

const monthInput = $("#monthInput");
const heroMonthLabel = $("#heroMonthLabel");

const cardRemainder = $("#cardRemainder");
const cardIncome = $("#cardIncome");
const cardExpense = $("#cardExpense");
const paidCount = $("#paidCount");
const totalCount = $("#totalCount");

const projectionGrid = $("#projectionGrid");

const monthIncomeTotal = $("#monthIncomeTotal");
const monthExpenseTotal = $("#monthExpenseTotal");
const incomeEmpty = $("#incomeEmpty");
const expenseEmpty = $("#expenseEmpty");
const incomeList = $("#incomeList");
const expenseRows = $("#expenseRows");

const btnOpenModal = $("#btnOpenModal");
const fabOpenModal = $("#fabOpenModal");
const modalOverlay = $("#modalOverlay");
const btnCloseModal = $("#btnCloseModal");
const modalTabGasto = $("#modalTabGasto");
const modalTabIngreso = $("#modalTabIngreso");

const movementForm = $("#movementForm");
const descInput = $("#descInput");
const amountInput = $("#amountInput");
const amountLabel = $("#amountLabel");
const startMonthInput = $("#startMonthInput");
const categorySelect = $("#categorySelect");

const installmentsBox = $("#installmentsBox");
const installmentsInput = $("#installmentsInput");
const installmentsMath = $("#installmentsMath");
const installmentsHint = $("#installmentsHint");

// ---------- Tabs ----------
function setView(which) {
  const dash = which === "dashboard";
  tabDashboard.classList.toggle("is-active", dash);
  tabMiMes.classList.toggle("is-active", !dash);
  tabDashboard.setAttribute("aria-selected", dash ? "true" : "false");
  tabMiMes.setAttribute("aria-selected", dash ? "false" : "true");
  viewDashboard.classList.toggle("is-active", dash);
  viewMiMes.classList.toggle("is-active", !dash);
}

tabDashboard.addEventListener("click", () => setView("dashboard"));
tabMiMes.addEventListener("click", () => setView("mimes"));

// ---------- Modal ----------
function openModal() {
  modalOverlay.classList.add("is-open");
  modalOverlay.setAttribute("aria-hidden", "false");
  // reset form
  descInput.value = "";
  amountInput.value = "";
  categorySelect.value = "Consumo General";
  installmentsInput.value = 1;
  startMonthInput.value = selectedMonth || monthInput.value;
  setModalType(modalType);
  updateInstallmentsUI();
  setTimeout(() => descInput.focus(), 50);
}
function closeModal() {
  modalOverlay.classList.remove("is-open");
  modalOverlay.setAttribute("aria-hidden", "true");
}

btnOpenModal.addEventListener("click", openModal);
fabOpenModal.addEventListener("click", openModal);
btnCloseModal.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalOverlay.classList.contains("is-open")) closeModal();
});

function setModalType(type) {
  modalType = type;
  const isGasto = type === "gasto";
  modalTabGasto.classList.toggle("is-active", isGasto);
  modalTabIngreso.classList.toggle("is-active", !isGasto);
  modalTabGasto.setAttribute("aria-selected", isGasto ? "true" : "false");
  modalTabIngreso.setAttribute("aria-selected", isGasto ? "false" : "true");

  amountLabel.textContent = isGasto ? "Monto" : "Monto";
}

modalTabGasto.addEventListener("click", () => setModalType("gasto"));
modalTabIngreso.addEventListener("click", () => setModalType("ingreso"));

// ---------- Installments behavior ----------
function categoryHasInstallments(cat) {
  return cat === "Tarjeta de Crédito" || cat === "Préstamo Personal";
}
function updateInstallmentsUI() {
  const cat = categorySelect.value;
  const show = categoryHasInstallments(cat);

  installmentsBox.classList.toggle("is-hidden", !show);

  const cuota = Number(amountInput.value || 0);
  const n = Math.max(1, Number(installmentsInput.value || 1));
  const total = cuota * n;
  installmentsMath.textContent = `x ${moneyARS(cuota)} = Total ${moneyARS(total)}`;
  installmentsHint.textContent = `El sistema generará automáticamente ${n} registros mensuales comenzando en ${startMonthInput.value || selectedMonth || "—"}.`;
}

categorySelect.addEventListener("change", () => {
  if (!categoryHasInstallments(categorySelect.value)) {
    installmentsInput.value = 1;
  }
  updateInstallmentsUI();
});
amountInput.addEventListener("input", updateInstallmentsUI);
installmentsInput.addEventListener("input", updateInstallmentsUI);
startMonthInput.addEventListener("change", updateInstallmentsUI);

// ---------- Create movement ----------
movementForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const descripcion = (descInput.value || "").trim();
  const monto = Number(amountInput.value || 0);
  const mesInicio = startMonthInput.value;
  const categoria = categorySelect.value;

  if (!descripcion) return;
  if (!mesInicio) return;
  if (!(monto >= 0)) return;

  const type = modalType === "ingreso" ? "ingreso" : "gasto";
  const hasInst = categoryHasInstallments(categoria);
  const cuotas = hasInst ? Math.max(1, Number(installmentsInput.value || 1)) : 1;

  const data = loadMovements();
  const baseCreatedAt = Date.now();

  // Cuotas: el monto es valor de la cuota. Genera N registros (1 por mes).
  const records = [];
  for (let i = 0; i < cuotas; i++) {
    records.push({
      id: uid(),
      type,
      descripcion,
      monto,
      mes: addMonths(mesInicio, i),
      categoria,
      cuotas,
      createdAt: baseCreatedAt
    });
  }

  saveMovements([...data, ...records]);
  closeModal();
  renderAll();
});

// ---------- Delete movement ----------
function deleteMovementById(id) {
  const data = loadMovements();
  const target = data.find(m => m.id === id);
  if (!target) return;

  const ok = confirm(`¿Eliminar "${target.descripcion}" (${moneyARS(target.monto)}) del mes ${monthToLabel(target.mes)}?`);
  if (!ok) return;

  const next = data.filter(m => m.id !== id);
  saveMovements(next);
  renderAll();
}

// Delegación de eventos (botones borrar)
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-del-id]");
  if (!btn) return;
  const id = btn.getAttribute("data-del-id");
  deleteMovementById(id);
});

// ---------- Month handling ----------
function initMonth() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  selectedMonth = `${yyyy}-${mm}`;
  monthInput.value = selectedMonth;
  startMonthInput.value = selectedMonth;
  heroMonthLabel.textContent = monthToLabel(selectedMonth);
}

monthInput.addEventListener("change", () => {
  selectedMonth = monthInput.value;
  heroMonthLabel.textContent = monthToLabel(selectedMonth);
  // si modal está abierto, sincroniza mes inicio
  if (modalOverlay.classList.contains("is-open")) {
    startMonthInput.value = selectedMonth;
    updateInstallmentsUI();
  }
  renderAll();
});

// ---------- Render ----------
function sumByTypeForMonth(arr, month, type) {
  return arr
    .filter(m => m.mes === month && m.type === type)
    .reduce((acc, m) => acc + Number(m.monto || 0), 0);
}

function renderProjection() {
  projectionGrid.innerHTML = "";
  // 6 meses desde el seleccionado
  for (let i = 0; i < 6; i++) {
    const m = addMonths(selectedMonth, i);
    const income = sumByTypeForMonth(loadMovements(), m, "ingreso");
    const expense = sumByTypeForMonth(loadMovements(), m, "gasto");
    const rem = income - expense;

    const col = document.createElement("div");
    col.className = "proj-col";
    col.innerHTML = `
      <div class="proj-month">${monthToLabel(m)}</div>
      <div class="proj-amt">${moneyARS(rem)}</div>
      <div class="proj-sub">Ingresos: ${moneyARS(income)}<br/>Gastos: ${moneyARS(expense)}</div>
    `;
    projectionGrid.appendChild(col);
  }
}

function renderDashboard() {
  const data = loadMovements();
  const income = sumByTypeForMonth(data, selectedMonth, "ingreso");
  const expense = sumByTypeForMonth(data, selectedMonth, "gasto");
  const remainder = income - expense;

  cardIncome.textContent = moneyARS(income);
  cardExpense.textContent = moneyARS(expense);
  cardRemainder.textContent = moneyARS(remainder);

  // "pagados de" (en este MVP asumimos todos los gastos como pagados)
  const monthExpenses = data.filter(m => m.mes === selectedMonth && m.type === "gasto");
  paidCount.textContent = String(monthExpenses.length);
  totalCount.textContent = String(monthExpenses.length);

  renderProjection();
}

function renderMiMes() {
  const data = loadMovements();
  const incomes = data
    .filter(m => m.mes === selectedMonth && m.type === "ingreso")
    .sort((a,b) => (a.createdAt||0) - (b.createdAt||0));
  const expenses = data
    .filter(m => m.mes === selectedMonth && m.type === "gasto")
    .sort((a,b) => (a.createdAt||0) - (b.createdAt||0));

  const incomeTotal = incomes.reduce((acc, m) => acc + Number(m.monto||0), 0);
  const expenseTotal = expenses.reduce((acc, m) => acc + Number(m.monto||0), 0);

  monthIncomeTotal.textContent = moneyARS(incomeTotal);
  monthExpenseTotal.textContent = moneyARS(expenseTotal);

  // Ingresos list
  incomeList.innerHTML = "";
  incomeEmpty.classList.toggle("hidden", incomes.length > 0);
  if (incomes.length) {
    incomes.forEach(m => {
      const li = document.createElement("li");
      li.className = "list-item";
      li.innerHTML = `
        <div>
          <div class="li-title">${escapeHtml(m.descripcion)}</div>
          <div class="li-sub">${escapeHtml(m.categoria)} · ${monthToLabel(m.mes)}</div>
        </div>
        <div class="li-right">
          <div class="li-amt" style="color:var(--green)">${moneyARS(m.monto)}</div>
          <button class="del-btn" type="button" title="Eliminar" data-del-id="${m.id}">🗑</button>
        </div>
      `;
      incomeList.appendChild(li);
    });
  }

  // Gastos rows
  expenseRows.innerHTML = "";
  expenseEmpty.classList.toggle("hidden", expenses.length > 0);
  $("#expenseTable").classList.toggle("hidden", expenses.length === 0);

  if (expenses.length) {
    expenses.forEach(m => {
      const row = document.createElement("div");
      row.className = "tr";
      row.innerHTML = `
        <div class="td-left">
          <div style="font-size:20px;font-weight:950">${escapeHtml(m.descripcion)}</div>
          <div class="td-sub">${escapeHtml(m.categoria)} · ${monthToLabel(m.mes)}</div>
        </div>
        <div class="td-right-wrap">
          <div class="td-right">${moneyARS(m.monto)}</div>
          <button class="del-btn" type="button" title="Eliminar" data-del-id="${m.id}">🗑</button>
        </div>
      `;
      expenseRows.appendChild(row);
    });
  }
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderAll() {
  heroMonthLabel.textContent = monthToLabel(selectedMonth);
  renderDashboard();
  renderMiMes();
}

// ---------- Init ----------
(function init() {
  ensureSeedIfEmpty();
  initMonth();
  renderAll();

  // "Importar PDF" UI only
  $("#btnImportPdf").addEventListener("click", () => {
    alert("Importar PDF (UI): próximamente. Por ahora cargá los movimientos manualmente.");
  });
})();
