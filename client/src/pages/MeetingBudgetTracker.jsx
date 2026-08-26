import React, { useState, useMemo, useCallback } from "react";
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock,
  Plus, Search, Filter, Edit3, Trash2, X, Calendar, BarChart3, Target,
  Wallet, Receipt, ArrowUpRight, ArrowDownRight, RefreshCw, Eye, EyeOff,
  Tag, Users, Building, Zap, Lightbulb, Download, ChevronDown, ChevronRight,
  CreditCard, PiggyBank, Banknote, Calculator, Bell, Share2, Bookmark,
} from "lucide-react";

const CATEGORIES = [
  { id: "venue", label: "Venue", icon: "🏢", color: "text-blue-400 bg-blue-500/20" },
  { id: "catering", label: "Catering", icon: "🍽️", color: "text-emerald-400 bg-emerald-500/20" },
  { id: "technology", label: "Technology", icon: "💻", color: "text-purple-400 bg-purple-500/20" },
  { id: "travel", label: "Travel", icon: "✈️", color: "text-amber-400 bg-amber-500/20" },
  { id: "materials", label: "Materials", icon: "📋", color: "text-cyan-400 bg-cyan-500/20" },
  { id: "speakers", label: "Speakers", icon: "🎤", color: "text-pink-400 bg-pink-500/20" },
  { id: "marketing", label: "Marketing", icon: "📢", color: "text-orange-400 bg-orange-500/20" },
  { id: "other", label: "Other", icon: "📦", color: "text-gray-400 bg-gray-500/20" },
];

const STATUS_COLORS = {
  active: "text-emerald-400 bg-emerald-500/20", paused: "text-amber-400 bg-amber-500/20",
  completed: "text-blue-400 bg-blue-500/20", overbudget: "text-red-400 bg-red-500/20",
};

const EXPENSE_STATUS = {
  pending: "text-amber-400 bg-amber-500/20", approved: "text-emerald-400 bg-emerald-500/20",
  rejected: "text-red-400 bg-red-500/20", paid: "text-blue-400 bg-blue-500/20",
};

const MOCK_BUDGETS = [
  { id: "b1", name: "Q3 Engineering Standups", description: "Weekly engineering sync meetings budget", totalBudget: 5000, spent: 3200, currency: "USD", period: "quarterly", startDate: "2026-07-01", endDate: "2026-09-30", category: "team", status: "active",
    expenses: [
      { _id: "e1", title: "Zoom Pro License", amount: 800, category: "technology", status: "paid", date: "2026-07-01", description: "Quarterly Zoom subscription" },
      { _id: "e2", title: "Whiteboard Software", amount: 400, category: "technology", status: "approved", date: "2026-07-15", description: "Miro team plan" },
      { _id: "e3", title: "Coffee & Snacks", amount: 600, category: "catering", status: "paid", date: "2026-08-01", description: "Monthly meeting refreshments" },
      { _id: "e4", title: "Projector Rental", amount: 300, category: "venue", status: "pending", date: "2026-08-15", description: "Monthly projector for presentations" },
      { _id: "e5", title: "Team Lunch", amount: 1100, category: "catering", status: "approved", date: "2026-08-20", description: "Monthly team bonding lunch" },
    ], tags: ["engineering", "weekly"], isActive: true, createdAt: "2026-07-01" },
  { id: "b2", name: "Annual Company Retreat", description: "Annual all-hands retreat meeting budget", totalBudget: 25000, spent: 18500, currency: "USD", period: "yearly", startDate: "2026-01-01", endDate: "2026-12-31", category: "organization", status: "active",
    expenses: [
      { _id: "e6", title: "Venue Booking", amount: 8000, category: "venue", status: "paid", date: "2026-03-01", description: "Convention center for 3 days" },
      { _id: "e7", title: "Catering (3 days)", amount: 4500, category: "catering", status: "paid", date: "2026-03-15", description: "Full board for 100 attendees" },
      { _id: "e8", title: "Keynote Speaker", amount: 3000, category: "speakers", status: "approved", date: "2026-04-01", description: "External keynote speaker fee" },
      { _id: "e9", title: "Travel Reimbursements", amount: 2000, category: "travel", status: "paid", date: "2026-04-15", description: "Flight and hotel for remote team" },
      { _id: "e10", title: "Marketing Materials", amount: 1000, category: "marketing", status: "pending", date: "2026-05-01", description: "Banners, swag, and promotional items" },
    ], tags: ["retreat", "annual"], isActive: true, createdAt: "2026-01-01" },
  { id: "b3", name: "Marketing Campaign Meetings", description: "Budget for marketing planning sessions", totalBudget: 3000, spent: 2850, currency: "USD", period: "monthly", startDate: "2026-08-01", endDate: "2026-08-31", category: "department", status: "overbudget",
    expenses: [
      { _id: "e11", title: "Video Conferencing", amount: 500, category: "technology", status: "paid", date: "2026-08-01" },
      { _id: "e12", title: "Presentation Design", amount: 800, category: "materials", status: "paid", date: "2026-08-05" },
      { _id: "e13", title: "Client Lunch Meeting", amount: 1200, category: "catering", status: "approved", date: "2026-08-10" },
      { _id: "e14", title: "Event Photography", amount: 350, category: "other", status: "pending", date: "2026-08-15" },
    ], tags: ["marketing", "monthly"], isActive: true, createdAt: "2026-08-01" },
  { id: "b4", name: "Product Launch Planning", description: "Budget for product launch meeting series", totalBudget: 8000, spent: 4200, currency: "USD", period: "quarterly", startDate: "2026-07-01", endDate: "2026-09-30", category: "project", status: "active",
    expenses: [
      { _id: "e15", title: "Conference Room Booking", amount: 1200, category: "venue", status: "paid", date: "2026-07-10" },
      { _id: "e16", title: "Demo Equipment", amount: 2000, category: "technology", status: "paid", date: "2026-07-20" },
      { _id: "e17", title: "Printed Materials", amount: 500, category: "materials", status: "approved", date: "2026-08-01" },
      { _id: "e18", title: "Stakeholder Dinner", amount: 500, category: "catering", status: "pending", date: "2026-08-25" },
    ], tags: ["product", "launch"], isActive: true, createdAt: "2026-07-01" },
];

const getCatConfig = (c) => CATEGORIES.find(cat => cat.id === c) || CATEGORIES[CATEGORIES.length - 1];

export default function MeetingBudgetTracker() {
  const [tab, setTab] = useState("overview");
  const [budgets, setBudgets] = useState(MOCK_BUDGETS);
  const [selBudget, setSelBudget] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(null);
  const [viewMode, setViewMode] = useState("grid");

  const filtered = useMemo(() => {
    let b = [...budgets];
    if (filterStatus !== "all") b = b.filter(x => x.status === filterStatus);
    if (search) { const q = search.toLowerCase(); b = b.filter(x => x.name.toLowerCase().includes(q) || x.description?.toLowerCase().includes(q)); }
    return b;
  }, [budgets, filterStatus, search]);

  const allExpenses = budgets.flatMap(b => b.expenses.map(e => ({ ...e, budgetName: b.name, budgetId: b.id })));
  const totalBudget = budgets.reduce((s, b) => s + b.totalBudget, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const pendingExpenses = allExpenses.filter(e => e.status === "pending").length;
  const overBudgetCount = budgets.filter(b => b.status === "overbudget").length;
  const utilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const dailyBurn = totalSpent / 30;

  const OverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Budget", value: `$${totalBudget.toLocaleString()}`, icon: <Wallet className="w-5 h-5" />, color: "text-cyan-400", sub: `${budgets.length} budgets` },
          { label: "Total Spent", value: `$${totalSpent.toLocaleString()}`, icon: <Receipt className="w-5 h-5" />, color: "text-amber-400", sub: `${utilization}% utilization` },
          { label: "Remaining", value: `$${(totalBudget - totalSpent).toLocaleString()}`, icon: <PiggyBank className="w-5 h-5" />, color: "text-emerald-400", sub: `${100 - utilization}% left` },
          { label: "Daily Burn Rate", value: `$${Math.round(dailyBurn)}`, icon: <Zap className="w-5 h-5" />, color: "text-purple-400", sub: "per day avg" },
        ].map((s, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
            <div className={`p-2 rounded-xl bg-white/5 ${s.color} mb-3 inline-block`}>{s.icon}</div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Utilization Bar */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-cyan-400" /> Budget Utilization</h3>
        <div className="h-6 bg-white/10 rounded-full overflow-hidden mb-2">
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(utilization, 100)}%`, backgroundColor: utilization > 90 ? "#ef4444" : utilization > 70 ? "#f59e0b" : "#10b981" }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>${totalSpent.toLocaleString()} spent</span>
          <span className={`font-bold ${utilization > 90 ? "text-red-400" : utilization > 70 ? "text-amber-400" : "text-emerald-400"}`}>{utilization}%</span>
          <span>${totalBudget.toLocaleString()} total</span>
        </div>
      </div>

      {/* Budget Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">All Budgets</h3>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white text-sm font-medium transition-all"><Plus className="w-4 h-4" /> New Budget</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(b => {
            const pct = Math.round((b.spent / b.totalBudget) * 100);
            const catItems = {};
            b.expenses.forEach(e => { catItems[e.category] = (catItems[e.category] || 0) + e.amount; });
            return (
              <div key={b.id} onClick={() => setSelBudget(selBudget === b.id ? null : b.id)} className={`bg-white/5 backdrop-blur-md border rounded-2xl p-5 cursor-pointer transition-all ${selBudget === b.id ? "border-cyan-500/50 ring-1 ring-cyan-500/30" : "border-white/10 hover:border-white/20"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-white font-semibold">{b.name}</div>
                    <div className="text-gray-500 text-[10px]">{b.description}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${STATUS_COLORS[b.status]}`}>{b.status}</span>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <div className="text-2xl font-bold text-white">${b.spent.toLocaleString()} <span className="text-sm font-normal text-gray-500">/ ${b.totalBudget.toLocaleString()}</span></div>
                  <span className={`text-sm font-bold ${pct > 90 ? "text-red-400" : pct > 70 ? "text-amber-400" : "text-emerald-400"}`}>{pct}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#10b981" }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{b.period}</span>
                  <span className="flex items-center gap-1"><Receipt className="w-3 h-3" />{b.expenses.length} expenses</span>
                  <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{b.category}</span>
                </div>
                {selBudget === b.id && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                    {b.expenses.slice(0, 3).map(e => {
                      const cat = getCatConfig(e.category);
                      return (
                        <div key={e._id} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                          <span className="text-sm">{cat.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-xs truncate">{e.title}</div>
                            <div className="text-gray-500 text-[9px]">{e.date} · {e.category}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-white text-xs font-medium">${e.amount}</div>
                            <span className={`text-[9px] ${EXPENSE_STATUS[e.status]}`}>{e.status}</span>
                          </div>
                        </div>
                      );
                    })}
                    {b.expenses.length > 3 && <div className="text-center text-[10px] text-gray-500">+{b.expenses.length - 3} more expenses</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Insights */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-amber-400" /> 💡 Budget Insights</h3>
        <div className="space-y-2">
          <div className="text-sm text-gray-300 bg-white/5 rounded-xl p-3">📊 Your overall utilization is {utilization}% — {utilization > 80 ? "review spending carefully" : "healthy budget management"}</div>
          <div className="text-sm text-gray-300 bg-white/5 rounded-xl p-3">💰 Daily burn rate: ${Math.round(dailyBurn)}/day — projected monthly spend: ${Math.round(dailyBurn * 30).toLocaleString()}</div>
          <div className="text-sm text-gray-300 bg-white/5 rounded-xl p-3">⚠️ {overBudgetCount} budget{overBudgetCount !== 1 ? "s" : ""} over budget — {pendingExpenses} expense{pendingExpenses !== 1 ? "s" : ""} pending approval</div>
        </div>
      </div>
    </div>
  );

  const ExpensesTab = () => {
    const sorted = [...allExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search expenses..." className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm w-56 focus:outline-none focus:border-cyan-500/50" /></div>
          <span className="text-gray-400 text-sm">{allExpenses.length} expenses</span>
        </div>
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_100px_100px_100px_80px] gap-4 px-5 py-3 border-b border-white/10 text-[10px] text-gray-500 uppercase tracking-wider">
            <span>Expense</span><span className="text-right">Amount</span><span className="text-center">Category</span><span className="text-center">Status</span><span className="text-right">Date</span>
          </div>
          {sorted.map((e, i) => {
            const cat = getCatConfig(e.category);
            return (
              <div key={e._id || i} className="grid grid-cols-[1fr_100px_100px_100px_80px] gap-4 px-5 py-3 items-center border-b border-white/5 hover:bg-white/5 transition-all">
                <div>
                  <div className="text-white text-sm font-medium">{e.title}</div>
                  <div className="text-gray-500 text-[10px]">{e.budgetName}</div>
                </div>
                <div className="text-right text-white text-sm font-medium">${e.amount.toLocaleString()}</div>
                <div className="text-center"><span className={`px-2 py-0.5 rounded text-[9px] ${cat.color}`}>{cat.icon} {cat.label}</span></div>
                <div className="text-center"><span className={`px-2 py-0.5 rounded text-[9px] ${EXPENSE_STATUS[e.status]}`}>{e.status}</span></div>
                <div className="text-right text-gray-400 text-[10px]">{e.date}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const AnalyticsTab = () => {
    const catTotals = {};
    allExpenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
    const maxCat = Math.max(...Object.values(catTotals));
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Pending Approval", value: pendingExpenses, icon: <Clock className="w-5 h-5" />, color: "text-amber-400" },
            { label: "Approved Total", value: `$${allExpenses.filter(e => e.status === "approved").reduce((s, e) => s + e.amount, 0).toLocaleString()}`, icon: <CheckCircle className="w-5 h-5" />, color: "text-emerald-400" },
            { label: "Paid Total", value: `$${allExpenses.filter(e => e.status === "paid").reduce((s, e) => s + e.amount, 0).toLocaleString()}`, icon: <CreditCard className="w-5 h-5" />, color: "text-blue-400" },
            { label: "Avg Expense", value: `$${Math.round(allExpenses.reduce((s, e) => s + e.amount, 0) / Math.max(allExpenses.length, 1))}`, icon: <Calculator className="w-5 h-5" />, color: "text-purple-400" },
          ].map((s, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
              <div className={`p-2 rounded-xl bg-white/5 ${s.color} mb-2 inline-block`}>{s.icon}</div>
              <div className="text-xl font-bold text-white">{s.value}</div>
              <div className="text-gray-400 text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Spending by Category</h3>
          <div className="space-y-3">
            {Object.entries(catTotals).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => {
              const cfg = getCatConfig(cat);
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300">{cfg.icon} {cfg.label}</span>
                    <span className="text-gray-400">${amount.toLocaleString()}</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${(amount / maxCat) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Budget Comparison</h3>
          <div className="space-y-4">
            {budgets.map(b => (
              <div key={b.id} className="flex items-center gap-4">
                <div className="w-36 text-xs text-gray-300 truncate">{b.name}</div>
                <div className="flex-1 relative h-6">
                  <div className="absolute inset-y-0 bg-white/5 rounded-lg" style={{ left: `${(b.spent / b.totalBudget) * 100}%`, right: 0 }} />
                  <div className="absolute inset-y-0 rounded-lg" style={{ width: `${Math.min((b.spent / b.totalBudget) * 100, 100)}%`, backgroundColor: b.spent > b.totalBudget ? "#ef4444" : b.spent > b.totalBudget * 0.7 ? "#f59e0b" : "#10b981" }} />
                </div>
                <div className="w-20 text-right text-[10px] text-gray-400">${b.spent.toLocaleString()} / ${b.totalBudget.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-3">💡 Financial Insights</h3>
          <div className="space-y-2">
            <div className="text-sm text-gray-300 bg-white/5 rounded-xl p-3">📈 Catering is your highest expense category — consider bulk ordering for savings</div>
            <div className="text-sm text-gray-300 bg-white/5 rounded-xl p-3">⏰ {pendingExpenses} expenses pending review — approve to keep budgets on track</div>
            <div className="text-sm text-gray-300 bg-white/5 rounded-xl p-3">🎯 Forecast: ${Math.round(totalSpent * 1.1).toLocaleString()} projected spend by month end (+10% buffer)</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-gray-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-cyan-600/20 to-purple-600/20" />
        <div className="relative px-6 py-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Wallet className="w-8 h-8 text-emerald-400" />Meeting Budget Tracker</h1>
          <p className="text-gray-400 mt-2">{budgets.length} budgets · ${totalBudget.toLocaleString()} total · ${totalSpent.toLocaleString()} spent · {utilization}% utilization</p>
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2">
            {[
              { id: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
              { id: "expenses", label: "Expenses", icon: <Receipt className="w-4 h-4" />, count: allExpenses.length },
              { id: "analytics", label: "Analytics", icon: <TrendingUp className="w-4 h-4" /> },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${tab === t.id ? "bg-white/10 text-white border border-white/20 shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                {t.icon}{t.label}{t.count !== undefined && <span className="text-xs opacity-60">({t.count})</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {tab === "overview" && <OverviewTab />}
        {tab === "expenses" && <ExpensesTab />}
        {tab === "analytics" && <AnalyticsTab />}
      </div>
    </div>
  );
}
