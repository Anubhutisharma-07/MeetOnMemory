import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { getBudgets, getBudget, createBudget, updateBudget, deleteBudget, addExpense, updateExpense, deleteExpense, getBudgetAnalytics } from "../controllers/meetingBudgetController.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", getBudgets);
router.get("/analytics", getBudgetAnalytics);
router.get("/:id", getBudget);
router.post("/", createBudget);
router.put("/:id", updateBudget);
router.delete("/:id", deleteBudget);
router.post("/:id/expenses", addExpense);
router.put("/:id/expenses/:expenseId", updateExpense);
router.delete("/:id/expenses/:expenseId", deleteExpense);

export default router;
