import express from "express";
import {
  getROIRecords,
  getROIById,
  createROIRecord,
  updateROIRecord,
  deleteROIRecord,
  getROIAnalytics,
  getBenchmarks,
  simulateROI,
} from "../controllers/meetingROIController.js";

const router = express.Router();

router.get("/", getROIRecords);
router.get("/analytics", getROIAnalytics);
router.get("/benchmarks", getBenchmarks);
router.post("/simulate", simulateROI);
router.get("/:id", getROIById);
router.post("/", createROIRecord);
router.put("/:id", updateROIRecord);
router.delete("/:id", deleteROIRecord);

export default router;
