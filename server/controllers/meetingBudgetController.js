import MeetingBudget from "../models/meetingBudgetModel.js";

// Get all budgets for a user
export const getBudgets = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { status, category, search } = req.query;
    const filter = { userId };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: "i" };
    const budgets = await MeetingBudget.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: budgets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get a single budget
export const getBudget = async (req, res) => {
  try {
    const budget = await MeetingBudget.findOne({ _id: req.params.id, userId: req.auth.userId });
    if (!budget) return res.status(404).json({ success: false, error: "Budget not found" });
    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create a new budget
export const createBudget = async (req, res) => {
  try {
    const { userId } = req.auth;
    const budget = new MeetingBudget({ ...req.body, userId });
    await budget.save();
    res.status(201).json({ success: true, data: budget });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update a budget
export const updateBudget = async (req, res) => {
  try {
    const budget = await MeetingBudget.findOneAndUpdate(
      { _id: req.params.id, userId: req.auth.userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!budget) return res.status(404).json({ success: false, error: "Budget not found" });
    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete a budget
export const deleteBudget = async (req, res) => {
  try {
    const budget = await MeetingBudget.findOneAndDelete({ _id: req.params.id, userId: req.auth.userId });
    if (!budget) return res.status(404).json({ success: false, error: "Budget not found" });
    res.json({ success: true, message: "Budget deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add an expense to a budget
export const addExpense = async (req, res) => {
  try {
    const budget = await MeetingBudget.findOne({ _id: req.params.id, userId: req.auth.userId });
    if (!budget) return res.status(404).json({ success: false, error: "Budget not found" });
    budget.expenses.push(req.body);
    budget.spent = budget.expenses.reduce((sum, e) => sum + (e.status !== "rejected" ? e.amount : 0), 0);
    if (budget.spent >= budget.totalBudget) budget.status = "overbudget";
    await budget.save();
    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update expense status
export const updateExpense = async (req, res) => {
  try {
    const budget = await MeetingBudget.findOne({ _id: req.params.id, userId: req.auth.userId });
    if (!budget) return res.status(404).json({ success: false, error: "Budget not found" });
    const expense = budget.expenses.id(req.params.expenseId);
    if (!expense) return res.status(404).json({ success: false, error: "Expense not found" });
    Object.assign(expense, req.body);
    budget.spent = budget.expenses.reduce((sum, e) => sum + (e.status !== "rejected" ? e.amount : 0), 0);
    await budget.save();
    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete an expense
export const deleteExpense = async (req, res) => {
  try {
    const budget = await MeetingBudget.findOne({ _id: req.params.id, userId: req.auth.userId });
    if (!budget) return res.status(404).json({ success: false, error: "Budget not found" });
    budget.expenses = budget.expenses.filter(e => e._id.toString() !== req.params.expenseId);
    budget.spent = budget.expenses.reduce((sum, e) => sum + (e.status !== "rejected" ? e.amount : 0), 0);
    await budget.save();
    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get budget analytics
export const getBudgetAnalytics = async (req, res) => {
  try {
    const { userId } = req.auth;
    const budgets = await MeetingBudget.find({ userId });
    const totalBudget = budgets.reduce((s, b) => s + b.totalBudget, 0);
    const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
    const activeBudgets = budgets.filter(b => b.status === "active").length;
    const overBudget = budgets.filter(b => b.status === "overbudget").length;
    const allExpenses = budgets.flatMap(b => b.expenses);
    const categoryBreakdown = {};
    allExpenses.forEach(e => { categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount; });
    const monthlySpending = {};
    allExpenses.forEach(e => {
      const month = new Date(e.date).toISOString().slice(0, 7);
      monthlySpending[month] = (monthlySpending[month] || 0) + e.amount;
    });
    res.json({
      success: true,
      data: { totalBudget, totalSpent, remaining: totalBudget - totalSpent, utilization: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0, activeBudgets, overBudget, totalBudgets: budgets.length, categoryBreakdown, monthlySpending, dailyBurnRate: totalSpent / Math.max(1, allExpenses.length), forecast: totalSpent * 1.1 },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
