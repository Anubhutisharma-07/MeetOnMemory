import mongoose from "mongoose";

const availabilitySlotSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isRecurring: { type: Boolean, default: true },
    specificDate: { type: Date, default: null },
  },
  { _id: true }
);

const schedulingPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    availability: [availabilitySlotSchema],
    preferredMeetingDuration: { type: Number, default: 30 },
    bufferBetweenMeetings: { type: Number, default: 10 },
    maxMeetingsPerDay: { type: Number, default: 6 },
    preferredTimeRange: {
      start: { type: String, default: "09:00" },
      end: { type: String, default: "17:00" },
    },
    focusTimeBlocks: [
      {
        dayOfWeek: Number,
        startTime: String,
        endTime: String,
        label: String,
      },
    ],
    autoDeclineOutsideAvailability: { type: Boolean, default: false },
    timezone: { type: String, default: "UTC" },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      conflictAlerts: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

const scheduledMeetingSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: {
          type: String,
          enum: ["pending", "accepted", "declined", "tentative"],
          default: "pending",
        },
        responseAt: Date,
      },
    ],
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    duration: { type: Number, required: true },
    recurrence: {
      type: { type: String, enum: ["none", "daily", "weekly", "biweekly", "monthly"], default: "none" },
      daysOfWeek: [Number],
      endDate: Date,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    meetingType: {
      type: String,
      enum: ["standup", "1on1", "team", "allhands", "workshop", "brainstorm", "review", "other"],
      default: "other",
    },
    smartScheduled: { type: Boolean, default: false },
    conflictResolution: {
      hadConflict: { type: Boolean, default: false },
      originalSlot: {
        startTime: Date,
        endTime: Date,
      },
      alternativeSlots: [
        {
          startTime: Date,
          endTime: Date,
          score: Number,
          reason: String,
        },
      ],
    },
    status: {
      type: String,
      enum: ["scheduled", "cancelled", "completed", "rescheduled"],
      default: "scheduled",
    },
    location: { type: String, default: "" },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

const schedulingConflictSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    meeting1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScheduledMeeting",
      required: true,
    },
    meeting2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScheduledMeeting",
      required: true,
    },
    conflictType: {
      type: String,
      enum: ["time_overlap", "participant_double_booked", "room_unavailable", "availability_mismatch"],
      required: true,
    },
    affectedParticipants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],
    resolution: {
      status: {
        type: String,
        enum: ["pending", "auto_resolved", "manually_resolved", "dismissed"],
        default: "pending",
      },
      action: String,
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      resolvedAt: Date,
    },
  },
  { timestamps: true }
);

const SchedulingPreference = mongoose.model("SchedulingPreference", schedulingPreferenceSchema);
const ScheduledMeeting = mongoose.model("ScheduledMeeting", scheduledMeetingSchema);
const SchedulingConflict = mongoose.model("SchedulingConflict", schedulingConflictSchema);

export { SchedulingPreference, ScheduledMeeting, SchedulingConflict };
