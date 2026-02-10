/* =========================
   FinanzasPro AR - Vanilla
   ========================= */

const STORAGE_KEY = "finanzaspro_ar_movements_v1";
const ENABLE_SEED = true; // <- ponelo en false para que no cree ejemplos

// Categorías separadas
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

// Utilidades de fecha
function monthAdd(yyyyMm, offset) {
  const [y, m] = yyyyMm.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  d.setMonth(d.getMonth() + offset);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}

function monthLabel(yyyyMm) {
  const [y, m] = yyyyMm.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  const fmt = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" });
  // "febrero de 2026"
  return fmt.format(d);
}

function moneyARS(n) {
  const val = Number(n || 0);
  return val.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Math.random().toString(16).slice(2) + "-" + Date.now();
}

/* =========================
   State
   ========================= */
let selectedMonth = getCurrentMonth();
let movements = loadMovements();

/* =========================
   DOM refs
   ========================= */
const el = {
  tabDashboard: document.getElementById("tabDashboard"),
  tabMiMes: document.getElementById("tabMiMes"),
  viewDashboard: document.getElementById("viewDashboard"),
  viewMiMes: document.getElementById("viewMiMes"),

  monthPicker: document.getElementById("monthPicker"),
  selectedMonthLabel: document.getElementById("selectedMonthLabel"),

  dashRemaining: document.getElementById("dashRemaining"),
  dashIncome: document.getElementById("dashIncome"),
  dashExpense: document.getElementById("dashExpense"),
  dashPaidInfo: document.getElementById("dashPaidInfo"),

  projectionGrid: document.getElementById("projectionGrid"),

  monthIncomeTotal: document.getElementById("monthIncomeTotal"),
  monthExpenseTotal: document.getElementById("monthExpenseTotal"),
  monthIncomeBody: document.getElementById("monthIncomeBody"),
  monthExpenseBody: document.getElementById("monthExpenseBody"),

  btnOpenModal: document.getElementById("btnOpenModal"),
  fabOpenModal: document.getElementById("fabOpenModal"),
  btnImportPdf: document.getElementById("btnImportPdf"),

  modalOverlay: document.getElementById("modalOverlay"),
  btnCloseModal: document.getElementById("btnCloseModal"),
  tabExpense: document.getElementById("tabExpense"),
  tabIncome: document.getElementById("tabIncome"),

  form: document.getElementById("movementForm"),
  movementDesc: document.getElementById("movementDesc"),
  movementAmount: document.getElementById("movementAmount"),
  amountLabel: document.getElementById("amountLabel"),
  movementMonth: document.getElementById("movementMonth"),
  movementCategory: document.getElementById("movementCategory"),

  installmentsBlock: document.getElementById("installmentsBlock"),
  installmentsInput: document.getElementById("installmentsInput"),
  installmentsMath: document.getElementById("installmentsMath"),
  installmentsHint: document.getElementById("installmentsHint"),
};

/* =========================
   Init
   ========================= */
initSeedIfNeeded();
initProjectionPlaceholders();
initUI();
renderAll();

/* =========================
   UI Init
   ========================= */
function initUI() {
  // Month picker initial
  el.monthPicker.value = selectedMonth;
  el.selectedMonthLabel.textContent = monthLabel(selectedMonth);

  // Tabs view
  el.tabDashboard.addEventListener("click", () => setView("dashboard"));
  el.tabMiMes.addEventListener("click", () => setView("mimes"));

  // Month change
  el.monthPicker.addEventListener("change", (e) => {
    selectedMonth = e.target.value || getCurrentMonth();
    el.selectedMonthLabel.textContent = monthLabel(selectedMonth);
    // sincronizar mes inicio del modal
    el.movementMonth.value = selectedMonth;
    renderAll();
  });

  // Open modal buttons
  el.btnOpenModal.addEventListener("click", openModal);
  el.fabOpenModal.addEventListener("click", openModal);

  // Close modal
  el.btnCloseModal.addEventListener("click", closeModal);
  el.modalOverlay.addEventListener("click", (e) => {
    if (e.target === el.modalOverlay) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !el.modalOverlay.classList.contains("hidden")) closeModal();
  });

  // Modal tabs
  el.tabExpense.addEventListener("click", () => setModalType("expense"));
  el.tabIncome.addEventListener("click", () => setModalType("income"));

  // Category change
  el.movementCategory.addEventListener("change", updateInstallmentsVisibility);

  // Installments math updates
  el.movementAmount.addEventListener("input", updateInstallmentsMath);
  el.installmentsInput.addEventListener("input", () => {
    if (Number(el.installmentsInput.value) < 1) el.installmentsInput.value = 1;
    updateInstallmentsMath();
  });
  el.movementMonth.addEventListener("change", updateInstallmentsMath);

  // Submit form
  el.form.addEventListener("submit", (e) => {
    e.preventDefault();
    saveMovementFromModal();
  });

  // Import PDF (solo UI)
  el.btnImportPdf.addEventListener("click", () => {
    alert("Importar PDF: UI lista. (Aún sin parse real)");
  });

  // Modal defaults
  el.movementMonth.value = selectedMonth;
  setModalType("expense");
}

function initProjectionPlaceholders() {
  el.projectionGrid.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    const div = document.createElement("div");
    div.className = "proj-card";
    el.projectionGrid.appendChild(div);
  }
}

function setView(view) {
  const isDash = view === "dashboard";

  el.tabDashboard.classList.toggle("active", isDash);
  el.tabMiMes.classList.toggle("active", !isDash);

  el.viewDashboard.classList.toggle("hidden", !isDash);
  el.viewMiMes.classList.toggle("hidden", isDash);
}

/* =========================
   Modal logic
   ========================= */
function getModalType() {
  return el.tabIncome.classList.contains("active") ? "income" : "expense";
}

function setModalType(type) {
  const isIncome = type === "income";
  el.tabIncome.classList.toggle("active", isIncome);
  el.tabExpense.classList.toggle("active", !isIncome);

  // Etiqueta Monto (si querés diferenciar)
  el.amountLabel.textContent = isIncome ? "Monto" : "Monto";

  // Poner categorías correctas
  setCategoryOptionsByType(type);

  // Cuotas solo si es gasto + categoria correspondiente
  updateInstallmentsVisibility();

  // Reset cuotas a 1 por seguridad
  el.installmentsInput.value = 1;
  updateInstallmentsMath();
}

function setCategoryOptionsByType(type) {
  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  el.movementCategory.innerHTML = categories
    .map((c) => `<option value="${c}">${c}</option>`)
    .join("");
}

function openModal() {
  // reset form
  el.form.reset();
  el.movementMonth.value = selectedMonth;

  // por defecto gasto
  setModalType("expense");

  el.modalOverlay.classList.remove("hidden");
  setTimeout(() => el.movementDesc.focus(), 50);
}

function closeModal() {
  el.modalOverlay.classList.add("hidden");
}

/* Cuotas */
function updateInstallmentsVisibility() {
  const type = getModalType();
  const category = el.movementCategory.value;

  const isInstallmentCategory =
    category === "Tarjeta de Crédito" || category === "Préstamo Personal";

  const show = type === "expense" && isInstallmentCategory;
  el.installmentsBlock.classList.toggle("hidden", !show);

  updateInstallmentsMath();
}

function updateInstallmentsMath() {
  const show = !el.installmentsBlock.classList.contains("hidden");
  if (!show) return;

  const cuota = Number(el.movementAmount.value || 0);
  const n = Math.max(1, Number(el.installmentsInput.value || 1));
  const total = cuota * n;

  el.installmentsMath.textContent = `x ${moneyARS(cuota)} = Total ${moneyARS(total)}`;
  el.installmentsHint.textContent =
    `El sistema generará automáticamente ${n} registros mensuales comenzando en ${el.movementMonth.value || selectedMonth}.`;
}

/* =========================
   Save / Delete
   ========================= */
function saveMovementFromModal() {
  const type = getModalType();
  const descripcion = (el.movementDesc.value || "").trim();
  const monto = Number(el.movementAmount.value || 0);
  const mesInicio = el.movementMonth.value || selectedMonth;
  const categoria = el.movementCategory.value;

  if (!descripcion) {
    alert("Completá la descripción.");
    return;
  }
  if (!isFinite(monto) || monto <= 0) {
    alert("Ingresá un monto válido.");
    return;
  }
  if (!mesInicio) {
    alert("Seleccioná un mes.");
    return;
  }

  const isInstallmentCategory =
    categoria === "Tarjeta de Crédito" || categoria === "Préstamo Personal";

  // Ingresos nunca generan cuotas
  if (type === "income" || !isInstallmentCategory) {
    const m = {
      id: uid(),
      type,
      descripcion,
      monto,
      mes: mesInicio,
      categoria,
      cuotasInfo: null,
      createdAt: Date.now(),
    };
    movements.push(m);
    persistAndRerender();
    closeModal();
    return;
  }

  // Gastos con cuotas: monto = valor cuota, generar N registros
  const n = Math.max(1, Number(el.installmentsInput.value || 1));
  const baseId = uid();

  for (let i = 0; i < n; i++) {
    movements.push({
      id: uid(),
      type: "expense",
      descripcion: `${descripcion} (Cuota ${i + 1}/${n})`,
      monto,
      mes: monthAdd(mesInicio, i),
      categoria,
      cuotasInfo: {
        baseId,
        cuotaIndex: i + 1,
        cuotasTotal: n,
        valorCuota: monto,
        mesInicio,
      },
      createdAt: Date.now(),
    });
  }

  persistAndRerender();
  closeModal();
}

function deleteMovement(id) {
  movements = movements.filter((m) => m.id !== id);
  persistAndRerender();
}

function persistAndRerender() {
  saveMovements(movements);
  renderAll();
}

/* =========================
   Rendering
   ========================= */
function renderAll() {
  renderDashboard();
  renderMiMes();
}

function renderDashboard() {
  const monthMovs = movements.filter((m) => m.mes === selectedMonth);

  const income = sumByType(monthMovs, "income");
  const expense = sumByType(monthMovs, "expense");
  const remaining = income - expense;

  el.dashIncome.textContent = moneyARS(income);
  el.dashExpense.textContent = moneyARS(expense);
  el.dashRemaining.textContent = moneyARS(remaining);

  // "pagados de" (placeholder simple, no tracking real)
  const totalExpensesCount = monthMovs.filter((m) => m.type === "expense").length;
  el.dashPaidInfo.textContent = `0 pagados de ${totalExpensesCount}`;
}

function renderMiMes() {
  const monthMovs = movements.filter((m) => m.mes === selectedMonth);

  const incomeMovs = monthMovs.filter((m) => m.type === "income");
  const expenseMovs = monthMovs.filter((m) => m.type === "expense");

  const incomeTotal = sum(incomeMovs.map((m) => m.monto));
  const expenseTotal = sum(expenseMovs.map((m) => m.monto));

  el.monthIncomeTotal.textContent = moneyARS(incomeTotal);
  el.monthExpenseTotal.textContent = moneyARS(expenseTotal);

  // Ingresos list
  if (incomeMovs.length === 0) {
    el.monthIncomeBody.innerHTML = `<div class="empty">No hay ingresos registrados.</div>`;
  } else {
    el.monthIncomeBody.innerHTML = incomeMovs
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((m) => renderItem(m, "green"))
      .join("");
    wireDeleteButtons(el.monthIncomeBody);
  }

  // Gastos list (tabla como en captura, pero con items detallados + delete)
  if (expenseMovs.length === 0) {
    el.monthExpenseBody.innerHTML = `<div class="empty">Todo limpio por aquí.</div>`;
  } else {
    // Tabla con filas (detalle/monto) + botón borrar
    const rows = expenseMovs
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((m) => {
        const sub = `${m.categoria} • ${monthShortLabel(m.mes)}`;
        return `
          <tr>
            <td>
              <div style="font-weight:950; font-size:18px;">${escapeHtml(m.descripcion)}</div>
              <div style="color:var(--muted); font-weight:750; margin-top:4px;">${escapeHtml(sub)}</div>
            </td>
            <td class="right">
              <div class="amount red">${moneyARS(m.monto)}</div>
              <button class="trash" data-delete-id="${m.id}" title="Eliminar">🗑️</button>
            </td>
          </tr>
        `;
      })
      .join("");

    el.monthExpenseBody.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>DETALLE</th>
            <th class="right">MONTO</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
    wireDeleteButtons(el.monthExpenseBody);
  }
}

function renderItem(m, color) {
  const badge = (m.descripcion || "•").trim().slice(0, 1).toLowerCase();
  const sub = `${m.categoria} • ${monthShortLabel(m.mes)}`;

  return `
    <div class="item">
      <div class="item-left">
        <div class="item-badge">${escapeHtml(badge)}</div>
        <div class="item-meta">
          <p class="item-title">${escapeHtml(m.descripcion)}</p>
          <p class="item-sub">${escapeHtml(sub)}</p>
        </div>
      </div>
      <div class="item-right">
        <div class="amount ${color}">${moneyARS(m.monto)}</div>
        <button class="trash" data-delete-id="${m.id}" title="Eliminar">🗑️</button>
      </div>
    </div>
  `;
}

function wireDeleteButtons(container) {
  container.querySelectorAll("[data-delete-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-delete-id");
      const ok = confirm("¿Eliminar este movimiento?");
      if (!ok) return;
      deleteMovement(id);
    });
  });
}

/* =========================
   Storage
   ========================= */
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

function initSeedIfNeeded() {
  const existing = loadMovements();
  if (existing.length > 0) {
    movements = existing;
    return;
  }

  if (!ENABLE_SEED) {
    movements = [];
    return;
  }

  // Seed: 1 ingreso + 1 gasto en el mes actual
  const m = getCurrentMonth();
  movements = [
    {
      id: uid(),
      type: "income",
      descripcion: "Sueldo",
      monto: 250000,
      mes: m,
      categoria: "Sueldo",
      cuotasInfo: null,
      createdAt: Date.now() - 1000 * 60 * 60,
    },
    {
      id: uid(),
      type: "expense",
      descripcion: "Supermercado",
      monto: 65000,
      mes: m,
      categoria: "Consumo General",
      cuotasInfo: null,
      createdAt: Date.now() - 1000 * 60 * 30,
    },
  ];
  saveMovements(movements);
}

/* =========================
   Helpers
   ========================= */
function sum(nums) {
  return nums.reduce((acc, n) => acc + Number(n || 0), 0);
}

function sumByType(list, type) {
  return sum(list.filter((m) => m.type === type).map((m) => m.monto));
}

function getCurrentMonth() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthShortLabel(yyyyMm) {
  const [y, m] = yyyyMm.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  const fmt = new Intl.DateTimeFormat("es-AR", { month: "short", year: "numeric" });
  // "feb 2026"
  return fmt.format(d).replace(".", "");
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
