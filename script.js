"use strict";

/* =========================================
   MyExpense v7 - Complete Script
   Features: Expense, Income, Money In/Out,
   Panda Savings, People Money, Finance,
   Calendar, Themes, Budget, Backup,
   Smart Import (v1/v2/v3/v5/v6 compatible)
========================================= */

/* ============ STORAGE KEYS ============ */
const EXPENSE_KEY = "myExpenses";
const SAVINGS_KEY = "mySavings";
const THEME_KEY = "expenseTheme";
const BUDGET_KEY = "myDailyBudget";
const V5_MONEY_KEY = "myExpenseV5Money";
const V5_PEOPLE_KEY = "myExpenseV5People";
const V5_THEME_KEY = "myExpenseV5Theme";
const DAILY_GOAL_KEY = "myExpenseDailySavingsGoal";

/* ============ CONSTANTS ============ */
const RESET_PIN = "2233";
const SAVINGS_PIN = "2233";
const PEOPLE_PIN = "2233";
const MAX_ATTEMPTS = 3;
const LOCK_TIME = 60 * 1000;
const MIN_SAVINGS = 10;
const INITIAL_EXPENSE_LIMIT = 5;

/* ============ STATE ============ */
let expenses = [];
let savings = [];
let v5Money = [];
let v5People = [];
let DAILY_GOAL = 10;
let currentMoneyMode = "in";
let currentPersonDirection = "receive";
let showAllExpenses = false;
let activeFilter = "All";
let savingsUnlocked = false;
let resetAttempts = 0;
let lockedUntil = 0;
let v5FinanceDate = new Date();
let v5CalendarDate = new Date();

/* ============ DOM HELPERS ============ */
const $ = (id) => document.getElementById(id);

/* =========================================
   STORAGE
========================================= */
function saveExpenses() {
  try { localStorage.setItem(EXPENSE_KEY, JSON.stringify(expenses)); } catch (e) {}
}
function loadExpenses() {
  try {
    const raw = localStorage.getItem(EXPENSE_KEY);
    expenses = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(expenses)) expenses = [];
  } catch (e) { expenses = []; }
}
function saveSavings() {
  try { localStorage.setItem(SAVINGS_KEY, JSON.stringify(savings)); } catch (e) {}
}
function loadSavings() {
  try {
    const raw = localStorage.getItem(SAVINGS_KEY);
    savings = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(savings)) savings = [];
  } catch (e) { savings = []; }
}
function saveV5Money() {
  try { localStorage.setItem(V5_MONEY_KEY, JSON.stringify(v5Money)); } catch (e) {}
}
function loadV5Money() {
  try {
    const raw = localStorage.getItem(V5_MONEY_KEY);
    v5Money = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(v5Money)) v5Money = [];
  } catch (e) { v5Money = []; }
}
function saveV5People() {
  try { localStorage.setItem(V5_PEOPLE_KEY, JSON.stringify(v5People)); } catch (e) {}
}
function loadV5People() {
  try {
    const raw = localStorage.getItem(V5_PEOPLE_KEY);
    v5People = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(v5People)) v5People = [];
  } catch (e) { v5People = []; }
}
function getDailyBudget() {
  try {
    const value = localStorage.getItem(BUDGET_KEY);
    if (value === null) return 0;
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  } catch (e) { return 0; }
}
function saveDailyBudget(value) {
  try { localStorage.setItem(BUDGET_KEY, String(value)); } catch (e) {}
}
function loadDailySavingsGoal() {
  try {
    const v = Number(localStorage.getItem(DAILY_GOAL_KEY));
    DAILY_GOAL = Number.isFinite(v) && v > 0 ? v : 10;
  } catch (e) { DAILY_GOAL = 10; }
}
function saveDailySavingsGoal(value) {
  DAILY_GOAL = value;
  try { localStorage.setItem(DAILY_GOAL_KEY, String(value)); } catch (e) {}
}

/* =========================================
   HELPERS
========================================= */
function pad(n) { return String(n).padStart(2, "0"); }

function dateKey(date) {
  return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
}
function monthKey(date) {
  return date.getFullYear() + "-" + pad(date.getMonth() + 1);
}
function todayISO() { return new Date().toISOString(); }

function formatMoney(amount) {
  return "৳" + Number(amount || 0).toLocaleString("en-BD", { maximumFractionDigits: 2 });
}
function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-BD", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}
function formatDay(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-BD", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric"
  });
}
function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function categoryIcon(cat) {
  const icons = {
    Food: "🍔", Transport: "🚗", Shopping: "🛍️",
    Bills: "🧾", Mobile: "📱", Other: "📦",
    Salary: "💼", Gift: "🎁", Extra: "✨"
  };
  return icons[cat] || "📦";
}
function subIcon(sub) {
  const icons = {
    Breakfast: "🍳", Lunch: "🍱", Dinner: "🍽️", Snack: "🍪"
  };
  return icons[sub] || "";
}

/* =========================================
   NAVIGATION
========================================= */
function showPage(pageName) {
  document.querySelectorAll(".app-page").forEach(page => {
    page.classList.toggle("active-page", page.id === "page-" + pageName);
  });
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === pageName);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (pageName === "reports") {
    renderSpendingTrends();
    renderDateHistory();
  }
  if (pageName === "finance") renderV5Finance();
  if (pageName === "money") renderV5Money();
  if (pageName === "more") updateBudgetUI();
  if (pageName === "panda") updateSavingsUI();
  if (pageName === "themes") renderV5Themes();
}

/* =========================================
   THEME
========================================= */
function loadTheme() {
  const theme = localStorage.getItem(THEME_KEY);
  if (theme === "dark") document.body.classList.add("dark");
  else document.body.classList.remove("dark");
  const saved = localStorage.getItem(V5_THEME_KEY);
  if (saved) applyV5Theme(saved, false);
}
function toggleTheme() {
  const isDark = document.body.classList.contains("dark");
  if (typeof applyV5Theme === "function") {
    applyV5Theme(isDark ? "liquid" : "midnight");
    return;
  }
  document.body.classList.toggle("dark");
  localStorage.setItem(THEME_KEY, document.body.classList.contains("dark") ? "dark" : "light");
}

/* =========================================
   DASHBOARD
========================================= */
function getTodayExpenseTotal() {
  const today = dateKey(new Date());
  return expenses.reduce((total, exp) => {
    const d = new Date(exp.createdAt || exp.date || exp.timestamp);
    if (isNaN(d.getTime())) return total;
    if (dateKey(d) === today) return total + (Number(exp.amount) || 0);
    return total;
  }, 0);
}

function getMonthExpenseTotal() {
  const m = monthKey(new Date());
  return expenses.reduce((total, exp) => {
    const d = new Date(exp.createdAt || exp.date || exp.timestamp);
    if (isNaN(d.getTime())) return total;
    if (monthKey(d) === m) return total + (Number(exp.amount) || 0);
    return total;
  }, 0);
}

function getTotalIncome() {
  return v5Money.filter(x => x.type === "in").reduce((s, x) => s + (Number(x.amount) || 0), 0);
}
function getTotalExpense() {
  return expenses.reduce((s, x) => s + (Number(x.amount) || 0), 0);
}
function getTotalMoneyOut() {
  return v5Money.filter(x => x.type === "out").reduce((s, x) => s + (Number(x.amount) || 0), 0);
}

function updateDashboard() {
  const income = getTotalIncome();
  const expense = getTotalExpense() + getTotalMoneyOut();
  const balance = income - expense;

  const bal = $("homeBalance");
  if (bal) bal.textContent = formatMoney(balance);

  const inc = $("homeIncome");
  if (inc) inc.textContent = formatMoney(income);

  const exp = $("homeExpense");
  if (exp) exp.textContent = formatMoney(expense);

  const mt = $("monthTotal");
  if (mt) mt.textContent = formatMoney(getMonthExpenseTotal());

  const tt = $("todayTotal");
  if (tt) tt.textContent = formatMoney(getTodayExpenseTotal());

  const ec = $("entryCount");
  if (ec) ec.textContent = expenses.length;

  const hc = $("historyCount");
  if (hc) hc.textContent = expenses.length + " " + (expenses.length === 1 ? "entry" : "entries");

  updateBudgetUI();
}

/* =========================================
   EXPENSES LIST
========================================= */
function getFilteredExpenses() {
  const query = ($("searchInput")?.value || "").trim().toLowerCase();
  const filtered = expenses.filter(exp => {
    if (activeFilter !== "All" && exp.category !== activeFilter) return false;
    const text = `${exp.category} ${exp.sub || ""} ${exp.note || ""} ${exp.amount}`;
    return text.toLowerCase().includes(query);
  });
  filtered.sort((a, b) => {
    const da = new Date(a.createdAt || a.date || a.timestamp);
    const db = new Date(b.createdAt || b.date || b.timestamp);
    return db - da;
  });
  return filtered;
}

function renderExpenses() {
  const list = $("expenseList");
  const empty = $("emptyState");
  const actions = $("historyActions");
  const shownText = $("expenseShownText");
  if (!list) return;

  const filtered = getFilteredExpenses();
  list.innerHTML = "";

  if (filtered.length === 0) {
    if (empty) {
      empty.style.display = "block";
      empty.textContent = expenses.length > 0 ? "No matching expenses." : "No expenses yet.";
    }
    if (actions) actions.classList.add("hidden");
    if (shownText) shownText.textContent = "Showing 0";
    return;
  }
  if (empty) empty.style.display = "none";

  const visible = showAllExpenses ? filtered : filtered.slice(0, INITIAL_EXPENSE_LIMIT);

  visible.forEach(exp => {
    const item = document.createElement("div");
    item.className = "expense-item";

    const subBadge = exp.sub
      ? `<span class="expense-sub">${subIcon(exp.sub)} ${escapeHTML(exp.sub)}</span>`
      : "";

    const rawDate = exp.createdAt || exp.date || exp.timestamp;
    const dateStr = rawDate ? formatDate(rawDate) : "—";

    item.innerHTML = `
      <div class="expense-icon">${categoryIcon(exp.category)}</div>
      <div class="expense-info">
        <div class="expense-category">${escapeHTML(exp.category)} ${subBadge}</div>
        <div class="expense-note">${escapeHTML(exp.note || "No note")}</div>
        <div class="expense-date">${dateStr}</div>
      </div>
      <div class="expense-right">
        <div class="expense-amount">${formatMoney(exp.amount)}</div>
        <button class="delete-btn" data-id="${escapeHTML(exp.id)}" type="button">Delete</button>
      </div>
    `;

    const delBtn = item.querySelector(".delete-btn");
    if (delBtn) delBtn.addEventListener("click", () => askPinThenDelete(exp.id));

    list.appendChild(item);
  });

  if (shownText) shownText.textContent = `Showing ${visible.length} of ${filtered.length}`;

  if (filtered.length > INITIAL_EXPENSE_LIMIT) {
    if (actions) actions.classList.remove("hidden");
    $("showMoreBtn")?.classList.toggle("hidden", showAllExpenses);
    $("showLessBtn")?.classList.toggle("hidden", !showAllExpenses);
  } else {
    if (actions) actions.classList.add("hidden");
  }
}

/* =========================================
   PIN PROTECTED DELETE
========================================= */
function askPinThenDelete(id) {
  const pin = prompt("Enter PIN to delete (default 2233):");
  if (pin === null) return;
  if (pin !== RESET_PIN) {
    alert("Wrong PIN.");
    return;
  }
  deleteExpense(id);
}

function deleteExpense(id) {
  const exp = expenses.find(x => x.id === id);
  if (!exp) return;
  const confirmed = confirm(`Delete ${formatMoney(exp.amount)} expense?`);
  if (!confirmed) return;
  expenses = expenses.filter(x => x.id !== id);
  saveExpenses();
  updateDashboard();
  renderExpenses();
  renderCategoryChart();
  renderSpendingTrends();
  renderDateHistory();
  renderV5Finance();
  renderV5Calendar();
}

/* =========================================
   ADD EXPENSE
========================================= */
function setupExpenseForm() {
  const form = $("expenseForm");
  if (!form) return;

  const categoryInput = $("category");
  const foodSubGroup = $("foodSubGroup");
  const foodSubInput = $("foodSub");

  categoryInput?.addEventListener("change", () => {
    if (categoryInput.value === "Food") foodSubGroup?.classList.remove("hidden");
    else { foodSubGroup?.classList.add("hidden"); if (foodSubInput) foodSubInput.value = ""; }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const amount = Number($("amount")?.value);
    const category = categoryInput?.value || "";
    const sub = category === "Food" ? (foodSubInput?.value || "") : "";
    const note = ($("note")?.value || "").trim();

    if (!amount || amount <= 0 || !category) {
      alert("Please enter a valid amount and category.");
      return;
    }

    const exp = {
      id: Date.now().toString() + Math.random().toString(16).slice(2),
      amount,
      category,
      sub,
      note,
      createdAt: new Date().toISOString()
    };

    expenses.push(exp);
    saveExpenses();
    form.reset();
    foodSubGroup?.classList.add("hidden");
    showAllExpenses = false;

    updateDashboard();
    renderExpenses();
    renderCategoryChart();
    renderSpendingTrends();
    renderDateHistory();
    renderV5Finance();
    renderV5Calendar();
    $("amount")?.focus();
  });
}

/* =========================================
   SEARCH + FILTER
========================================= */
function setupSearchFilter() {
  $("searchInput")?.addEventListener("input", () => {
    showAllExpenses = false;
    renderExpenses();
  });

  $("filterRow")?.addEventListener("click", (e) => {
    const chip = e.target.closest(".filter-chip");
    if (!chip) return;
    activeFilter = chip.dataset.filter;
    showAllExpenses = false;
    document.querySelectorAll(".filter-chip").forEach(b => {
      b.classList.toggle("active", b === chip);
    });
    renderExpenses();
  });

  $("showMoreBtn")?.addEventListener("click", () => {
    showAllExpenses = true;
    renderExpenses();
  });

  $("showLessBtn")?.addEventListener("click", () => {
    showAllExpenses = false;
    renderExpenses();
    $("expenseList")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

/* =========================================
   CATEGORY CHART
========================================= */
const CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Mobile", "Other"];

function monthExpenseTotals() {
  const m = monthKey(new Date());
  const totals = {};
  CATEGORIES.forEach(c => totals[c] = 0);
  expenses.forEach(exp => {
    const d = new Date(exp.createdAt || exp.date || exp.timestamp);
    if (isNaN(d.getTime()) || monthKey(d) !== m) return;
    if (!(exp.category in totals)) totals[exp.category] = 0;
    totals[exp.category] += Number(exp.amount) || 0;
  });
  return totals;
}

function renderCategoryChart() {
  const wrap = $("chartWrap");
  const empty = $("chartEmpty");
  if (!wrap) return;

  const totals = monthExpenseTotals();
  const entries = Object.entries(totals).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  wrap.innerHTML = "";

  if (entries.length === 0) {
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";

  const max = Math.max(...entries.map(e => e[1]));
  entries.forEach(([cat, value]) => {
    const pct = max > 0 ? (value / max) * 100 : 0;
    const row = document.createElement("div");
    row.className = "chart-row";
    row.innerHTML = `
      <div class="chart-label">${categoryIcon(cat)} ${escapeHTML(cat)}</div>
      <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${pct}%"></div></div>
      <div class="chart-value">${formatMoney(value)}</div>
    `;
    row.addEventListener("click", () => {
      activeFilter = cat;
      document.querySelectorAll(".filter-chip").forEach(b => {
        b.classList.toggle("active", b.dataset.filter === cat);
      });
      showAllExpenses = false;
      renderExpenses();
      showPage("expenses");
      setTimeout(() => $("expenseList")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    });
    wrap.appendChild(row);
  });
}

/* =========================================
   DAILY BUDGET
========================================= */
function updateBudgetUI() {
  const budget = getDailyBudget();
  const spent = getTodayExpenseTotal();
  const remaining = budget - spent;

  const bv = $("budgetValue"); if (bv) bv.textContent = formatMoney(budget);
  const bs = $("budgetSpent"); if (bs) bs.textContent = formatMoney(spent);

  const br = $("budgetRemaining");
  const bb = $("budgetBar");
  const st = $("budgetStatus");

  if (budget === 0) {
    if (br) br.textContent = "৳0";
    if (bb) bb.style.width = "0%";
    if (st) { st.textContent = "No daily budget set."; st.className = "budget-status"; }
  } else if (remaining >= 0) {
    if (br) br.textContent = formatMoney(remaining);
    if (bb) bb.style.width = Math.min((spent / budget) * 100, 100) + "%";
    if (st) { st.textContent = `${formatMoney(remaining)} remaining today.`; st.className = "budget-status good"; }
  } else {
    const over = Math.abs(remaining);
    if (br) br.textContent = "-" + formatMoney(over);
    if (bb) bb.style.width = "100%";
    if (st) { st.textContent = `⚠️ Over budget by ${formatMoney(over)}.`; st.className = "budget-status over"; }
  }

  const hbv = $("homeBudgetValue"); if (hbv) hbv.textContent = formatMoney(budget);
  const hsv = $("homeSpentValue"); if (hsv) hsv.textContent = formatMoney(spent);
  const hrv = $("homeRemainingValue");
  const hb = $("homeBudgetBar");
  const hs = $("budgetHomeStatus");

  if (budget === 0) {
    if (hrv) hrv.textContent = "৳0";
    if (hb) hb.style.width = "0%";
    if (hs) hs.textContent = "No daily budget set.";
  } else if (remaining >= 0) {
    if (hrv) hrv.textContent = formatMoney(remaining);
    if (hb) hb.style.width = Math.min((spent / budget) * 100, 100) + "%";
    if (hs) hs.textContent = "Today's budget is active.";
  } else {
    if (hrv) hrv.textContent = "-" + formatMoney(Math.abs(remaining));
    if (hb) hb.style.width = "100%";
    if (hs) hs.textContent = `⚠️ Over budget by ${formatMoney(Math.abs(remaining))}.`;
  }

  const input = $("dailyBudgetInput");
  if (input && document.activeElement !== input) {
    input.value = budget > 0 ? budget : "";
  }
}

function setupBudget() {
  $("saveBudgetBtn")?.addEventListener("click", () => {
    const budget = Number($("dailyBudgetInput")?.value);
    const msg = $("budgetMessage");
    if (!Number.isFinite(budget) || budget < 0) {
      if (msg) msg.textContent = "Please enter a valid budget.";
      return;
    }
    if (budget === 0) {
      saveDailyBudget(0);
      if (msg) msg.textContent = "Daily budget removed.";
    } else {
      saveDailyBudget(budget);
      if (msg) msg.textContent = `Daily budget set to ${formatMoney(budget)}.`;
    }
    updateBudgetUI();
    setTimeout(() => { if (msg) msg.textContent = ""; }, 2500);
  });

  $("homeBudgetBtn")?.addEventListener("click", () => {
    showPage("more");
    setTimeout(() => {
      const inp = $("dailyBudgetInput");
      inp?.focus();
      inp?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);
  });
}

/* =========================================
   SAVINGS
========================================= */
function totalSavings() {
  return savings.reduce((t, x) => t + (Number(x.amount) || 0), 0);
}
function todaySavingsTotal() {
  const today = dateKey(new Date());
  return savings.reduce((t, x) => {
    const d = new Date(x.createdAt);
    if (isNaN(d.getTime())) return t;
    if (dateKey(d) === today) return t + (Number(x.amount) || 0);
    return t;
  }, 0);
}

function updateSavingsUI() {
  const total = totalSavings();
  const today = todaySavingsTotal();

  const st = $("savingsTotal");
  if (st) st.textContent = savingsUnlocked ? formatMoney(total) : "৳ • • • •";

  const ts = $("todaySaving");
  if (ts) ts.textContent = formatMoney(today);

  const dgv = $("dailyGoalValue");
  if (dgv) dgv.textContent = formatMoney(DAILY_GOAL);

  const pct = Math.min((today / DAILY_GOAL) * 100, 100);
  const bar = $("dailyBar");
  if (bar) bar.style.width = pct + "%";

  const ds = $("dailyStatus");
  if (ds) {
    if (today >= DAILY_GOAL) ds.textContent = "🎉 Daily goal completed!";
    else ds.textContent = `Save ${formatMoney(DAILY_GOAL - today)} more to reach today's goal.`;
  }

  renderSavingsChart();
}

function openSavingsModal() {
  $("savingsAmount").value = "";
  $("savingsNote").value = "";
  $("savingsError").textContent = "";
  $("savingsModal").classList.remove("hidden");
  setTimeout(() => $("savingsAmount")?.focus(), 100);
}
function closeSavingsModal() { $("savingsModal")?.classList.add("hidden"); }

function addSavings() {
  const amount = Number($("savingsAmount")?.value);
  const note = ($("savingsNote")?.value || "").trim();
  const err = $("savingsError");

  if (!amount || amount < MIN_SAVINGS) {
    if (err) err.textContent = `Minimum saving is ${formatMoney(MIN_SAVINGS)}.`;
    return;
  }

  savings.push({
    id: Date.now().toString() + Math.random().toString(16).slice(2),
    amount, note,
    createdAt: new Date().toISOString()
  });
  saveSavings();
  closeSavingsModal();

  const pb = $("pandaBtn");
  if (pb) {
    pb.classList.remove("pop");
    void pb.offsetWidth;
    pb.classList.add("pop");
  }
  const pa = $("pandaAnim");
  if (pa) {
    pa.classList.remove("pop");
    void pa.offsetWidth;
    pa.classList.add("pop");
  }
  updateSavingsUI();
}

function openSavingsPin() {
  if (savingsUnlocked) {
    savingsUnlocked = false;
    updateSavingsUI();
    return;
  }
  $("savingsPinInput").value = "";
  $("savingsPinError").textContent = "";
  $("savingsPinModal").classList.remove("hidden");
  setTimeout(() => $("savingsPinInput")?.focus(), 100);
}
function closeSavingsPin() { $("savingsPinModal")?.classList.add("hidden"); }

function verifySavingsPIN() {
  const pin = $("savingsPinInput")?.value.trim();
  if (pin === SAVINGS_PIN) {
    savingsUnlocked = true;
    closeSavingsPin();
    updateSavingsUI();
    return;
  }
  $("savingsPinError").textContent = "Incorrect savings PIN.";
}

function renderSavingsChart() {
  const wrap = $("savingsChartWrap");
  const empty = $("savingsChartEmpty");
  if (!wrap) return;

  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: monthKey(d),
      label: d.toLocaleString("en-BD", { month: "short" })
    });
  }

  const totals = {};
  months.forEach(m => totals[m.key] = 0);
  savings.forEach(item => {
    const d = new Date(item.createdAt);
    if (isNaN(d.getTime())) return;
    const k = monthKey(d);
    if (k in totals) totals[k] += Number(item.amount) || 0;
  });

  wrap.innerHTML = "";
  const hasData = months.some(m => totals[m.key] > 0);
  if (!hasData) {
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";

  const max = Math.max(...months.map(m => totals[m.key])) || 1;
  months.forEach(m => {
    const value = totals[m.key];
    const pct = (value / max) * 100;
    const row = document.createElement("div");
    row.className = "chart-row";
    row.innerHTML = `
      <div class="chart-label">${escapeHTML(m.label)}</div>
      <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${pct}%"></div></div>
      <div class="chart-value">${savingsUnlocked ? formatMoney(value) : "৳ • •"}</div>
    `;
    wrap.appendChild(row);
  });
}

/* =========================================
   SPENDING TRENDS + DATE HISTORY
========================================= */
function getDailyTotals() {
  const totals = {};
  expenses.forEach(exp => {
    const raw = exp.createdAt || exp.date || exp.timestamp;
    if (!raw) return;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return;
    const k = dateKey(d);
    totals[k] = (totals[k] || 0) + (Number(exp.amount) || 0);
  });
  return totals;
}

function getLastDays(count) {
  const days = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    days.push({ key: dateKey(d), date: d });
  }
  return days;
}

function renderSpendingTrends() {
  const wrap = $("trendWrap");
  const empty = $("trendEmpty");
  if (!wrap) return;

  const totals = getDailyTotals();
  const days = getLastDays(7);
  const hasData = days.some(d => totals[d.key] > 0);
  wrap.innerHTML = "";

  if (!hasData) {
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";

  const max = Math.max(...days.map(d => totals[d.key] || 0)) || 1;
  let prev = null;

  days.forEach(day => {
    const value = totals[day.key] || 0;
    const pct = (value / max) * 100;
    const higher = prev !== null && value > prev;
    const row = document.createElement("div");
    row.className = "trend-row";
    const shortDate = day.date.toLocaleDateString("en-BD", { weekday: "short", day: "2-digit", month: "short" });

    let arrow = "";
    if (prev !== null) {
      if (value > prev) arrow = '<span class="trend-arrow">▲</span>';
      else if (value < prev) arrow = '<span class="trend-arrow">▼</span>';
      else arrow = '<span class="trend-arrow">—</span>';
    }

    row.innerHTML = `
      <div class="trend-date">${escapeHTML(shortDate)}</div>
      <div class="trend-bar-track"><div class="trend-bar ${higher ? "higher" : ""}" style="width:${pct}%"></div></div>
      <div class="trend-value">${formatMoney(value)} ${arrow}</div>
    `;
    wrap.appendChild(row);
    prev = value;
  });
}

function renderDateHistory() {
  const wrap = $("dateHistoryWrap");
  const empty = $("dateHistoryEmpty");
  if (!wrap) return;

  const totals = getDailyTotals();
  const counts = {};
  expenses.forEach(exp => {
    const raw = exp.createdAt || exp.date || exp.timestamp;
    if (!raw) return;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return;
    const k = dateKey(d);
    counts[k] = (counts[k] || 0) + 1;
  });

  const entries = Object.entries(totals).sort((a, b) => b[0].localeCompare(a[0]));
  wrap.innerHTML = "";

  if (entries.length === 0) {
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";

  entries.forEach(([k, total]) => {
    const d = new Date(k + "T00:00:00");
    const count = counts[k] || 0;
    const item = document.createElement("div");
    item.className = "date-history-item";
    item.innerHTML = `
      <div>
        <div class="date-history-date">${escapeHTML(formatDay(d.toISOString()))}</div>
        <div class="date-history-count">${count} ${count === 1 ? "expense" : "expenses"}</div>
      </div>
      <div class="date-history-total">${formatMoney(total)}</div>
    `;
    wrap.appendChild(item);
  });
}

/* =========================================
   V5 MONEY IN/OUT
========================================= */
function renderV5Money() {
  const list = $("moneyList");
  const empty = $("moneyEmpty");
  const count = $("moneyCount");
  if (!list) return;

  const sorted = [...v5Money].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (count) count.textContent = sorted.length + " entries";
  list.innerHTML = "";
  if (empty) empty.classList.toggle("hidden", sorted.length > 0);

  sorted.forEach(x => {
    const el = document.createElement("div");
    el.className = "v5-item " + x.type;
    const dateStr = new Date(x.date).toLocaleString("en-BD", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
    el.innerHTML = `
      <div>
        <strong>${x.type === "in" ? "＋" : "−"} ${escapeHTML(x.category)}</strong>
        <small>${escapeHTML(x.note || "")} · ${dateStr}</small>
      </div>
      <b>${x.type === "in" ? "+" : "−"}${formatMoney(x.amount).slice(1)}</b>
    `;
    list.appendChild(el);
  });
}

function setupMoneyForm() {
  const form = $("moneyForm");
  const cat = $("moneyCategory");
  const submit = $("moneySubmit");
  if (!form || !cat) return;

  const cats = {
    in: ["Salary", "Convance", "Carton", "Extra", "Others"],
    out: ["Dhar", "Others"]
  };

  const setMode = (mode) => {
    currentMoneyMode = mode;
    $("moneyInTab")?.classList.toggle("active", mode === "in");
    $("moneyOutTab")?.classList.toggle("active", mode === "out");
    cat.innerHTML = cats[mode].map(x => `<option>${x}</option>`).join("");
    if (submit) submit.textContent = mode === "in" ? "＋ Add Money" : "− Money Out";
  };

  $("moneyInTab")?.addEventListener("click", () => setMode("in"));
  $("moneyOutTab")?.addEventListener("click", () => setMode("out"));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const amount = Number($("moneyAmount")?.value);
    if (!amount) return;
    v5Money.push({
      id: Date.now().toString() + Math.random().toString(16).slice(2),
      type: currentMoneyMode,
      amount,
      category: cat.value,
      note: ($("moneyNote")?.value || "").trim(),
      date: new Date().toISOString()
    });
    saveV5Money();
    form.reset();
    setMode(currentMoneyMode);
    renderV5Money();
    renderV5Finance();
    updateDashboard();
  });

  setMode("in");
}

/* =========================================
   V5 FINANCE
========================================= */
function v5MonthLabel(d) {
  return d.toLocaleDateString("en-BD", { month: "long", year: "numeric" });
}
function v5MonthKeyDate(d) {
  return d.getFullYear() + "-" + pad(d.getMonth() + 1);
}
function v5SameMonth(value, d) {
  const x = new Date(value);
  if (isNaN(x.getTime())) return false;
  return monthKey(x) === v5MonthKeyDate(d);
}
function v5ExpenseDate(exp) {
  return exp?.createdAt || exp?.date || exp?.timestamp || null;
}

function aggregatePeople() {
  const map = {};
  v5People.forEach(x => {
    const k = x.name.trim().toLowerCase();
    if (!map[k]) map[k] = { name: x.name, balance: 0 };
    map[k].balance += x.direction === "receive" ? Number(x.amount) : -Number(x.amount);
  });
  return Object.values(map).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
}

function renderV5Finance() {
  const label = $("financeMonth");
  if (!label) return;
  label.textContent = v5MonthLabel(v5FinanceDate);

  const income = v5Money.filter(x => x.type === "in" && v5SameMonth(x.date, v5FinanceDate))
    .reduce((s, x) => s + Number(x.amount), 0);
  const out = v5Money.filter(x => x.type === "out" && v5SameMonth(x.date, v5FinanceDate))
    .reduce((s, x) => s + Number(x.amount), 0);
  const exp = expenses.filter(x => v5SameMonth(v5ExpenseDate(x), v5FinanceDate))
    .reduce((s, x) => s + (Number(x.amount) || 0), 0);

  $("financeIncome").textContent = formatMoney(income);
  $("financeExpense").textContent = formatMoney(exp);
  $("financeOut").textContent = formatMoney(out);
  $("financeBalance").textContent = formatMoney(income - exp - out);

  const box = $("financePeople");
  const empty = $("financePeopleEmpty");
  if (!box) return;
  box.innerHTML = "";
  const arr = aggregatePeople();
  if (empty) empty.classList.toggle("hidden", arr.length > 0);

  arr.forEach(p => {
    const el = document.createElement("div");
    el.className = "v5-item person " + (p.balance >= 0 ? "receive" : "pay");
    el.innerHTML = `
      <div>
        <strong>${escapeHTML(p.name)}</strong>
        <small>${p.balance >= 0 ? "🟢 I will get" : "🔴 I will pay"}</small>
      </div>
      <b>${formatMoney(Math.abs(p.balance))}</b>
    `;
    box.appendChild(el);
  });
}

function setupFinance() {
  $("financePrev")?.addEventListener("click", () => {
    v5FinanceDate.setMonth(v5FinanceDate.getMonth() - 1);
    renderV5Finance();
  });
  $("financeNext")?.addEventListener("click", () => {
    v5FinanceDate.setMonth(v5FinanceDate.getMonth() + 1);
    renderV5Finance();
  });
}

/* =========================================
   V5 CALENDAR
========================================= */
function renderV5Calendar() {
  const title = $("calendarMonth");
  const grid = $("calendarGrid");
  if (!grid) return;

  title.textContent = v5MonthLabel(v5CalendarDate);
  grid.innerHTML = "";

  const y = v5CalendarDate.getFullYear();
  const m = v5CalendarDate.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();

  const totals = {};
  expenses.forEach(x => {
    const raw = v5ExpenseDate(x);
    if (!raw) return;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return;
    const k = dateKey(d);
    totals[k] = (totals[k] || 0) + (Number(x.amount) || 0);
  });

  for (let i = 0; i < first; i++) {
    const e = document.createElement("div");
    e.className = "calendar-day empty-day";
    grid.appendChild(e);
  }

  for (let day = 1; day <= days; day++) {
    const k = y + "-" + pad(m + 1) + "-" + pad(day);
    const total = totals[k] || 0;
    const btn = document.createElement("button");
    btn.className = "calendar-day" + (total ? " has-expense" : "");
    btn.innerHTML = `<span>${day}</span>${total ? `<small>${formatMoney(total)}</small>` : ""}`;
    btn.addEventListener("click", () => {
      const detail = $("calendarDetail");
      if (detail) {
        detail.innerHTML = `<strong>${new Date(y, m, day).toLocaleDateString("en-BD", {
          weekday: "long", day: "numeric", month: "long"
        })}</strong><br>${total ? "Spent " + formatMoney(total) : "No expense recorded."}`;
      }
    });
    grid.appendChild(btn);
  }
}

function setupCalendar() {
  $("calendarPrev")?.addEventListener("click", () => {
    v5CalendarDate.setMonth(v5CalendarDate.getMonth() - 1);
    renderV5Calendar();
  });
  $("calendarNext")?.addEventListener("click", () => {
    v5CalendarDate.setMonth(v5CalendarDate.getMonth() + 1);
    renderV5Calendar();
  });
}

/* =========================================
   V5 PEOPLE
========================================= */
function renderV5People() {
  const list = $("peopleList");
  const empty = $("peopleEmpty");
  if (!list) return;

  list.innerHTML = "";
  const arr = aggregatePeople();
  if (empty) empty.classList.toggle("hidden", arr.length > 0);

  arr.forEach(p => {
    const el = document.createElement("div");
    el.className = "v5-item person " + (p.balance >= 0 ? "receive" : "pay");
    el.innerHTML = `
      <div>
        <strong>${escapeHTML(p.name)}</strong>
        <small>${p.balance >= 0 ? "🟢 I will get" : "🔴 I will pay"}</small>
      </div>
      <div class="person-actions">
        <b>${formatMoney(Math.abs(p.balance))}</b>
        <button class="delete-v5" data-name="${escapeHTML(p.name)}">🗑️</button>
      </div>
    `;
    list.appendChild(el);
  });

  list.querySelectorAll(".delete-v5").forEach(btn => {
    btn.addEventListener("click", () => {
      const pin = prompt("Enter PIN to delete (default 2233):");
      if (pin === null) return;
      if (pin !== PEOPLE_PIN) { alert("Wrong PIN."); return; }
      const name = btn.dataset.name.toLowerCase();
      v5People = v5People.filter(x => x.name.trim().toLowerCase() !== name);
      saveV5People();
      renderV5People();
      renderV5Finance();
    });
  });
}

function setupPeopleForm() {
  const form = $("personForm");
  if (!form) return;

  const receive = $("personReceive");
  const pay = $("personPay");

  const setDir = (d) => {
    currentPersonDirection = d;
    receive?.classList.toggle("active", d === "receive");
    pay?.classList.toggle("active", d === "pay");
  };

  receive?.addEventListener("click", () => setDir("receive"));
  pay?.addEventListener("click", () => setDir("pay"));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = ($("personName")?.value || "").trim();
    const amount = Number($("personAmount")?.value);
    if (!name || !amount) return;

    v5People.push({
      id: Date.now().toString() + Math.random().toString(16).slice(2),
      name, amount,
      direction: currentPersonDirection,
      note: ($("personNote")?.value || "").trim(),
      date: new Date().toISOString()
    });
    saveV5People();
    form.reset();
    setDir("receive");
    renderV5People();
    renderV5Finance();
  });
}

/* =========================================
   V5 THEMES
========================================= */
const V5_THEMES = {
  midnight: {
    name: "🌙 Midnight",
    desc: "Premium dark glass",
    dark: true,
    vars: { "--bg-1": "#0a0a0f", "--bg-2": "#0f1418", "--green": "#22c55e", "--cyan": "#06b6d4" }
  },
  liquid: {
    name: "🧊 Liquid Glass",
    desc: "Cyan + green glass",
    dark: false,
    vars: { "--bg-1": "#eef5f3", "--bg-2": "#dcefeb", "--green": "#42a96c", "--cyan": "#16c9d5" }
  },
  neon: {
    name: "🌌 Neon Cyber",
    desc: "Blue + purple glow",
    dark: true,
    vars: { "--bg-1": "#101329", "--bg-2": "#090b16", "--green": "#b15cff", "--cyan": "#6c8cff" }
  },
  ocean: {
    name: "🌊 Ocean",
    desc: "Cool blue glass",
    dark: false,
    vars: { "--bg-1": "#e8f7ff", "--bg-2": "#d8eef4", "--green": "#39e0c2", "--cyan": "#20b8ff" }
  },
  aurora: {
    name: "💜 Aurora",
    desc: "Purple + cyan",
    dark: false,
    vars: { "--bg-1": "#f1edff", "--bg-2": "#e0f4f4", "--green": "#42d6d1", "--cyan": "#9b6cff" }
  },
  sunset: {
    name: "🔥 Sunset",
    desc: "Warm orange + pink",
    dark: false,
    vars: { "--bg-1": "#fff1e8", "--bg-2": "#f8e3ec", "--green": "#ff5fa2", "--cyan": "#ff8a4c" }
  },
  crystal: {
    name: "💎 Crystal",
    desc: "Clean icy glass",
    dark: false,
    vars: { "--bg-1": "#f4f8ff", "--bg-2": "#e4f1f5", "--green": "#72e5df", "--cyan": "#6aa7ff" }
  }
};

function applyV5Theme(key, persist = true) {
  const t = V5_THEMES[key] || V5_THEMES.midnight;
  document.body.classList.toggle("dark", !!t.dark);
  Object.entries(t.vars).forEach(([k, v]) => {
    document.documentElement.style.setProperty(k, v);
  });
  document.body.dataset.v5Theme = key;
  if (persist) {
    try {
      localStorage.setItem(V5_THEME_KEY, key);
      localStorage.setItem(THEME_KEY, t.dark ? "dark" : "light");
    } catch (e) {}
  }
  document.querySelectorAll(".theme-choice").forEach(x => {
    x.classList.toggle("selected", x.dataset.theme === key);
  });
}

function renderV5Themes() {
  const grid = $("themeGrid");
  if (!grid) return;
  grid.innerHTML = "";
  Object.entries(V5_THEMES).forEach(([key, t]) => {
    const b = document.createElement("button");
    b.className = "theme-choice";
    b.dataset.theme = key;
    b.innerHTML = `
      <div class="theme-preview" style="--preview:${t.vars["--cyan"]};--preview2:${t.vars["--green"]}"></div>
      <strong>${t.name}</strong>
      <small>${t.desc}</small>
    `;
    b.addEventListener("click", () => applyV5Theme(key));
    grid.appendChild(b);
  });

  const saved = localStorage.getItem(V5_THEME_KEY) || "midnight";
  document.querySelectorAll(".theme-choice").forEach(x => {
    x.classList.toggle("selected", x.dataset.theme === saved);
  });
}

/* =========================================
   EXPORT TXT
========================================= */
function exportTXT() {
  if (expenses.length === 0) { alert("There are no expenses to export."); return; }

  const sorted = [...expenses].sort((a, b) => {
    const da = new Date(a.createdAt || a.date);
    const db = new Date(b.createdAt || b.date);
    return da - db;
  });

  let txt = "==============================\n";
  txt += "          MyExpense\n";
  txt += "     Expense Report\n";
  txt += "==============================\n\n";

  let total = 0;
  sorted.forEach((exp, i) => {
    const amount = Number(exp.amount) || 0;
    total += amount;
    txt += `${i + 1}. ${exp.category}${exp.sub ? " - " + exp.sub : ""}\n`;
    txt += `Amount: ${formatMoney(amount)}\n`;
    txt += `Note: ${exp.note || "No note"}\n`;
    txt += `Date: ${formatDate(exp.createdAt || exp.date)}\n`;
    txt += "------------------------------\n";
  });

  txt += "\n";
  txt += `Total Expenses: ${formatMoney(total)}\n`;
  txt += `Total Entries: ${sorted.length}\n`;
  txt += `Exported: ${formatDate(new Date().toISOString())}\n`;

  downloadFile(txt, `MyExpense-${dateKey(new Date())}.txt`, "text/plain;charset=utf-8");
}

/* =========================================
   BACKUP
========================================= */
function backupAll() {
  if (expenses.length === 0 && savings.length === 0 && v5Money.length === 0 && v5People.length === 0) {
    alert("Nothing to backup yet.");
    return;
  }
  const data = {
    app: "MyExpense",
    version: 7,
    exportedAt: new Date().toISOString(),
    dailyBudget: getDailyBudget(),
    dailySavingsGoal: DAILY_GOAL,
    expenses,
    savings,
    money: v5Money,
    people: v5People
  };
  downloadFile(JSON.stringify(data, null, 2), `MyExpense-Backup-${dateKey(new Date())}.json`, "application/json");
}

/* =========================================
   SMART IMPORT (v1 / v2 / v3 / v5 / v6 / v7)
========================================= */
function smartImport(data) {
  if (!data || typeof data !== "object") throw new Error("Invalid file");

  let imported = { expenses: 0, savings: 0, money: 0, people: 0, budget: false };

  // === Expenses ===
  let expList = [];
  if (Array.isArray(data.expenses)) expList = data.expenses;
  else if (Array.isArray(data.transactions)) {
    // v1 style: transactions has type field
    expList = data.transactions.filter(t => t.type === "expense").map(t => ({
      id: t.id || Date.now().toString() + Math.random().toString(16).slice(2),
      amount: Number(t.amount) || 0,
      category: t.category || "Other",
      sub: t.sub || "",
      note: t.note || "",
      createdAt: t.date || t.createdAt || new Date().toISOString()
    }));
  }

  if (expList.length > 0) {
    expList = expList.map(e => ({
      id: e.id || Date.now().toString() + Math.random().toString(16).slice(2),
      amount: Number(e.amount) || 0,
      category: e.category || "Other",
      sub: e.sub || "",
      note: e.note || "",
      createdAt: e.createdAt || e.date || e.timestamp || new Date().toISOString()
    }));
    // Merge: existing + new (avoid duplicate ids)
    const existingIds = new Set(expenses.map(x => x.id));
    expList.forEach(x => { if (!existingIds.has(x.id)) expenses.push(x); });
    imported.expenses = expList.length;
  }

  // === Savings ===
  let savList = [];
  if (Array.isArray(data.savings)) savList = data.savings;
  if (savList.length > 0) {
    const existingIds = new Set(savings.map(x => x.id));
    savList.forEach(s => {
      if (!existingIds.has(s.id)) {
        savings.push({
          id: s.id || Date.now().toString() + Math.random().toString(16).slice(2),
          amount: Number(s.amount) || 0,
          note: s.note || "",
          createdAt: s.createdAt || new Date().toISOString()
        });
      }
    });
    imported.savings = savList.length;
  }

  // === Money (v5/v6/v7) ===
  const moneyList = data.money || data.v5Money || [];
  if (Array.isArray(moneyList) && moneyList.length > 0) {
    const existingIds = new Set(v5Money.map(x => x.id));
    moneyList.forEach(m => {
      if (!existingIds.has(m.id)) {
        v5Money.push({
          id: m.id || Date.now().toString() + Math.random().toString(16).slice(2),
          type: m.type === "out" ? "out" : "in",
          amount: Number(m.amount) || 0,
          category: m.category || "Others",
          note: m.note || "",
          date: m.date || new Date().toISOString()
        });
      }
    });
    imported.money = moneyList.length;
  }

  // === People (v5/v6/v7) ===
  const peopleList = data.people || data.v5People || [];
  if (Array.isArray(peopleList) && peopleList.length > 0) {
    const existingIds = new Set(v5People.map(x => x.id));
    peopleList.forEach(p => {
      if (!existingIds.has(p.id)) {
        v5People.push({
          id: p.id || Date.now().toString() + Math.random().toString(16).slice(2),
          name: p.name || "Unknown",
          amount: Number(p.amount) || 0,
          direction: p.direction === "pay" ? "pay" : "receive",
          note: p.note || "",
          date: p.date || new Date().toISOString()
        });
      }
    });
    imported.people = peopleList.length;
  }

  // === Budget ===
  if (typeof data.dailyBudget === "number" && data.dailyBudget > 0) {
    saveDailyBudget(data.dailyBudget);
    imported.budget = true;
  }

  // === Daily savings goal ===
  if (typeof data.dailySavingsGoal === "number" && data.dailySavingsGoal > 0) {
    saveDailySavingsGoal(data.dailySavingsGoal);
  }

  // Save all
  saveExpenses();
  saveSavings();
  saveV5Money();
  saveV5People();

  // Re-render
  updateDashboard();
  renderExpenses();
  renderCategoryChart();
  updateSavingsUI();
  renderSpendingTrends();
  renderDateHistory();
  renderV5Money();
  renderV5People();
  renderV5Finance();
  renderV5Calendar();
  updateBudgetUI();

  return imported;
}

/* =========================================
   BACKUP / RESTORE / RESET
========================================= */
function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function setupBackup() {
  $("exportBtn")?.addEventListener("click", exportTXT);
  $("backupBtn")?.addEventListener("click", backupAll);

  $("restoreBtn")?.addEventListener("click", () => $("restoreInput")?.click());

  $("restoreInput")?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const confirmed = confirm("Import will merge with current data. Continue?");
        if (!confirmed) return;
        const result = smartImport(data);
        alert(
          `Import successful! ✅\n\n` +
          `Expenses: ${result.expenses}\n` +
          `Savings: ${result.savings}\n` +
          `Money: ${result.money}\n` +
          `People: ${result.people}\n` +
          `Budget: ${result.budget ? "Yes" : "No"}`
        );
      } catch (err) {
        console.error(err);
        alert("Could not read this backup file.\n\n" + err.message);
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  });

  $("resetBtn")?.addEventListener("click", openPinModal);
}

/* =========================================
   RESET SECURITY
========================================= */
function openPinModal() {
  $("pinInput").value = "";
  $("pinError").textContent = "";
  $("pinModal").classList.remove("hidden");
  setTimeout(() => $("pinInput")?.focus(), 100);
}
function closePinModal() { $("pinModal")?.classList.add("hidden"); }
function closeConfirmModal() { $("confirmModal")?.classList.add("hidden"); }

function verifyPIN() {
  const now = Date.now();
  if (now < lockedUntil) {
    const sec = Math.ceil((lockedUntil - now) / 1000);
    $("pinError").textContent = `Too many attempts. Try again in ${sec}s.`;
    return;
  }
  const pin = $("pinInput")?.value.trim();
  if (pin === RESET_PIN) {
    resetAttempts = 0;
    lockedUntil = 0;
    closePinModal();
    $("confirmModal").classList.remove("hidden");
    return;
  }
  resetAttempts++;
  if (resetAttempts >= MAX_ATTEMPTS) {
    lockedUntil = Date.now() + LOCK_TIME;
    resetAttempts = 0;
    $("pinError").textContent = "3 wrong attempts. Locked for 60 seconds.";
    return;
  }
  const remaining = MAX_ATTEMPTS - resetAttempts;
  $("pinError").textContent = `Wrong PIN. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`;
}

function doResetAll() {
  expenses = [];
  savings = [];
  v5Money = [];
  v5People = [];
  saveExpenses();
  saveSavings();
  saveV5Money();
  saveV5People();
  saveDailyBudget(0);

  savingsUnlocked = false;
  activeFilter = "All";
  showAllExpenses = false;

  document.querySelectorAll(".filter-chip").forEach(b => {
    b.classList.toggle("active", b.dataset.filter === "All");
  });
  const si = $("searchInput");
  if (si) si.value = "";
  const dbi = $("dailyBudgetInput");
  if (dbi) dbi.value = "";

  updateDashboard();
  renderExpenses();
  renderCategoryChart();
  updateSavingsUI();
  renderSpendingTrends();
  renderDateHistory();
  renderV5Money();
  renderV5People();
  renderV5Finance();
  renderV5Calendar();
  updateBudgetUI();

  closeConfirmModal();
  alert("All data has been deleted.");
}

/* =========================================
   SIDE MENU
========================================= */
function setupSideMenu() {
  const side = $("sideMenu");
  const overlay = $("sideOverlay");
  if (!side || !overlay) return;

  const close = () => {
    side.classList.remove("open");
    overlay.classList.add("hidden");
  };

  $("sideMenuBtn")?.addEventListener("click", () => {
    side.classList.add("open");
    overlay.classList.remove("hidden");
  });
  $("sideClose")?.addEventListener("click", close);
  overlay.addEventListener("click", close);

  document.querySelectorAll(".side-item").forEach(b => {
    b.addEventListener("click", () => {
      showPage(b.dataset.page);
      close();
    });
  });
}

/* =========================================
   NAV / QUICK / THEME
========================================= */
function setupNav() {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => showPage(btn.dataset.page));
  });
  document.querySelectorAll(".quick-btn").forEach(btn => {
    btn.addEventListener("click", () => showPage(btn.dataset.page));
  });
  $("themeBtn")?.addEventListener("click", toggleTheme);
}

/* =========================================
   SERVICE WORKER
========================================= */
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }
}

/* =========================================
   INIT
========================================= */
function initApp() {
  loadExpenses();
  loadSavings();
  loadV5Money();
  loadV5People();
  loadDailySavingsGoal();

  loadTheme();

  setupNav();
  setupSideMenu();
  setupExpenseForm();
  setupSearchFilter();
  setupBudget();
  setupBackup();
  setupMoneyForm();
  setupFinance();
  setupCalendar();
  setupPeopleForm();

  // Savings buttons
  $("addSavingsBtn")?.addEventListener("click", openSavingsModal);
  $("cancelSavingsBtn")?.addEventListener("click", closeSavingsModal);
  $("confirmSavingsBtn")?.addEventListener("click", addSavings);
  $("savingsAmount")?.addEventListener("keydown", (e) => { if (e.key === "Enter") addSavings(); });
  $("pandaBtn")?.addEventListener("click", openSavingsPin);
  $("toggleSavingsBtn")?.addEventListener("click", openSavingsPin);
  $("cancelSavingsPinBtn")?.addEventListener("click", closeSavingsPin);
  $("verifySavingsPinBtn")?.addEventListener("click", verifySavingsPIN);
  $("savingsPinInput")?.addEventListener("keydown", (e) => { if (e.key === "Enter") verifySavingsPIN(); });

  $("editDailyGoalBtn")?.addEventListener("click", () => {
    const entered = prompt("Set your daily savings goal (৳):", String(DAILY_GOAL));
    if (entered === null) return;
    const value = Number(entered);
    if (!Number.isFinite(value) || value <= 0) {
      alert("Please enter a goal greater than ৳0.");
      return;
    }
    saveDailySavingsGoal(value);
    updateSavingsUI();
  });

  // Modals
  $("cancelPinBtn")?.addEventListener("click", closePinModal);
  $("verifyPinBtn")?.addEventListener("click", verifyPIN);
  $("pinInput")?.addEventListener("keydown", (e) => { if (e.key === "Enter") verifyPIN(); });
  $("cancelConfirmBtn")?.addEventListener("click", closeConfirmModal);
  $("confirmResetBtn")?.addEventListener("click", doResetAll);

  // Modal backdrop close
  ["pinModal", "confirmModal", "savingsModal", "savingsPinModal"].forEach(id => {
    $(id)?.addEventListener("click", (e) => {
      if (e.target.id === id) {
        if (id === "pinModal") closePinModal();
        if (id === "confirmModal") closeConfirmModal();
        if (id === "savingsModal") closeSavingsModal();
        if (id === "savingsPinModal") closeSavingsPin();
      }
    });
  });

  // First render
  updateDashboard();
  renderExpenses();
  renderCategoryChart();
  updateSavingsUI();
  renderSpendingTrends();
  renderDateHistory();
  renderV5Money();
  renderV5People();
  renderV5Finance();
  renderV5Calendar();
  renderV5Themes();
  updateBudgetUI();

  registerServiceWorker();
}

initApp();