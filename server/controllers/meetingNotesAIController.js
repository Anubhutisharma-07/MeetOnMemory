import { MeetingNotesAI, NotesTemplate } from "../models/meetingNotesAIModel.js";

// ═══════════════════════════════════════════
// NOTES CRUD
// ═══════════════════════════════════════════

export const getNotes = async (req, res) => {
  try {
    const {
      status,
      search,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = { organization: req.user.organization };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { summary: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notes, total] = await Promise.all([
      MeetingNotesAI.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate("generatedBy", "name email")
        .populate("reviewedBy", "name email")
        .lean(),
      MeetingNotesAI.countDocuments(filter),
    ]);

    res.json({
      notes,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getNoteById = async (req, res) => {
  try {
    const note = await MeetingNotesAI.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    })
      .populate("generatedBy", "name email")
      .populate("reviewedBy", "name email")
      .populate("actionItems.assignee", "name email")
      .populate("decisions.decidedBy", "name email")
      .populate("participants.user", "name email");

    if (!note) return res.status(404).json({ message: "Notes not found" });
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createNotes = async (req, res) => {
  try {
    const note = new MeetingNotesAI({
      ...req.body,
      organization: req.user.organization,
      generatedBy: req.user._id,
    });
    await note.save();
    res.status(201).json(note);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateNotes = async (req, res) => {
  try {
    const note = await MeetingNotesAI.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });
    if (!note) return res.status(404).json({ message: "Notes not found" });

    // Save version snapshot
    note.previousVersions.push({
      version: note.version,
      snapshot: {
        summary: note.summary,
        fullNotes: note.fullNotes,
        actionItems: note.actionItems,
        decisions: note.decisions,
        keyTopics: note.keyTopics,
      },
      createdAt: new Date(),
      editedBy: req.user._id,
    });
    note.version += 1;

    Object.assign(note, req.body);
    await note.save();
    res.json(note);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteNotes = async (req, res) => {
  try {
    const note = await MeetingNotesAI.findOneAndDelete({
      _id: req.params.id,
      organization: req.user.organization,
    });
    if (!note) return res.status(404).json({ message: "Notes not found" });
    res.json({ message: "Notes deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════
// AI GENERATION (simulated)
// ═══════════════════════════════════════════

export const generateNotes = async (req, res) => {
  try {
    const { rawInput, inputType, title, meetingDate, duration, templateId } =
      req.body;

    const startTime = Date.now();

    // Simulate AI processing based on input
    const wordCount = rawInput ? rawInput.split(/\s+/).length : 0;

    // Generate simulated AI output
    const generated = simulateAIGeneration(rawInput, inputType, title);

    const note = new MeetingNotesAI({
      organization: req.user.organization,
      generatedBy: req.user._id,
      title: title || "AI Generated Notes",
      rawInput,
      inputType: inputType || "text",
      status: "completed",
      summary: generated.summary,
      executiveSummary: generated.executiveSummary,
      fullNotes: generated.fullNotes,
      keyTopics: generated.keyTopics,
      actionItems: generated.actionItems,
      decisions: generated.decisions,
      meetingDate: meetingDate || new Date(),
      duration: duration || 0,
      participants: generated.participants,
      tags: generated.tags,
      aiConfidence: generated.aiConfidence,
      processingTime: Date.now() - startTime,
      wordCount,
      qualityScores: generated.qualityScores,
    });

    await note.save();

    // Update template usage if provided
    if (templateId) {
      await NotesTemplate.findByIdAndUpdate(templateId, {
        $inc: { usageCount: 1 },
      });
    }

    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

function simulateAIGeneration(rawInput, inputType, title) {
  const inputText = rawInput || "Meeting discussion about project status and next steps.";

  // Extract keywords (simple simulation)
  const words = inputText.toLowerCase().split(/\s+/);
  const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "shall", "can", "need", "dare", "to", "of", "in", "for", "on", "with", "at", "by", "from", "as", "into", "through", "during", "before", "after", "above", "below", "between", "and", "but", "or", "not", "so", "very", "just", "than", "too", "also", "that", "this", "it", "they", "we", "you", "i", "my", "your", "his", "her", "our", "their", "what", "which", "who", "whom", "how", "when", "where", "why"]);
  const keywords = [...new Set(words.filter((w) => w.length > 3 && !stopWords.has(w)))].slice(0, 15);

  const summary =
    `The meeting "${title || "Discussion"}" covered key topics including ${keywords.slice(0, 5).join(", ")}. ` +
    `Participants engaged in productive discussions about project progress, challenges, and upcoming milestones. ` +
    `Several action items were identified and assigned to team members.`;

  const executiveSummary =
    `This meeting addressed ${keywords.length > 3 ? "multiple" : "key"} areas of focus. ` +
    `The team aligned on priorities and identified ${Math.floor(Math.random() * 3) + 2} critical action items. ` +
    `Decisions were made regarding next steps and resource allocation.`;

  const actionItems = [
    {
      title: "Review and update project timeline",
      description: "Ensure all milestones are accurate and reflect current progress",
      assigneeName: "Team Lead",
      priority: "high",
      category: "review",
      confidence: 0.9,
    },
    {
      title: "Follow up on pending deliverables",
      description: "Check status of outstanding tasks and escalate if needed",
      assigneeName: "Project Manager",
      priority: "medium",
      category: "follow_up",
      confidence: 0.85,
    },
    {
      title: "Schedule next sync meeting",
      description: "Coordinate availability for the follow-up discussion",
      assigneeName: "Unassigned",
      priority: "medium",
      category: "communication",
      confidence: 0.8,
    },
  ];

  const decisions = [
    {
      title: "Proceed with current approach",
      description: "The team agreed to continue with the existing strategy",
      decidedByName: ["Team Lead", "Senior Developer"],
      outcome: "Approved",
      rationale: "Current approach has shown positive results in testing",
      impact: "high",
      confidence: 0.88,
    },
  ];

  const keyTopics = keywords.slice(0, 5).map((kw, i) => ({
    title: kw.charAt(0).toUpperCase() + kw.slice(1).replace(/-/g, " "),
    summary: `Discussion about ${kw.replace(/-/g, " ")} and its implications for the project`,
    sentiment: ["positive", "neutral", "mixed"][i % 3],
    keywords: [kw],
  }));

  const participantCount = Math.floor(Math.random() * 4) + 3;
  const participants = Array.from({ length: participantCount }, (_, i) => ({
    name: `Participant ${i + 1}`,
    speakingTime: Math.floor(Math.random() * 300) + 60,
    contributions: Math.floor(Math.random() * 10) + 2,
  }));

  return {
    summary,
    executiveSummary,
    fullNotes: generateFullNotes(inputText, keywords, title),
    actionItems,
    decisions,
    keyTopics,
    participants,
    tags: keywords.slice(0, 5),
    aiConfidence: 0.75 + Math.random() * 0.2,
    qualityScores: {
      completeness: Math.floor(Math.random() * 20) + 80,
      clarity: Math.floor(Math.random() * 20) + 75,
      actionability: Math.floor(Math.random() * 25) + 70,
      accuracy: Math.floor(Math.random() * 15) + 80,
    },
  };
}

function generateFullNotes(inputText, keywords, title) {
  return `# ${title || "Meeting Notes"}

## Meeting Overview
This document contains AI-generated notes from the meeting discussion. The content has been automatically processed and structured for clarity and actionability.

## Key Discussion Points
${keywords
  .slice(0, 5)
  .map(
    (kw) =>
      `### ${kw.charAt(0).toUpperCase() + kw.slice(1).replace(/-/g, " ")}\nThe team discussed aspects related to ${kw.replace(/-/g, " ")}. This topic was identified as a key area requiring attention and follow-up action.`
  )
  .join("\n\n")}

## Action Items
1. **Review and update project timeline** — Priority: High — Assigned to: Team Lead
2. **Follow up on pending deliverables** — Priority: Medium — Assigned to: Project Manager
3. **Schedule next sync meeting** — Priority: Medium — Assigned to: Unassigned

## Decisions Made
1. **Proceed with current approach** — The team agreed to continue with the existing strategy based on positive test results.

## Next Steps
- All team members should review the action items assigned to them
- Follow-up meeting to be scheduled within the next week
- Any blockers should be escalated immediately

---
*Notes generated by AI on ${new Date().toLocaleDateString()}*
*Confidence: ${Math.floor(75 + Math.random() * 20)}%*`;
}

// ═══════════════════════════════════════════
// ACTION ITEMS MANAGEMENT
// ═══════════════════════════════════════════

export const getActionItems = async (req, res) => {
  try {
    const { status, assignee, priority } = req.query;

    const notes = await MeetingNotesAI.find({
      organization: req.user.organization,
      "actionItems.0": { $exists: true },
    }).lean();

    let allItems = [];
    notes.forEach((note) => {
      note.actionItems.forEach((item) => {
        allItems.push({
          ...item,
          noteId: note._id,
          noteTitle: note.title,
          noteDate: note.meetingDate,
        });
      });
    });

    if (status) allItems = allItems.filter((i) => i.status === status);
    if (assignee) allItems = allItems.filter((i) => i.assignee?.toString() === assignee || i.assigneeName === assignee);
    if (priority) allItems = allItems.filter((i) => i.priority === priority);

    allItems.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
    });

    res.json({ items: allItems, total: allItems.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateActionItem = async (req, res) => {
  try {
    const { noteId, itemId } = req.params;
    const note = await MeetingNotesAI.findOne({
      _id: noteId,
      organization: req.user.organization,
    });
    if (!note) return res.status(404).json({ message: "Notes not found" });

    const item = note.actionItems.id(itemId);
    if (!item) return res.status(404).json({ message: "Action item not found" });

    Object.assign(item, req.body);
    if (req.body.status === "completed") {
      item.completedAt = new Date();
    }
    await note.save();

    res.json(note);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const addActionItem = async (req, res) => {
  try {
    const note = await MeetingNotesAI.findOne({
      _id: req.params.noteId,
      organization: req.user.organization,
    });
    if (!note) return res.status(404).json({ message: "Notes not found" });

    note.actionItems.push(req.body);
    await note.save();
    res.status(201).json(note);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteActionItem = async (req, res) => {
  try {
    const { noteId, itemId } = req.params;
    const note = await MeetingNotesAI.findOne({
      _id: noteId,
      organization: req.user.organization,
    });
    if (!note) return res.status(404).json({ message: "Notes not found" });

    note.actionItems.pull(itemId);
    await note.save();
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════
// REVIEW & EXPORT
// ═══════════════════════════════════════════

export const reviewNotes = async (req, res) => {
  try {
    const note = await MeetingNotesAI.findOneAndUpdate(
      { _id: req.params.id, organization: req.user.organization },
      {
        status: "reviewed",
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        reviewNotes: req.body.reviewNotes || "",
      },
      { new: true }
    );
    if (!note) return res.status(404).json({ message: "Notes not found" });
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const exportNotes = async (req, res) => {
  try {
    const { format = "markdown" } = req.query;
    const note = await MeetingNotesAI.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    })
      .populate("actionItems.assignee", "name email")
      .populate("decisions.decidedBy", "name email");

    if (!note) return res.status(404).json({ message: "Notes not found" });

    let exported;
    if (format === "json") {
      exported = JSON.stringify(note.toJSON(), null, 2);
    } else {
      // Markdown export
      exported = `# ${note.title}\n\n`;
      exported += `**Date:** ${new Date(note.meetingDate).toLocaleDateString()}\n`;
      exported += `**Duration:** ${note.duration} minutes\n`;
      exported += `**Status:** ${note.status}\n\n`;
      exported += `## Summary\n${note.summary}\n\n`;
      exported += `## Executive Summary\n${note.executiveSummary}\n\n`;
      if (note.keyTopics?.length > 0) {
        exported += `## Key Topics\n`;
        note.keyTopics.forEach((t) => {
          exported += `### ${t.title}\n${t.summary}\n\n`;
        });
      }
      if (note.actionItems?.length > 0) {
        exported += `## Action Items\n`;
        note.actionItems.forEach((a, i) => {
          exported += `${i + 1}. **${a.title}** — ${a.priority} — ${a.assigneeName || "Unassigned"} — ${a.status}\n`;
        });
        exported += "\n";
      }
      if (note.decisions?.length > 0) {
        exported += `## Decisions\n`;
        note.decisions.forEach((d) => {
          exported += `### ${d.title}\n${d.description}\n**Outcome:** ${d.outcome}\n\n`;
        });
      }
    }

    res.json({ exported, format, noteId: note._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════════

export const getTemplates = async (req, res) => {
  try {
    const templates = await NotesTemplate.find({
      organization: req.user.organization,
    })
      .populate("createdBy", "name email")
      .sort({ isDefault: -1, usageCount: -1 })
      .lean();
    res.json({ templates });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createTemplate = async (req, res) => {
  try {
    const template = new NotesTemplate({
      ...req.body,
      organization: req.user.organization,
      createdBy: req.user._id,
    });
    await template.save();
    res.status(201).json(template);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const template = await NotesTemplate.findOneAndDelete({
      _id: req.params.id,
      organization: req.user.organization,
    });
    if (!template) return res.status(404).json({ message: "Template not found" });
    res.json({ message: "Template deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════

export const getNotesAnalytics = async (req, res) => {
  try {
    const orgId = req.user.organization;
    const notes = await MeetingNotesAI.find({ organization: orgId }).lean();

    const totalNotes = notes.length;
    const completedNotes = notes.filter((n) => n.status === "completed").length;
    const reviewedNotes = notes.filter((n) => n.status === "reviewed").length;

    // Total action items
    let totalActionItems = 0;
    let completedActionItems = 0;
    let pendingActionItems = 0;
    notes.forEach((n) => {
      n.actionItems?.forEach((a) => {
        totalActionItems++;
        if (a.status === "completed") completedActionItems++;
        else if (a.status === "pending") pendingActionItems++;
      });
    });

    // Total decisions
    const totalDecisions = notes.reduce((s, n) => s + (n.decisions?.length || 0), 0);

    // Average quality scores
    const scoreCounts = { completeness: 0, clarity: 0, actionability: 0, accuracy: 0 };
    let scoredNotes = 0;
    notes.forEach((n) => {
      if (n.qualityScores?.completeness > 0) {
        scoredNotes++;
        scoreCounts.completeness += n.qualityScores.completeness;
        scoreCounts.clarity += n.qualityScores.clarity;
        scoreCounts.actionability += n.qualityScores.actionability;
        scoreCounts.accuracy += n.qualityScores.accuracy;
      }
    });

    const avgQuality = {
      completeness: scoredNotes > 0 ? Math.round(scoreCounts.completeness / scoredNotes) : 0,
      clarity: scoredNotes > 0 ? Math.round(scoreCounts.clarity / scoredNotes) : 0,
      actionability: scoredNotes > 0 ? Math.round(scoreCounts.actionability / scoredNotes) : 0,
      accuracy: scoredNotes > 0 ? Math.round(scoreCounts.accuracy / scoredNotes) : 0,
    };

    // Monthly trend
    const monthlyTrend = {};
    notes.forEach((n) => {
      const month = new Date(n.createdAt).toISOString().slice(0, 7);
      if (!monthlyTrend[month]) monthlyTrend[month] = { count: 0, actionItems: 0 };
      monthlyTrend[month].count++;
      monthlyTrend[month].actionItems += n.actionItems?.length || 0;
    });

    // Input type distribution
    const inputTypeDist = {};
    notes.forEach((n) => {
      inputTypeDist[n.inputType] = (inputTypeDist[n.inputType] || 0) + 1;
    });

    // Top tags
    const tagCounts = {};
    notes.forEach((n) => {
      n.tags?.forEach((t) => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    });
    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Average processing time
    const avgProcessingTime =
      notes.length > 0
        ? Math.round(notes.reduce((s, n) => s + (n.processingTime || 0), 0) / notes.length)
        : 0;

    // Average AI confidence
    const avgConfidence =
      notes.length > 0
        ? Math.round(notes.reduce((s, n) => s + (n.aiConfidence || 0), 0) / notes.length * 100)
        : 0;

    res.json({
      summary: {
        totalNotes,
        completedNotes,
        reviewedNotes,
        totalActionItems,
        completedActionItems,
        pendingActionItems,
        totalDecisions,
        avgProcessingTime,
        avgConfidence,
      },
      avgQuality,
      monthlyTrend: Object.entries(monthlyTrend)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      inputTypeDistribution: Object.entries(inputTypeDist).map(([type, count]) => ({ type, count })),
      topTags,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════
// VERSION HISTORY
// ═══════════════════════════════════════════

export const getVersionHistory = async (req, res) => {
  try {
    const note = await MeetingNotesAI.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    })
      .populate("previousVersions.editedBy", "name email")
      .select("title version previousVersions");

    if (!note) return res.status(404).json({ message: "Notes not found" });
    res.json({
      currentVersion: note.version,
      versions: note.previousVersions.sort((a, b) => b.version - a.version),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
