import mongoose from "mongoose";

const wellnessPreferencesSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    maxDailyMeetingMinutes: {
      type: Number,
      default: 240,
      min: 60,
      max: 480,
    },
    maxConsecutiveMeetings: {
      type: Number,
      default: 3,
      min: 1,
      max: 6,
    },
    preferredBreakMinutes: {
      type: Number,
      default: 15,
      min: 5,
      max: 60,
    },
    dailyFocusMinutesTarget: {
      type: Number,
      default: 120,
      min: 30,
      max: 480,
    },
    enableBurnoutAlerts: {
      type: Boolean,
      default: true,
    },
    burnoutAlertThreshold: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "high",
    },
    meetingFreeDays: {
      type: [Number],
      default: [],
    },
  },
  { timestamps: true },
);

const WellnessPreferences = mongoose.model(
  "WellnessPreferences",
  wellnessPreferencesSchema,
);

export default WellnessPreferences;
