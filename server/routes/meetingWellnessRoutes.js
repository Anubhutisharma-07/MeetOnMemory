import express from "express";
import userAuth from "../middleware/userAuth.js";
import {
  getWellnessOverview,
  getBurnoutRisk,
  getFocusTimeStats,
  getRecoveryWindows,
  getTeamWellness,
  updateWellnessPreferences,
  getWellnessPreferences,
} from "../controllers/meetingWellnessController.js";

const router = express.Router();

router.use(userAuth);

router.get("/overview", getWellnessOverview);
router.get("/burnout-risk", getBurnoutRisk);
router.get("/focus-time-stats", getFocusTimeStats);
router.get("/recovery-windows", getRecoveryWindows);
router.get("/team", getTeamWellness);
router.get("/preferences", getWellnessPreferences);
router.put("/preferences", updateWellnessPreferences);

export default router;
