{\rtf1\ansi\ansicpg1252\cocoartf2761
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww28600\viewh14760\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 /* =========================\
   FinanzasPro AR (Vanilla)\
   ========================= */\
\
const ENABLE_SEED = true; // <- ponelo en false si no quer\'e9s movimientos de ejemplo\
const LS_KEY = "finanzaspro_ar_movimientos_v1";\
\
let currentView = "dashboard"; // dashboard | month\
let currentMonth = getTodayMonth(); // YYYY-MM\
let modalType = "gasto"; // gasto | ingreso\
\
// ---------- DOM ----------\
const $ = (sel) => document.querySelector(sel);\
\
const viewDashboard = $("#viewDashboard");\
const viewMonth = $("#viewMonth");\
\
const tabs = document.querySelectorAll(".tab");\
const monthInput = $("#monthInput");\
const selectedMonthLabel = $("#selectedMonthLabel");\
\
const cardRemanente = $("#cardRemanente");\
const cardIngresos = $("#cardIngresos");\
const cardGastos = $("#cardGastos");\
const gastosMeta = $("#gastosMeta");\
\
const projectionGrid = $("#projectionGrid");\
\
const monthIngresosTotal = $("#monthIngresosTotal");\
const monthGastosTotal = $("#monthGastosTotal");\
const monthIngresosList = $("#monthIngresosList");\
const monthIngresosEmpty = $("#monthIngresosEmpty");\
const monthGastosRows = $("#monthGastosRows");\
const monthGastosEmpty = $("#monthGastosEmpty");\
\
const btnAddMovementTop = $("#btnAddMovementTop");\
const fabAdd = $("#fabAdd");\
const btnImportPdf = $("#btnImportPdf");\
\
// Modal\
const modalOverlay = $("#modalOverlay");\
const btnCloseModal = $("#btnCloseModal");\
const modalTabs = document.querySelectorAll(".modal-tab");\
const movementForm = $("#movementForm");\
const descInput = $("#descInput");\
const amountInput = $("#amountInput");\
const startMonthInput = $("#startMonthInput");\
const categorySelect = $("#categorySelect");\
const installmentsBox = $("#installmentsBox");\
const installmentsInput = $("#installmentsInput");\
const installmentValue = $("#installmentValue");\
const installmentTotal = $("#installmentTotal");\
const installmentsHint = $("#installmentsHint");\
const montoLabel = $("#montoLabel");\
\
// ---------- INIT ----------\
init();\
\
function init() \{\
  // Month default\
  monthInput.value = currentMonth;\
  startMonthInput.value = currentMonth;\
  updateMonthLabel();\
\
  // Seed\
  ensureSeed();\
\
  // Render\
  renderAll();\
\
  // Events\
  tabs.forEach((t) => t.addEventListener("click", () => setView(t.dataset.view)));\
  monthInput.addEventListener("change", () => \{\
    currentMonth = monthInput.value || getTodayMonth();\
    startMonthInput.value = currentMonth;\
    updateMonthLabel();\
    renderAll();\
  \});\
\
  btnAddMovementTop.addEventListener("click", openModal);\
  fabAdd.addEventListener("click", openModal);\
\
  btnImportPdf.addEventListener("click", () => \{\
    alert("Importar PDF (UI): pr\'f3ximamente. Por ahora pod\'e9s cargar movimientos manualmente.");\
  \});\
\
  btnCloseModal.addEventListener("click", closeModal);\
  modalOverlay.addEventListener("click", (e) => \{\
    if (e.target === modalOverlay) closeModal();\
  \});\
\
  modalTabs.forEach((t) =>\
    t.addEventListener("click", () => \{\
      setModalType(t.dataset.type);\
    \})\
  );\
\
  categorySelect.addEventListener("change", syncInstallmentsVisibility);\
  installmentsInput.addEventListener("input", syncInstallmentsMath);\
  amountInput.addEventListener("input", syncInstallmentsMath);\
  startMonthInput.addEventListener("change", syncInstallmentsMath);\
\
  movementForm.addEventListener("submit", onSubmitMovement);\
\
  // Delegaci\'f3n de eventos para eliminar (Mi Mes)\
  monthIngresosList.addEventListener("click", onMonthListClick);\
  monthGastosRows.addEventListener("click", onMonthTableClick);\
\
  // Esc to close modal\
  window.addEventListener("keydown", (e) => \{\
    if (e.key === "Escape") closeModal();\
  \});\
\}\
\
// ---------- VIEW ----------\
function setView(view) \{\
  currentView = view;\
\
  tabs.forEach((t) => \{\
    const isActive = t.dataset.view === view;\
    t.classList.toggle("is-active", isActive);\
    t.setAttribute("aria-selected", isActive ? "true" : "false");\
  \});\
\
  viewDashboard.classList.toggle("is-active", view === "dashboard");\
  viewMonth.classList.toggle("is-active", view === "month");\
\
  renderAll();\
\}\
\
function updateMonthLabel() \{\
  selectedMonthLabel.textContent = formatMonthLabel(currentMonth);\
\}\
\
// ---------- STORAGE ----------\
function loadMovements() \{\
  try \{\
    const raw = localStorage.getItem(LS_KEY);\
    const data = raw ? JSON.parse(raw) : [];\
    return Array.isArray(data) ? data : [];\
  \} catch \{\
    return [];\
  \}\
\}\
\
function saveMovements(list) \{\
  localStorage.setItem(LS_KEY, JSON.stringify(list));\
\}\
\
function ensureSeed() \{\
  if (!ENABLE_SEED) return;\
\
  const existing = loadMovements();\
  if (existing.length > 0) return;\
\
  const seedMonth = currentMonth;\
\
  const seed = [\
    \{\
      id: cryptoId(),\
      tipo: "ingreso",\
      descripcion: "Sueldo",\
      monto: 250000,\
      mes: seedMonth,\
      categoria: "Consumo General",\
      createdAt: Date.now()\
    \},\
    \{\
      id: cryptoId(),\
      tipo: "gasto",\
      descripcion: "Supermercado",\
      monto: 65000,\
      mes: seedMonth,\
      categoria: "Consumo General",\
      createdAt: Date.now()\
    \}\
  ];\
\
  saveMovements(seed);\
\}\
\
// ---------- RENDER ----------\
function renderAll() \{\
  const movements = loadMovements();\
  const monthMovs = movements.filter((m) => m.mes === currentMonth);\
\
  const ingresos = monthMovs.filter((m) => m.tipo === "ingreso");\
  const gastos = monthMovs.filter((m) => m.tipo === "gasto");\
\
  const totalIngresos = sum(ingresos.map((m) => m.monto));\
  const totalGastos = sum(gastos.map((m) => m.monto));\
  const remanente = totalIngresos - totalGastos;\
\
  // Cards\
  cardIngresos.textContent = money(totalIngresos);\
  cardGastos.textContent = money(totalGastos);\
  cardRemanente.textContent = money(remanente);\
\
  // "pagados de" (placeholder)\
  gastosMeta.textContent = `$\{gastos.length\} pagados de $\{gastos.length\}`;\
\
  // Projection (6 meses)\
  renderProjection(movements);\
\
  // Month view\
  renderMonthView(ingresos, gastos);\
\}\
\
function renderProjection(allMovements) \{\
  projectionGrid.innerHTML = "";\
\
  const months = nextMonths(currentMonth, 6);\
  months.forEach((m) => \{\
    const monthMovs = allMovements.filter((x) => x.mes === m);\
    const inc = sum(monthMovs.filter((x) => x.tipo === "ingreso").map((x) => x.monto));\
    const exp = sum(monthMovs.filter((x) => x.tipo === "gasto").map((x) => x.monto));\
    const rem = inc - exp;\
\
    const col = document.createElement("div");\
    col.className = "proj-col";\
    col.innerHTML = `\
      <div class="proj-month">$\{formatMonthShort(m)\}</div>\
      <div class="proj-amt">$\{money(rem)\}</div>\
      <div class="proj-sub">Ingresos $\{money(inc)\} \'b7 Gastos $\{money(exp)\}</div>\
    `;\
    projectionGrid.appendChild(col);\
  \});\
\}\
\
function renderMonthView(ingresos, gastos) \{\
  monthIngresosTotal.textContent = money(sum(ingresos.map((m) => m.monto)));\
  monthGastosTotal.textContent = money(sum(gastos.map((m) => m.monto)));\
\
  // Ingresos list\
  monthIngresosList.innerHTML = "";\
  if (ingresos.length === 0) \{\
    monthIngresosEmpty.classList.remove("hidden");\
  \} else \{\
    monthIngresosEmpty.classList.add("hidden");\
    ingresos\
      .slice()\
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))\
      .forEach((m) => \{\
        const li = document.createElement("li");\
        li.className = "list-item";\
        li.innerHTML = `\
          <div class="li-left">\
            <div class="li-title">$\{escapeHtml(m.descripcion || "Ingreso")\}</div>\
            <div class="li-sub">$\{escapeHtml(m.categoria || "")\} \'b7 $\{formatMonthShort(m.mes)\}</div>\
          </div>\
\
          <div class="li-right">\
            <div class="li-amt" style="color: var(--green)">$\{money(m.monto)\}</div>\
            <button class="del-btn" data-action="delete" data-id="$\{escapeAttr(m.id)\}" title="Eliminar">\
              \uc0\u55357 \u56785 \u65039 \
            </button>\
          </div>\
        `;\
        monthIngresosList.appendChild(li);\
      \});\
  \}\
\
  // Gastos table\
  monthGastosRows.innerHTML = "";\
  if (gastos.length === 0) \{\
    monthGastosEmpty.classList.remove("hidden");\
  \} else \{\
    monthGastosEmpty.classList.add("hidden");\
    gastos\
      .slice()\
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))\
      .forEach((m) => \{\
        const row = document.createElement("div");\
        row.className = "tr";\
        row.innerHTML = `\
          <div class="td-left">\
            $\{escapeHtml(m.descripcion || "Gasto")\}\
            <div class="td-sub">$\{escapeHtml(m.categoria || "")\}</div>\
          </div>\
\
          <div class="td-right-wrap">\
            <div class="td-right">$\{money(m.monto)\}</div>\
            <button class="del-btn" data-action="delete" data-id="$\{escapeAttr(m.id)\}" title="Eliminar">\
              \uc0\u55357 \u56785 \u65039 \
            </button>\
          </div>\
        `;\
        monthGastosRows.appendChild(row);\
      \});\
  \}\
\}\
\
// ---------- DELETE LOGIC ----------\
function onMonthListClick(e) \{\
  const btn = e.target.closest("button[data-action='delete']");\
  if (!btn) return;\
  const id = btn.dataset.id;\
  deleteMovementFlow(id);\
\}\
\
function onMonthTableClick(e) \{\
  const btn = e.target.closest("button[data-action='delete']");\
  if (!btn) return;\
  const id = btn.dataset.id;\
  deleteMovementFlow(id);\
\}\
\
function deleteMovementFlow(id) \{\
  const all = loadMovements();\
  const item = all.find((m) => m.id === id);\
\
  if (!item) return;\
\
  // Si es parte de un plan de cuotas, te doy opci\'f3n de borrar solo esa cuota o todo el plan\
  const hasPlan = Boolean(item.planId) || (item.cuotas && item.cuotas > 1);\
\
  if (hasPlan) \{\
    const planId = item.planId || null;\
\
    // Si no hay planId (viejo), igual puede tener cuotas>1 pero sin agrupaci\'f3n.\
    // En ese caso borramos solo esa cuota.\
    if (!planId) \{\
      const ok = confirm("\'bfEliminar esta cuota?");\
      if (!ok) return;\
      const updated = all.filter((m) => m.id !== id);\
      saveMovements(updated);\
      renderAll();\
      return;\
    \}\
\
    const choice = confirm(\
      "Este movimiento pertenece a un plan en cuotas.\\n\\nOK = Eliminar TODAS las cuotas del plan\\nCancelar = Eliminar SOLO esta cuota"\
    );\
\
    let updated;\
    if (choice) \{\
      updated = all.filter((m) => m.planId !== planId);\
    \} else \{\
      updated = all.filter((m) => m.id !== id);\
    \}\
\
    saveMovements(updated);\
    renderAll();\
    return;\
  \}\
\
  // Caso normal\
  const ok = confirm("\'bfEliminar este movimiento?");\
  if (!ok) return;\
\
  const updated = all.filter((m) => m.id !== id);\
  saveMovements(updated);\
  renderAll();\
\}\
\
// ---------- MODAL ----------\
function openModal() \{\
  // Reset defaults\
  modalType = "gasto";\
  setModalType("gasto");\
\
  descInput.value = "";\
  amountInput.value = "";\
  startMonthInput.value = currentMonth;\
  categorySelect.value = "Consumo General";\
  installmentsInput.value = "1";\
\
  syncInstallmentsVisibility();\
  syncInstallmentsMath();\
\
  modalOverlay.classList.add("is-open");\
  modalOverlay.setAttribute("aria-hidden", "false");\
\
  setTimeout(() => descInput.focus(), 50);\
\}\
\
function closeModal() \{\
  modalOverlay.classList.remove("is-open");\
  modalOverlay.setAttribute("aria-hidden", "true");\
\}\
\
function setModalType(type) \{\
  modalType = type;\
\
  modalTabs.forEach((t) => \{\
    const active = t.dataset.type === type;\
    t.classList.toggle("is-active", active);\
    t.setAttribute("aria-selected", active ? "true" : "false");\
  \});\
\
  syncInstallmentsVisibility();\
  syncInstallmentsMath();\
\}\
\
function syncInstallmentsVisibility() \{\
  const cat = categorySelect.value;\
  const showInstallments = cat === "Tarjeta de Cr\'e9dito" || cat === "Pr\'e9stamo Personal";\
\
  installmentsBox.classList.toggle("is-hidden", !showInstallments);\
\
  // Cambiar texto del label monto (si hay cuotas, lo interpretamos como valor de cuota)\
  montoLabel.textContent = showInstallments ? "Monto (Valor de la cuota)" : "Monto";\
\
  syncInstallmentsMath();\
\}\
\
function syncInstallmentsMath() \{\
  const cat = categorySelect.value;\
  const showInstallments = cat === "Tarjeta de Cr\'e9dito" || cat === "Pr\'e9stamo Personal";\
  if (!showInstallments) return;\
\
  const cuota = toNumber(amountInput.value);\
  const n = clampInt(toInt(installmentsInput.value), 1, 120);\
  installmentsInput.value = String(n);\
\
  installmentValue.textContent = money(cuota);\
  installmentTotal.textContent = money(cuota * n);\
\
  const start = startMonthInput.value || currentMonth;\
  installmentsHint.textContent =\
    `El sistema generar\'e1 autom\'e1ticamente $\{n\} registros mensuales comenzando en $\{formatMonthLabel(start)\}.`;\
\}\
\
function onSubmitMovement(e) \{\
  e.preventDefault();\
\
  const descripcion = descInput.value.trim();\
  const monto = toNumber(amountInput.value);\
  const mesInicio = startMonthInput.value || currentMonth;\
  const categoria = categorySelect.value;\
\
  if (!descripcion) return alert("La descripci\'f3n es obligatoria.");\
  if (!(monto >= 0)) return alert("El monto debe ser v\'e1lido.");\
  if (!mesInicio) return alert("Seleccion\'e1 un mes de inicio.");\
\
  const showInstallments = categoria === "Tarjeta de Cr\'e9dito" || categoria === "Pr\'e9stamo Personal";\
  const cuotas = showInstallments ? clampInt(toInt(installmentsInput.value), 1, 120) : 1;\
\
  const list = loadMovements();\
\
  if (showInstallments) \{\
    const planId = cryptoId(); // <- clave para borrar todas las cuotas juntas\
    const months = nextMonths(mesInicio, cuotas);\
\
    months.forEach((m, idx) => \{\
      list.push(\{\
        id: cryptoId(),\
        planId,\
        tipo: modalType,\
        descripcion: `$\{descripcion\} (Cuota $\{idx + 1\}/$\{cuotas\})`,\
        monto: round2(monto),\
        mes: m,\
        categoria,\
        cuotas,\
        cuotaIndex: idx + 1,\
        createdAt: Date.now()\
      \});\
    \});\
  \} else \{\
    list.push(\{\
      id: cryptoId(),\
      tipo: modalType,\
      descripcion,\
      monto: round2(monto),\
      mes: mesInicio,\
      categoria,\
      cuotas: 1,\
      createdAt: Date.now()\
    \});\
  \}\
\
  saveMovements(list);\
  renderAll();\
  closeModal();\
\}\
\
// ---------- HELPERS ----------\
function sum(arr) \{\
  return arr.reduce((a, b) => a + (Number(b) || 0), 0);\
\}\
\
function money(n) \{\
  const val = Number(n) || 0;\
  return val.toLocaleString("es-AR", \{\
    style: "currency",\
    currency: "ARS",\
    maximumFractionDigits: 2\
  \});\
\}\
\
function getTodayMonth() \{\
  const d = new Date();\
  const y = d.getFullYear();\
  const m = String(d.getMonth() + 1).padStart(2, "0");\
  return `$\{y\}-$\{m\}`;\
\}\
\
function formatMonthLabel(yyyyMm) \{\
  const [y, m] = String(yyyyMm || "").split("-").map(Number);\
  if (!y || !m) return "\'97";\
  const date = new Date(y, m - 1, 1);\
  return date.toLocaleDateString("es-AR", \{ month: "long", year: "numeric" \});\
\}\
\
function formatMonthShort(yyyyMm) \{\
  const [y, m] = String(yyyyMm || "").split("-").map(Number);\
  if (!y || !m) return "\'97";\
  const date = new Date(y, m - 1, 1);\
  const mon = date.toLocaleDateString("es-AR", \{ month: "short" \}).replace(".", "");\
  return `$\{capitalize(mon)\} $\{y\}`;\
\}\
\
function nextMonths(startYYYYMM, count) \{\
  const [y, m] = String(startYYYYMM || "").split("-").map(Number);\
  if (!y || !m) return [];\
  const res = [];\
  const d = new Date(y, m - 1, 1);\
\
  for (let i = 0; i < count; i++) \{\
    const yy = d.getFullYear();\
    const mm = String(d.getMonth() + 1).padStart(2, "0");\
    res.push(`$\{yy\}-$\{mm\}`);\
    d.setMonth(d.getMonth() + 1);\
  \}\
  return res;\
\}\
\
function toNumber(v) \{\
  const n = Number(String(v).replace(",", "."));\
  return Number.isFinite(n) ? n : 0;\
\}\
\
function toInt(v) \{\
  const n = parseInt(v, 10);\
  return Number.isFinite(n) ? n : 0;\
\}\
\
function clampInt(n, min, max) \{\
  return Math.max(min, Math.min(max, n));\
\}\
\
function round2(n) \{\
  return Math.round((Number(n) || 0) * 100) / 100;\
\}\
\
function capitalize(s) \{\
  if (!s) return s;\
  return s.charAt(0).toUpperCase() + s.slice(1);\
\}\
\
function escapeHtml(str) \{\
  return String(str)\
    .replaceAll("&", "&amp;")\
    .replaceAll("<", "&lt;")\
    .replaceAll(">", "&gt;")\
    .replaceAll('"', "&quot;")\
    .replaceAll("'", "&#039;");\
\}\
\
function escapeAttr(str) \{\
  // para data-id\
  return String(str).replaceAll('"', "&quot;");\
\}\
\
function cryptoId() \{\
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();\
  return "id-" + Math.random().toString(16).slice(2) + "-" + Date.now();\
\}\
}