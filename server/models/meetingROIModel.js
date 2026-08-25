import mongoose from "mongoose";

const meetingROISchema = new mongoose.Schema(
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
    meetingType: {
      type: String,
      enum: ["standup", "1on1", "team", "allhands", "workshop", "brainstorm", "review", "client", "other"],
      default: "team",
    },

    // Cost inputs
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: String,
        role: String,
        hourlyRate: { type: Number, default: 50 },
        preparationTime: { type: Number, default: 0 }, // minutes
        travelTime: { type: Number, default: 0 }, // minutes
      },
    ],
    duration: { type: Number, required: true }, // minutes
    scheduledDate: { type: Date, required: true },

    // Direct costs
    venueCost: { type: Number, default: 0 },
    cateringCost: { type: Number, default: 0 },
    technologyCost: { type: Number, default: 0 },
    travelCost: { type: Number, default: 0 },
    otherCost: { type: Number, default: 0 },

    // Outcomes
    decisions: [
      {
        title: String,
        impact: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
        estimatedValue: { type: Number, default: 0 },
      },
    ],
    actionItemsCount: { type: Number, default: 0 },
    actionItemsCompleted: { type: Number, default: 0 },
    blockersResolved: { type: Number, default: 0 },

    // Quality metrics (1-10 scale)
    participantSatisfaction: { type: Number, default: 0, min: 0, max: 10 },
    productivityScore: { type: Number, default: 0, min: 0, max: 10 },
    goalAchievement: { type: Number, default: 0, min: 0, max: 10 },
    followThroughRate: { type: Number, default: 0, min: 0, max: 10 },

    // Engagement
    avgSpeakingTime: { type: Number, default: 0 }, // seconds per person
    engagementScore: { type: Number, default: 0, min: 0, max: 100 },
    attentionScore: { type: Number, default: 0, min: 0, max: 100 },

    // ROI metadata
    calculatedROI: { type: Number, default: 0 },
    costPerDecision: { type: Number, default: 0 },
    costPerActionItem: { type: Number, default: 0 },
    valuePerMinute: { type: Number, default: 0 },

    // Status
    status: {
      type: String,
      enum: ["draft", "completed", "analyzed"],
      default: "draft",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// Computed virtual: total cost
meetingROISchema.virtual("totalCost").get(function () {
  const laborCost = this.participants.reduce((sum, p) => {
    const totalTime = (this.duration + (p.preparationTime || 0) + (p.travelTime || 0)) / 60;
    return sum + totalTime * (p.hourlyRate || 50);
  }, 0);
  return laborCost + this.venueCost + this.cateringCost + this.technologyCost + this.travelCost + this.otherCost;
});

// Computed virtual: total value from decisions
meetingROISchema.virtual("totalDecisionValue").get(function () {
  return this.decisions.reduce((sum, d) => sum + (d.estimatedValue || 0), 0);
});

// Computed virtual: ROI percentage
meetingROISchema.virtual("roiPercentage").get(function () {
  const cost = this.totalCost;
  const value = this.totalDecisionValue;
  if (cost === 0) return 0;
  return Math.round(((value - cost) / cost) * 100);
});

meetingROISchema.set("toJSON", { virtuals: true });
meetingROISchema.set("toObject", { virtuals: true });

const MeetingROI = mongoose.model("MeetingROI", meetingROISchema);
export default MeetingROI;
