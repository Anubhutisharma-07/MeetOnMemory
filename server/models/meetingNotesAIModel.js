import mongoose from "mongoose";

const actionItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assigneeName: { type: String, default: "Unassigned" },
    dueDate: { type: Date, default: null },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
    category: {
      type: String,
      enum: ["task", "follow_up", "decision", "research", "communication", "review"],
      default: "task",
    },
    extractedFrom: { type: String, default: "" },
    confidence: { type: Number, default: 0.8, min: 0, max: 1 },
    completedAt: { type: Date, default: null },
  },
  { _id: true, timestamps: true }
);

const decisionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    decidedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    decidedByName: [String],
    outcome: { type: String, default: "" },
    alternatives: [String],
    rationale: { type: String, default: "" },
    impact: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    extractedFrom: { type: String, default: "" },
    confidence: { type: Number, default: 0.8, min: 0, max: 1 },
  },
  { _id: true, timestamps: true }
);

const keyTopicSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    summary: { type: String, default: "" },
    sentiment: {
      type: String,
      enum: ["positive", "neutral", "negative", "mixed"],
      default: "neutral",
    },
    keywords: [String],
    speakerContributions: [
      {
        speaker: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        speakerName: String,
        contribution: String,
        duration: Number,
      },
    ],
    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },
  },
  { _id: true }
);

const aiGeneratedNotesSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      default: null,
    },
    title: { type: String, required: true },
    rawInput: { type: String, default: "" },
    inputType: {
      type: String,
      enum: ["transcript", "text", "audio_summary", "bullet_points"],
      default: "text",
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "processing", "completed", "reviewed", "archived"],
      default: "draft",
    },

    // AI-generated content
    summary: { type: String, default: "" },
    executiveSummary: { type: String, default: "" },
    fullNotes: { type: String, default: "" },
    keyTopics: [keyTopicSchema],
    actionItems: [actionItemSchema],
    decisions: [decisionSchema],

    // Metadata
    meetingDate: { type: Date, default: Date.now },
    duration: { type: Number, default: 0 },
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: String,
        speakingTime: Number,
        contributions: Number,
      },
    ],
    tags: [String],

    // AI metrics
    aiConfidence: { type: Number, default: 0, min: 0, max: 1 },
    processingTime: { type: Number, default: 0 },
    wordCount: { type: Number, default: 0 },

    // Quality scores
    qualityScores: {
      completeness: { type: Number, default: 0 },
      clarity: { type: Number, default: 0 },
      actionability: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 },
    },

    // Sharing & export
    isPublic: { type: Boolean, default: false },
    sharedWith: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        permission: {
          type: String,
          enum: ["view", "comment", "edit"],
          default: "view",
        },
      },
    ],
    exportedFormats: [
      {
        format: String,
        exportedAt: Date,
        url: String,
      },
    ],

    // Version control
    version: { type: Number, default: 1 },
    previousVersions: [
      {
        version: Number,
        snapshot: mongoose.Schema.Types.Mixed,
        createdAt: Date,
        editedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],

    // Review
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    reviewNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

const notesTemplateSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    template: {
      sections: [
        {
          title: String,
          prompt: String,
          required: Boolean,
        },
      ],
      outputFormat: {
        type: String,
        enum: ["structured", "narrative", "bullets", "executive"],
        default: "structured",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDefault: { type: Boolean, default: false },
    usageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const MeetingNotesAI = mongoose.model("MeetingNotesAI", aiGeneratedNotesSchema);
const NotesTemplate = mongoose.model("NotesTemplate", notesTemplateSchema);

export { MeetingNotesAI, NotesTemplate };
