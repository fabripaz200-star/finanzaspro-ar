/* app.js
   FinanzasPro AR - Vanilla JS (v2)
   + Editar movimientos (ingresos/gastos)
   + Gastos agrupados por categoría con total por categoría
   + Proyección 6 meses: NO repite ingresos (solo si están cargados en ese mes)
*/

const STORAGE_KEY = "finanzaspro_ar_v1";

/** Seed opcional */
const ENABLE_SEED = true;

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

const INSTALLMENT_CATEGORIES = new Set(["Tarjeta de Crédito", "Préstamo Personal"]);

let state = {
  view: "dashboard",
  selectedMonth: "",
  moveType: "expense",
  movements: [],
};

let editMode = false;
let editId = null;

const $ = (id) => document.getElementById(id);

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Math.random().toString(16).slice(2) + "-" + Date.now();
}

function parseMoney(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatARS(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

function monthToLabel(ym) {
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return "—";
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

function addMonths(ym, add) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + add, 1);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}

function normalizeSelectedMonth() {
  if (state.selectedMonth) return;
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  state.selectedMonth = `${y}-${m}`;
}

/** STORAGE */
function loadMovements() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.movements)) return parsed.movements;
    return [];
  } catch {
    return [];
  }
}

function saveMovements(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function ensureSeed() {
  if (!ENABLE_SEED) return;
  const current = loadMovements();
  if (current.length > 0) return;

  const nowMonth = state.selectedMonth || (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  })();

  const seed = [
    {
      id: uid(),
      type: "income",
      descripcion: "Sueldo",
      monto: 250000,
      mes: nowMonth,
      categoria: "Sueldo",
      planId: null,
      installmentIndex: null,
      installmentsTotal: null,
      createdAt: Date.now(),
    },
    {
      id: uid(),
      type: "expense",
      descripcion: "Supermercado",
      monto: 65000,
      mes: nowMonth,
      categoria: "Consumo General",
      planId: null,
      installmentIndex: null,
      installmentsTotal: null,
      createdAt: Date.now(),
    },
  ];

  saveMovements(seed);
}

/** HELPERS */
function getMonthMovements(ym) {
  return state.movements.filter(m => m.mes === ym);
}

function sumByType(list, type) {
  return list
    .filter(m => m.type === type)
    .reduce((acc, m) => acc + (Number(m.monto) || 0), 0);
}

function buildMonthTotals(ym) {
  const list = getMonthMovements(ym);
  const income = sumByType(list, "income");
  const expense = sumByType(list, "expense");
  return { income, expense, balance: income - expense, count: list.length };
}

function groupByMonth(ymList) {
  const map = new Map();
  ymList.forEach(ym => map.set(ym, { ym, income: 0, expense: 0, balance: 0 }));

  // Solo suma si el movimiento realmente pertenece a ese mes
  for (const m of state.movements) {
    if (!map.has(m.mes)) continue;
    const row = map.get(m.mes);
    const amt = Number(m.monto) || 0;
    if (m.type === "income") row.income += amt;
    if (m.type === "expense") row.expense += amt;
  }

  for (const row of map.values()) {
    row.balance = row.income - row.expense;
  }

  return Array.from(map.values());
}

function initialsFromDesc(desc) {
  const s = (desc || "").trim();
  if (!s) return "•";
  return s[0].toUpperCase();
}

/** UI VIEWS */
function setView(view) {
  state.view = view;

  $("viewDashboard").classList.toggle("hidden", view !== "dashboard");
  $("viewMonth").classList.toggle("hidden", view !== "month");

  $("tabDashboard").classList.toggle("active", view === "dashboard");
  $("tabMonth").classList.toggle("active", view === "month");

  $("tabDashboard").setAttribute("aria-selected", view === "dashboard" ? "true" : "false");
  $("tabMonth").setAttribute("aria-selected", view === "month" ? "true" : "false");

  render();
}

/** MODALS */
function openOverlay(el) {
  el.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
function closeOverlay(el) {
  el.classList.add("hidden");
  document.body.style.overflow = "";
}

function resetMoveModal() {
  editMode = false;
  editId = null;

  $("modalTitle").textContent = "Nuevo Movimiento";
  $("btnSaveMovement").textContent = "Guardar Movimiento";

  $("descInput").value = "";
  $("amountInput").value = "";
  $("installmentsInput").value = "1";
  $("startMonthInput").value = state.selectedMonth;

  setMoveType(state.moveType);
  updateInstallmentsUI();

  $("startMonthInput").disabled = false;
  $("categorySelect").disabled = false;
  $("installmentsInput").disabled = false;
}

function openMoveModal() {
  resetMoveModal();
  openOverlay($("overlayMove"));
  setTimeout(() => $("descInput").focus(), 50);
}

function openEditModal(movement) {
  editMode = true;
  editId = movement.id;

  $("modalTitle").textContent = "Editar Movimiento";
  $("btnSaveMovement").textContent = "Guardar Cambios";

  setMoveType(movement.type);

  $("descInput").value = movement.descripcion || "";
  $("amountInput").value = String(Number(movement.monto) || 0);
  $("startMonthInput").value = movement.mes;
  $("categorySelect").value = movement.categoria || (movement.type === "income" ? "Extra" : "Consumo General");

  const isInstallment = Boolean(movement.planId && movement.installmentsTotal);

  if (isInstallment) {
    $("installmentsBlock").classList.add("hidden");
    $("startMonthInput").disabled = true;
    $("categorySelect").disabled = true;
    $("installmentsInput").disabled = true;
  } else {
    $("startMonthInput").disabled = false;
    $("categorySelect").disabled = false;
    $("installmentsInput").disabled = false;
    updateInstallmentsUI();
  }

  openOverlay($("overlayMove"));
  setTimeout(() => $("descInput").focus(), 50);
}

function closeMoveModal() {
  closeOverlay($("overlayMove"));
}

/** MOVE TYPE + CATEGORIES */
function setMoveType(type) {
  state.moveType = type;

  $("tabExpense").classList.toggle("active", type === "expense");
  $("tabIncome").classList.toggle("active", type === "income");

  $("tabExpense").setAttribute("aria-selected", type === "expense" ? "true" : "false");
  $("tabIncome").setAttribute("aria-selected", type === "income" ? "true" : "false");

  const sel = $("categorySelect");
  sel.innerHTML = "";

  const cats = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  for (const c of cats) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  }

  $("amountHint").textContent = (type === "income")
    ? "Monto del ingreso"
    : "Monto del gasto";

  updateInstallmentsUI();
}

function updateInstallmentsUI() {
  const type = state.moveType;
  const cat = $("categorySelect").value;

  const shouldShow = (type === "expense") && INSTALLMENT_CATEGORIES.has(cat) && !editMode;
  $("installmentsBlock").classList.toggle("hidden", !shouldShow);

  const cuota = parseMoney($("amountInput").value);
  const n = Math.max(1, parseInt($("installmentsInput").value || "1", 10));
  $("installmentsMath").textContent = `x ${formatARS(cuota)} = Total ${formatARS(cuota * n)}`;

  const start = $("startMonthInput").value || state.selectedMonth;
  $("installmentsHint").textContent =
    `El sistema generará automáticamente ${n} registros mensuales comenzando en ${start}.`;
}

/** CRUD */
function addMovement({ type, descripcion, monto, mesInicio, categoria, cuotas }) {
  const list = [...state.movements];

  if (type === "expense" && INSTALLMENT_CATEGORIES.has(categoria) && cuotas && cuotas > 1) {
    const planId = uid();
    const cuotaValue = monto;

    for (let i = 0; i < cuotas; i++) {
      const ym = addMonths(mesInicio, i);
      list.push({
        id: uid(),
        type,
        descripcion,
        monto: cuotaValue,
        mes: ym,
        categoria,
        planId,
        installmentIndex: i + 1,
        installmentsTotal: cuotas,
        createdAt: Date.now(),
      });
    }
  } else {
    list.push({
      id: uid(),
      type,
      descripcion,
      monto,
      mes: mesInicio,
      categoria,
      planId: null,
      installmentIndex: null,
      installmentsTotal: null,
      createdAt: Date.now(),
    });
  }

  state.movements = list;
  saveMovements(state.movements);
  render();
}

function updateMovement(id, patch) {
  let changed = false;
  state.movements = state.movements.map(m => {
    if (m.id !== id) return m;
    changed = true;
    return {
      ...m,
      ...patch,
      monto: Number(patch.monto ?? m.monto) || 0,
      mes: String(patch.mes ?? m.mes),
      descripcion: String(patch.descripcion ?? m.descripcion),
      categoria: String(patch.categoria ?? m.categoria),
    };
  });

  if (changed) {
    saveMovements(state.movements);
    render();
  }
}

function deleteMovement(id) {
  const before = state.movements.length;
  state.movements = state.movements.filter(m => m.id !== id);
  if (state.movements.length !== before) {
    saveMovements(state.movements);
    render();
  }
}

/** RENDER */
function renderHeader() {
  $("subtitleMonth").textContent = `Estado financiero para ${monthToLabel(state.selectedMonth)}`;
  $("monthInput").value = state.selectedMonth;

  // monthPretty (badge label)
  $("monthPretty").textContent = monthToLabel(state.selectedMonth);
}

function renderDashboard() {
  const { income, expense, balance, count } = buildMonthTotals(state.selectedMonth);

  $("kpiIncome").textContent = formatARS(income);
  $("kpiExpense").textContent = formatARS(expense);
  $("kpiBalance").textContent = formatARS(balance);

  $("kpiPaid").textContent = "0";
  $("kpiTotalOps").textContent = String(count);

  const months = Array.from({ length: 6 }, (_, i) => addMonths(state.selectedMonth, i));
  const rows = groupByMonth(months);

  const grid = $("projectionGrid");
  grid.innerHTML = "";

  for (const r of rows) {
    const card = document.createElement("div");
    card.className = "proj-card";

    const title = document.createElement("div");
    title.className = "proj-month";
    title.textContent = monthToLabel(r.ym);

    const row1 = document.createElement("div");
    row1.className = "proj-row";
    row1.innerHTML = `Ingresos <b>${formatARS(r.income)}</b>`;

    const row2 = document.createElement("div");
    row2.className = "proj-row";
    row2.innerHTML = `Gastos <b>${formatARS(r.expense)}</b>`;

    const left = document.createElement("div");
    left.className = "proj-left";
    left.innerHTML = `<span class="label">Te queda</span> <span>${formatARS(r.balance)}</span>`;

    card.appendChild(title);
    card.appendChild(row1);
    card.appendChild(row2);
    card.appendChild(left);

    grid.appendChild(card);
  }
}

function renderMonthView() {
  const list = getMonthMovements(state.selectedMonth);

  const incomes = list.filter(m => m.type === "income");
  const expenses = list.filter(m => m.type === "expense");

  const incTotal = incomes.reduce((a, m) => a + (Number(m.monto) || 0), 0);
  const expTotal = expenses.reduce((a, m) => a + (Number(m.monto) || 0), 0);

  $("monthIncomeTotal").textContent = formatARS(incTotal);
  $("monthExpenseTotal").textContent = formatARS(expTotal);

  // Incomes
  const emptyIncome = $("emptyIncome");
  const incomeList = $("incomeList");
  incomeList.innerHTML = "";

  if (incomes.length === 0) {
    emptyIncome.style.display = "block";
  } else {
    emptyIncome.style.display = "none";
    for (const m of incomes) {
      incomeList.appendChild(renderIncomeItem(m));
    }
  }

  // Expenses grouped by category
  const emptyExpense = $("emptyExpense");
  const groups = $("expenseGroups");
  groups.innerHTML = "";

  if (expenses.length === 0) {
    emptyExpense.style.display = "block";
  } else {
    emptyExpense.style.display = "none";

    // group by category in defined order
    const byCat = new Map(EXPENSE_CATEGORIES.map(c => [c, []]));
    for (const e of expenses) {
      const c = e.categoria || "Consumo General";
      if (!byCat.has(c)) byCat.set(c, []);
      byCat.get(c).push(e);
    }

    for (const cat of byCat.keys()) {
      const arr = byCat.get(cat);
      if (!arr || arr.length === 0) continue;

      const totalCat = arr.reduce((a, m) => a + (Number(m.monto) || 0), 0);
      groups.appendChild(renderExpenseGroup(cat, totalCat, arr));
    }
  }
}

function renderIncomeItem(m) {
  const item = document.createElement("div");
  item.className = "item";

  const left = document.createElement("div");
  left.className = "item-left";

  const av = document.createElement("div");
  av.className = "avatar";
  av.textContent = initialsFromDesc(m.descripcion);

  const meta = document.createElement("div");
  meta.className = "item-meta";

  const t = document.createElement("div");
  t.className = "item-title";
  t.textContent = m.descripcion || "(Sin descripción)";

  const sub = document.createElement("div");
  sub.className = "item-sub";
  sub.textContent = `${m.categoria || "Ingreso"} · ${monthToLabel(m.mes)}`;

  meta.appendChild(t);
  meta.appendChild(sub);

  left.appendChild(av);
  left.appendChild(meta);

  const right = document.createElement("div");
  right.className = "item-right";

  const amt = document.createElement("div");
  amt.className = "amount green";
  amt.textContent = formatARS(m.monto);

  const actions = document.createElement("div");
  actions.className = "actionBtns";

  const edit = document.createElement("button");
  edit.className = "iconEdit";
  edit.type = "button";
  edit.title = "Editar";
  edit.textContent = "✏️";
  edit.addEventListener("click", () => openEditModal(m));

  const del = document.createElement("button");
  del.className = "iconTrash";
  del.type = "button";
  del.title = "Eliminar";
  del.textContent = "🗑️";
  del.addEventListener("click", () => {
    const ok = confirm("¿Eliminar este ingreso?");
    if (!ok) return;
    deleteMovement(m.id);
  });

  actions.appendChild(edit);
  actions.appendChild(del);

  right.appendChild(amt);
  right.appendChild(actions);

  item.appendChild(left);
  item.appendChild(right);

  return item;
}

function renderExpenseGroup(cat, totalCat, arr) {
  const wrap = document.createElement("div");
  wrap.className = "expenseGroup";

  const head = document.createElement("div");
  head.className = "expenseGroupHead";

  const title = document.createElement("div");
  title.className = "expenseGroupTitle";
  title.textContent = cat;

  const badge = document.createElement("div");
  badge.className = "expenseGroupBadge";
  badge.textContent = formatARS(totalCat);

  head.appendChild(title);
  head.appendChild(badge);

  const tableWrap = document.createElement("div");
  tableWrap.className = "tableWrap";
  tableWrap.style.border = "0";
  tableWrap.style.borderRadius = "0";

  const table = document.createElement("table");
  table.className = "table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>DETALLE</th>
      <th class="right">MONTO</th>
      <th class="right" style="width:120px;">&nbsp;</th>
    </tr>
  `;

  const tbody = document.createElement("tbody");

  for (const m of arr) {
    tbody.appendChild(renderExpenseRow(m));
  }

  table.appendChild(thead);
  table.appendChild(tbody);
  tableWrap.appendChild(table);

  wrap.appendChild(head);
  wrap.appendChild(tableWrap);

  return wrap;
}

function renderExpenseRow(m) {
  const tr = document.createElement("tr");

  const td1 = document.createElement("td");
  const title = document.createElement("div");
  title.textContent = m.descripcion || "(Sin descripción)";

  const sub = document.createElement("span");
  sub.className = "small";
  if (m.planId && m.installmentIndex && m.installmentsTotal) {
    sub.textContent = `Cuota ${m.installmentIndex}/${m.installmentsTotal}`;
  } else {
    sub.textContent = m.categoria || "Gasto";
  }

  td1.appendChild(title);
  td1.appendChild(sub);

  const td2 = document.createElement("td");
  td2.className = "right";
  td2.textContent = formatARS(m.monto);

  const td3 = document.createElement("td");
  td3.className = "right";

  const actions = document.createElement("div");
  actions.className = "actionBtns";
  actions.style.justifyContent = "flex-end";

  const edit = document.createElement("button");
  edit.className = "iconEdit";
  edit.type = "button";
  edit.title = "Editar";
  edit.textContent = "✏️";
  edit.addEventListener("click", () => openEditModal(m));

  const del = document.createElement("button");
  del.className = "iconTrash";
  del.type = "button";
  del.title = "Eliminar";
  del.textContent = "🗑️";
  del.addEventListener("click", () => {
    const ok = confirm("¿Eliminar este gasto?");
    if (!ok) return;
    deleteMovement(m.id);
  });

  actions.appendChild(edit);
  actions.appendChild(del);

  td3.appendChild(actions);

  tr.appendChild(td1);
  tr.appendChild(td2);
  tr.appendChild(td3);

  return tr;
}

function render() {
  renderHeader();
  renderDashboard();
  renderMonthView();
}

/** EVENTS */
function bindEvents() {
  $("tabDashboard").addEventListener("click", () => setView("dashboard"));
  $("tabMonth").addEventListener("click", () => setView("month"));

  $("monthInput").addEventListener("change", (e) => {
    state.selectedMonth = e.target.value;
    $("startMonthInput").value = state.selectedMonth;
    updateInstallmentsUI();
    render();
  });

  $("btnOpenModal").addEventListener("click", openMoveModal);
  $("fabOpenModal").addEventListener("click", openMoveModal);

  $("btnCloseModal").addEventListener("click", closeMoveModal);
  $("overlayMove").addEventListener("click", (e) => {
    if (e.target.id === "overlayMove") closeMoveModal();
  });

  $("tabExpense").addEventListener("click", () => { editMode = false; setMoveType("expense"); });
  $("tabIncome").addEventListener("click", () => { editMode = false; setMoveType("income"); });

  $("categorySelect").addEventListener("change", updateInstallmentsUI);
  $("amountInput").addEventListener("input", updateInstallmentsUI);
  $("installmentsInput").addEventListener("input", updateInstallmentsUI);
  $("startMonthInput").addEventListener("change", updateInstallmentsUI);

  $("moveForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const descripcion = $("descInput").value.trim();
    const monto = parseMoney($("amountInput").value);
    const mesInicio = $("startMonthInput").value || state.selectedMonth;
    const categoria = $("categorySelect").value;

    if (!descripcion) return alert("Poné una descripción.");
    if (monto <= 0) return alert("El monto debe ser mayor a 0.");
    if (!/^\d{4}-\d{2}$/.test(mesInicio)) return alert("Elegí un mes válido.");

    // EDIT MODE
    if (editMode && editId) {
      updateMovement(editId, {
        descripcion,
        monto,
        mes: mesInicio,
        categoria,
      });
      closeMoveModal();
      return;
    }

    // CREATE MODE
    let cuotas = 1;
    if (state.moveType === "expense" && INSTALLMENT_CATEGORIES.has(categoria)) {
      cuotas = Math.max(1, parseInt($("installmentsInput").value || "1", 10));
    }

    addMovement({
      type: state.moveType,
      descripcion,
      monto,
      mesInicio,
      categoria,
      cuotas,
    });

    closeMoveModal();
  });

  $("btnImportPDF").addEventListener("click", () => {
    alert("Importar PDF (UI): todavía sin parseo real.");
  });

  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!$("overlayMove").classList.contains("hidden")) closeMoveModal();
  });
}

/** INIT */
function init() {
  normalizeSelectedMonth();
  $("monthInput").value = state.selectedMonth;
  $("startMonthInput").value = state.selectedMonth;

  ensureSeed();
  state.movements = loadMovements();

  setMoveType("expense");
  bindEvents();
  render();
}

init();
