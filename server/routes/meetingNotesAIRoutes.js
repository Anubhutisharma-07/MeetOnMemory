import express from "express";
import {
  getNotes,
  getNoteById,
  createNotes,
  updateNotes,
  deleteNotes,
  generateNotes,
  getActionItems,
  updateActionItem,
  addActionItem,
  deleteActionItem,
  reviewNotes,
  exportNotes,
  getTemplates,
  createTemplate,
  deleteTemplate,
  getNotesAnalytics,
  getVersionHistory,
} from "../controllers/meetingNotesAIController.js";

const router = express.Router();

// Notes CRUD
router.get("/", getNotes);
router.get("/analytics", getNotesAnalytics);
router.get("/action-items", getActionItems);
router.get("/templates", getTemplates);
router.post("/templates", createTemplate);
router.delete("/templates/:id", deleteTemplate);
router.get("/:id", getNoteById);
router.post("/", createNotes);
router.put("/:id", updateNotes);
router.delete("/:id", deleteNotes);

// AI Generation
router.post("/generate", generateNotes);

// Action items
router.post("/:noteId/action-items", addActionItem);
router.put("/:noteId/action-items/:itemId", updateActionItem);
router.delete("/:noteId/action-items/:itemId", deleteActionItem);

// Review & export
router.post("/:id/review", reviewNotes);
router.get("/:id/export", exportNotes);
router.get("/:id/versions", getVersionHistory);

export default router;
