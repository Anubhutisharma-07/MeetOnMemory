import express from "express";
import {
  getMyPreferences,
  updatePreferences,
  getScheduledMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  detectConflicts,
  findAlternativeSlots,
  smartSchedule,
  getSchedulingAnalytics,
  getTeamAvailability,
  getConflicts,
  resolveConflict,
  getRecommendations,
} from "../controllers/smartSchedulerController.js";

const router = express.Router();

// Preferences
router.get("/preferences", getMyPreferences);
router.put("/preferences", updatePreferences);

// Meetings CRUD
router.get("/meetings", getScheduledMeetings);
router.post("/meetings", createMeeting);
router.put("/meetings/:id", updateMeeting);
router.delete("/meetings/:id", deleteMeeting);

// Conflict detection
router.get("/conflicts/detect", detectConflicts);
router.get("/conflicts", getConflicts);
router.put("/conflicts/:conflictId/resolve", resolveConflict);

// Smart scheduling
router.post("/smart-schedule", smartSchedule);
router.get("/alternative-slots", findAlternativeSlots);

// Team availability
router.get("/team-availability", getTeamAvailability);

// Analytics & insights
router.get("/analytics", getSchedulingAnalytics);
router.get("/recommendations", getRecommendations);

export default router;
