import mongoose from "mongoose";

const expenseItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, enum: ["venue", "catering", "technology", "travel", "materials", "speakers", "marketing", "other"], default: "other" },
  status: { type: String, enum: ["pending", "approved", "rejected", "paid"], default: "pending" },
  date: { type: Date, default: Date.now },
  description: String,
  approvedBy: String,
  receipt: String,
}, { timestamps: true });

const meetingBudgetSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  organizationId: { type: String, index: true },
  name: { type: String, required: true },
  description: String,
  totalBudget: { type: Number, required: true },
  spent: { type: Number, default: 0 },
  currency: { type: String, default: "USD" },
  period: { type: String, enum: ["weekly", "monthly", "quarterly", "yearly", "custom"], default: "monthly" },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  category: { type: String, enum: ["team", "department", "organization", "project", "event"], default: "team" },
  status: { type: String, enum: ["active", "paused", "completed", "overbudget"], default: "active" },
  expenses: [expenseItemSchema],
  alerts: {
    threshold80: { type: Boolean, default: true },
    threshold90: { type: Boolean, default: true },
    threshold100: { type: Boolean, default: true },
  },
  tags: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

meetingBudgetSchema.index({ userId: 1, status: 1 });
meetingBudgetSchema.index({ userId: 1, startDate: -1 });

export default mongoose.model("MeetingBudget", meetingBudgetSchema);
