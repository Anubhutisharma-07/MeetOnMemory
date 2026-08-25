import Meeting from "../models/meetingModel.js";
import User from "../models/userModel.js";
import WellnessPreferences from "../models/meetingWellnessModel.js";
import mongoose from "mongoose";

/**
 * GET /overview – aggregate wellness metrics for an organization
 */
export const getWellnessOverview = async (req, res) => {
  try {
    const { organizationId } = req.query;
    const orgFilter = organizationId
      ? { organization: new mongoose.Types.ObjectId(organizationId) }
      : { organization: req.user?.organization };

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const weeklyMeetings = await Meeting.find({
      ...orgFilter,
      date: { $gte: startOfWeek, $lte: now },
    }).select("date duration title participants meetingType");

    const monthlyMeetings = await Meeting.find({
      ...orgFilter,
      date: { $gte: startOfMonth, $lte: now },
    }).select("date duration title participants");

    const totalWeeklyMinutes = weeklyMeetings.reduce(
      (sum, m) => sum + (m.duration || 30),
      0,
    );
    const totalWeeklyHours =
      Math.round((totalWeeklyMinutes / 60) * 10) / 10;

    const dailyBreakdown = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 0; i <= now.getDay(); i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      const dayEnd = new Date(dayDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayMeetings = weeklyMeetings.filter((m) => {
        const d = new Date(m.date);
        return d >= dayDate && d <= dayEnd;
      });
      const dayMinutes = dayMeetings.reduce(
        (sum, m) => sum + (m.duration || 30),
        0,
      );
      dailyBreakdown.push({
        day: dayNames[i],
        date: dayDate.toISOString().split("T")[0],
        meetings: dayMeetings.length,
        minutes: dayMinutes,
        hours: Math.round((dayMinutes / 60) * 10) / 10,
      });
    }

    const totalMonthlyHours =
      Math.round(
        (monthlyMeetings.reduce((s, m) => s + (m.duration || 30), 0) / 60) *
          10,
      ) / 10;

    const daysElapsed = Math.max(1, now.getDay() + 1);
    const avgDailyMinutes = Math.round(totalWeeklyMinutes / daysElapsed);
    const avgDailyMeetings =
      Math.round((weeklyMeetings.length / daysElapsed) * 10) / 10;

    // Wellness score (0-100)
    const idealDaily = 180;
    const loadRatio = avgDailyMinutes / idealDaily;
    let wellnessScore = 100;
    if (loadRatio > 1.5)
      wellnessScore = Math.max(20, 100 - (loadRatio - 1) * 40);
    else if (loadRatio > 1.0)
      wellnessScore = Math.max(40, 100 - (loadRatio - 1) * 60);
    else wellnessScore = Math.min(100, 80 + loadRatio * 20);
    wellnessScore = Math.round(wellnessScore);

    let burnoutRisk = "low";
    if (wellnessScore < 30) burnoutRisk = "critical";
    else if (wellnessScore < 50) burnoutRisk = "high";
    else if (wellnessScore < 70) burnoutRisk = "medium";

    // Back-to-back detection
    const sorted = [...weeklyMeetings].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
    let backToBackCount = 0;
    for (let i = 1; i < sorted.length; i++) {
      const prevEnd = new Date(sorted[i - 1].date);
      prevEnd.setMinutes(prevEnd.getMinutes() + (sorted[i - 1].duration || 30));
      const gap =
        (new Date(sorted[i].date) - prevEnd) / (1000 * 60);
      if (gap <= 5) backToBackCount++;
    }

    // Recommendations
    const recommendations = [];
    if (avgDailyMinutes > 240) {
      recommendations.push({
        type: "critical",
        title: "Excessive Meeting Load",
        message: `You average ${Math.round(avgDailyMinutes / 60)}h of meetings daily. Delegate or decline non-essential ones.`,
        impact: "high",
      });
    }
    if (avgDailyMinutes > 180) {
      recommendations.push({
        type: "warning",
        title: "Consider Meeting-Free Mornings",
        message: "Block mornings for deep work. Schedule meetings in the afternoon.",
        impact: "medium",
      });
    }
    if (backToBackCount > 3) {
      recommendations.push({
        type: "warning",
        title: "Too Many Back-to-Back Meetings",
        message: `${backToBackCount} back-to-back meetings this week. Add 5-10 min buffers.`,
        impact: "medium",
      });
    }
    if (weeklyMeetings.length > 25) {
      recommendations.push({
        type: "info",
        title: "High Meeting Volume",
        message: `${weeklyMeetings.length} meetings this week. Review which could be async updates.`,
        impact: "low",
      });
    }
    if (wellnessScore >= 70) {
      recommendations.push({
        type: "positive",
        title: "Good Meeting Balance",
        message: "Your meeting load is healthy. Keep protecting focus time blocks.",
        impact: "positive",
      });
    }

    // Meeting type distribution
    const typeDistribution = {};
    weeklyMeetings.forEach((m) => {
      const t = m.meetingType || "internal";
      typeDistribution[t] = (typeDistribution[t] || 0) + 1;
    });

    const longestMeeting = weeklyMeetings.reduce(
      (best, m) => ((m.duration || 30) > (best?.duration || 0) ? m : best),
      null,
    );

    return res.json({
      success: true,
      overview: {
        wellnessScore,
        burnoutRisk,
        totalWeeklyHours,
        totalWeeklyMeetings: weeklyMeetings.length,
        totalMonthlyHours,
        totalMonthlyMeetings: monthlyMeetings.length,
        avgDailyMinutes,
        avgDailyMeetings,
        backToBackCount,
        longestMeeting: longestMeeting
          ? { title: longestMeeting.title, duration: longestMeeting.duration || 30 }
          : null,
        dailyBreakdown,
        typeDistribution,
        recommendations,
      },
    });
  } catch (error) {
    console.error("Error fetching wellness overview:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch wellness overview" });
  }
};

/**
 * GET /burnout-risk – personalized burnout risk assessment
 */
export const getBurnoutRisk = async (req, res) => {
  try {
    const userId = req.user?._id || req.query.userId;
    const orgId = req.user?.organization;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID required" });
    }

    const now = new Date();
    const fourWeeksAgo = new Date(now);
    fourWeeksAgo.setDate(now.getDate() - 28);

    const userMeetings = await Meeting.find({
      organization: orgId,
      date: { $gte: fourWeeksAgo, $lte: now },
      $or: [{ "participants.user": userId }, { uploadedBy: userId }],
    }).select("date duration title");

    const weeklyLoads = [];
    for (let w = 3; w >= 0; w--) {
      const ws = new Date(now);
      ws.setDate(now.getDate() - now.getDay() - w * 7);
      ws.setHours(0, 0, 0, 0);
      const we = new Date(ws);
      we.setDate(ws.getDate() + 6);
      we.setHours(23, 59, 59, 999);

      const wm = userMeetings.filter((m) => {
        const d = new Date(m.date);
        return d >= ws && d <= we;
      });
      const mins = wm.reduce((s, m) => s + (m.duration || 30), 0);
      weeklyLoads.push({
        weekLabel: `Week of ${ws.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        meetings: wm.length,
        hours: Math.round((mins / 60) * 10) / 10,
        minutes: mins,
      });
    }

    const recent = weeklyLoads[3]?.minutes || 0;
    const prev = weeklyLoads[2]?.minutes || 1;
    const trend = recent > prev * 1.2 ? "increasing" : recent < prev * 0.8 ? "decreasing" : "stable";

    const avgMin = weeklyLoads.reduce((s, w) => s + w.minutes, 0) / 4;
    let burnoutScore = 0;
    burnoutScore += Math.min(40, (avgMin / 1200) * 40);
    burnoutScore += trend === "increasing" ? 20 : trend === "stable" ? 5 : 0;
    burnoutScore += weeklyLoads.some((w) => w.meetings > 15) ? 15 : 0;
    burnoutScore = Math.min(100, Math.round(burnoutScore));

    let riskLevel = "low";
    if (burnoutScore > 75) riskLevel = "critical";
    else if (burnoutScore > 55) riskLevel = "high";
    else if (burnoutScore > 35) riskLevel = "medium";

    const suggestions = [];
    if (trend === "increasing") suggestions.push("Meeting load is increasing. Run a meeting audit to cut non-essential ones.");
    if (avgMin > 1200) suggestions.push("Over 20 hours/week of meetings. Block at least one meeting-free half-day.");
    if (weeklyLoads.some((w) => w.meetings > 15)) suggestions.push("One or more weeks exceeded 15 meetings. Delegate attendance.");
    if (suggestions.length === 0) suggestions.push("Meeting load looks manageable. Keep protecting focus time!");

    return res.json({
      success: true,
      burnoutRisk: {
        score: burnoutScore,
        level: riskLevel,
        trend,
        weeklyLoads,
        recoverySuggestions: suggestions,
        avgWeeklyHours: Math.round((avgMin / 60) * 10) / 10,
        totalMeetingsAnalyzed: userMeetings.length,
      },
    });
  } catch (error) {
    console.error("Error calculating burnout risk:", error);
    return res.status(500).json({ success: false, message: "Failed to calculate burnout risk" });
  }
};

/**
 * GET /focus-time-stats – focus time protection statistics
 */
export const getFocusTimeStats = async (req, res) => {
  try {
    const orgId = req.user?.organization;
    const userId = req.user?._id;

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const prefs = await WellnessPreferences.findOne({ user: userId, organization: orgId });
    const targetDailyMinutes = prefs?.dailyFocusMinutesTarget || 120;

    const focusWindows = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 0; i <= now.getDay(); i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      const dayEnd = new Date(dayDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayMeetings = await Meeting.find({
        organization: orgId,
        $or: [{ "participants.user": userId }, { uploadedBy: userId }],
        date: { $gte: dayDate, $lte: dayEnd },
      })
        .select("date duration")
        .sort({ date: 1 });

      const busyBlocks = dayMeetings.map((m) => {
        const start = new Date(m.date);
        const end = new Date(start);
        end.setMinutes(start.getMinutes() + (m.duration || 30));
        return { start, end };
      });

      const workStart = new Date(dayDate);
      workStart.setHours(9, 0, 0, 0);
      const workEnd = new Date(dayDate);
      workEnd.setHours(17, 0, 0, 0);

      let availableMinutes = 0;
      let currentTime = workStart;
      busyBlocks.forEach((block) => {
        if (block.start > currentTime) availableMinutes += (block.start - currentTime) / 60000;
        if (block.end > currentTime) currentTime = block.end;
      });
      if (currentTime < workEnd) availableMinutes += (workEnd - currentTime) / 60000;

      focusWindows.push({
        day: dayNames[i],
        date: dayDate.toISOString().split("T")[0],
        availableMinutes: Math.round(availableMinutes),
        meetingMinutes: dayMeetings.reduce((s, m) => s + (m.duration || 30), 0),
        meetingCount: dayMeetings.length,
        targetMet: availableMinutes >= targetDailyMinutes,
      });
    }

    const totalAvailable = focusWindows.reduce((s, w) => s + w.availableMinutes, 0);
    const targetMetDays = focusWindows.filter((w) => w.targetMet).length;

    return res.json({
      success: true,
      focusTime: {
        focusWindows,
        totalAvailableMinutes: totalAvailable,
        targetDailyMinutes,
        targetMetDays,
        targetMissDays: focusWindows.length - targetMetDays,
        targetMetPercentage: Math.round((targetMetDays / Math.max(1, focusWindows.length)) * 100),
        avgAvailableMinutes: Math.round(totalAvailable / Math.max(1, focusWindows.length)),
      },
    });
  } catch (error) {
    console.error("Error fetching focus time stats:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch focus time stats" });
  }
};

/**
 * GET /recovery-windows – recommended recovery windows
 */
export const getRecoveryWindows = async (req, res) => {
  try {
    const orgId = req.user?.organization;
    const userId = req.user?._id;

    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (6 - now.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);

    const upcoming = await Meeting.find({
      organization: orgId,
      $or: [{ "participants.user": userId }, { uploadedBy: userId }],
      date: { $gte: now, $lte: endOfWeek },
    })
      .select("date duration title")
      .sort({ date: 1 });

    const windows = [];
    for (let i = 1; i < upcoming.length; i++) {
      const prevEnd = new Date(upcoming[i - 1].date);
      prevEnd.setMinutes(prevEnd.getMinutes() + (upcoming[i - 1].duration || 30));
      const currStart = new Date(upcoming[i].date);
      const gap = (currStart - prevEnd) / 60000;
      if (gap >= 5) {
        windows.push({
          start: prevEnd,
          end: currStart,
          durationMinutes: Math.round(gap),
          betweenFrom: upcoming[i - 1].title,
          betweenTo: upcoming[i].title,
          adequacy: gap >= 30 ? "excellent" : gap >= 15 ? "good" : gap >= 10 ? "adequate" : "minimal",
        });
      }
    }

    const totalMin = windows.reduce((s, w) => s + w.durationMinutes, 0);
    const avgMin = windows.length > 0 ? Math.round(totalMin / windows.length) : 0;

    return res.json({
      success: true,
      recovery: {
        windows: windows.slice(0, 20),
        totalWindows: windows.length,
        totalRecoveryMinutes: totalMin,
        avgRecoveryMinutes: avgMin,
        adequateWindows: windows.filter((w) => w.durationMinutes >= 15).length,
        recommendation:
          avgMin < 15
            ? "Add at least 15-minute buffers between meetings for mental recovery."
            : avgMin < 30
              ? "Good recovery gaps. Consider extending to 30 min for better focus."
              : "Excellent recovery windows. Your schedule supports healthy breaks.",
      },
    });
  } catch (error) {
    console.error("Error fetching recovery windows:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch recovery windows" });
  }
};

/**
 * GET /team – team-level wellness metrics
 */
export const getTeamWellness = async (req, res) => {
  try {
    const orgId = req.user?.organization;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const members = await User.find({ organization: orgId })
      .select("name email avatarUrl")
      .limit(30);

    const teamMetrics = await Promise.all(
      members.map(async (member) => {
        const mm = await Meeting.find({
          organization: orgId,
          $or: [{ "participants.user": member._id }, { uploadedBy: member._id }],
          date: { $gte: startOfWeek, $lte: now },
        }).select("date duration");

        const totalMin = mm.reduce((s, m) => s + (m.duration || 30), 0);
        const totalHours = Math.round((totalMin / 60) * 10) / 10;

        let wellnessScore = 95;
        if (totalHours > 25) wellnessScore = 20;
        else if (totalHours > 20) wellnessScore = 35;
        else if (totalHours > 15) wellnessScore = 55;
        else if (totalHours > 10) wellnessScore = 75;

        let riskLevel = "low";
        if (wellnessScore < 30) riskLevel = "critical";
        else if (wellnessScore < 50) riskLevel = "high";
        else if (wellnessScore < 70) riskLevel = "medium";

        return {
          userId: member._id,
          name: member.name,
          email: member.email,
          avatarUrl: member.avatarUrl,
          weeklyHours: totalHours,
          weeklyMeetings: mm.length,
          wellnessScore,
          riskLevel,
        };
      }),
    );

    teamMetrics.sort((a, b) => a.wellnessScore - b.wellnessScore);
    const avgScore = Math.round(
      teamMetrics.reduce((s, m) => s + m.wellnessScore, 0) / Math.max(1, teamMetrics.length),
    );

    return res.json({
      success: true,
      team: {
        members: teamMetrics,
        avgWellnessScore: avgScore,
        atRiskCount: teamMetrics.filter((m) => m.riskLevel === "high" || m.riskLevel === "critical").length,
        teamSize: teamMetrics.length,
        healthDistribution: {
          excellent: teamMetrics.filter((m) => m.wellnessScore >= 80).length,
          good: teamMetrics.filter((m) => m.wellnessScore >= 60 && m.wellnessScore < 80).length,
          atRisk: teamMetrics.filter((m) => m.wellnessScore < 60).length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching team wellness:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch team wellness" });
  }
};

/**
 * PUT /preferences – update wellness preferences
 */
export const updateWellnessPreferences = async (req, res) => {
  try {
    const userId = req.user?._id;
    const orgId = req.user?.organization;
    const prefs = await WellnessPreferences.findOneAndUpdate(
      { user: userId, organization: orgId },
      { $set: req.body },
      { new: true, upsert: true },
    );
    return res.json({ success: true, preferences: prefs });
  } catch (error) {
    console.error("Error updating wellness preferences:", error);
    return res.status(500).json({ success: false, message: "Failed to update preferences" });
  }
};

/**
 * GET /preferences – get wellness preferences
 */
export const getWellnessPreferences = async (req, res) => {
  try {
    const userId = req.user?._id;
    const orgId = req.user?.organization;
    const prefs = await WellnessPreferences.findOne({ user: userId, organization: orgId });
    return res.json({
      success: true,
      preferences: prefs || {
        maxDailyMeetingMinutes: 240,
        maxConsecutiveMeetings: 3,
        preferredBreakMinutes: 15,
        dailyFocusMinutesTarget: 120,
        enableBurnoutAlerts: true,
        burnoutAlertThreshold: "high",
        meetingFreeDays: [],
      },
    });
  } catch (error) {
    console.error("Error fetching wellness preferences:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch preferences" });
  }
};
