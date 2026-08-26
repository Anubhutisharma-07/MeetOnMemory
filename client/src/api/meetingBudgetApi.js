import api from "../services/index.js";

export const getBudgets = (params) => api.get("/api/meeting-budgets", { params });
export const getBudget = (id) => api.get(`/api/meeting-budgets/${id}`);
export const createBudget = (data) => api.post("/api/meeting-budgets", data);
export const updateBudget = (id, data) => api.put(`/api/meeting-budgets/${id}`, data);
export const deleteBudget = (id) => api.delete(`/api/meeting-budgets/${id}`);
export const addExpense = (budgetId, data) => api.post(`/api/meeting-budgets/${budgetId}/expenses`, data);
export const updateExpense = (budgetId, expenseId, data) => api.put(`/api/meeting-budgets/${budgetId}/expenses/${expenseId}`, data);
export const deleteExpense = (budgetId, expenseId) => api.delete(`/api/meeting-budgets/${budgetId}/expenses/${expenseId}`);
export const getBudgetAnalytics = () => api.get("/api/meeting-budgets/analytics");
