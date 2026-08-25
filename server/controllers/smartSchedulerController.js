import {
  SchedulingPreference,
  ScheduledMeeting,
  SchedulingConflict,
} from "../models/smartSchedulerModel.js";

// ═══════════════════════════════════════════
// AVAILABILITY & PREFERENCES
// ═══════════════════════════════════════════

export const getMyPreferences = async (req, res) => {
  try {
    let prefs = await SchedulingPreference.findOne({
      user: req.user._id,
      organization: req.user.organization,
    }).populate("user", "name email");
    if (!prefs) {
      prefs = await SchedulingPreference.create({
        user: req.user._id,
        organization: req.user.organization,
        availability: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
          { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
          { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
          { dayOfWeek: 4, startTime: "09:00", endTime: "17:00" },
          { dayOfWeek: 5, startTime: "09:00", endTime: "17:00" },
        ],
      });
    }
    res.json(prefs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const prefs = await SchedulingPreference.findOneAndUpdate(
      { user: req.user._id, organization: req.user.organization },
      req.body,
      { new: true, upsert: true, runValidators: true }
    );
    res.json(prefs);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════
// SCHEDULED MEETINGS CRUD
// ═══════════════════════════════════════════

export const getScheduledMeetings = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      meetingType,
      status,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = { organization: req.user.organization };
    if (startDate && endDate) {
      filter.startTime = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (meetingType) filter.meetingType = meetingType;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [meetings, total] = await Promise.all([
      ScheduledMeeting.find(filter)
        .sort({ startTime: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("organizer", "name email")
        .populate("participants.user", "name email")
        .lean(),
      ScheduledMeeting.countDocuments(filter),
    ]);

    res.json({ meetings, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createMeeting = async (req, res) => {
  try {
    const meeting = new ScheduledMeeting({
      ...req.body,
      organization: req.user.organization,
      organizer: req.user._id,
    });
    await meeting.save();
    res.status(201).json(meeting);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateMeeting = async (req, res) => {
  try {
    const meeting = await ScheduledMeeting.findOneAndUpdate(
      { _id: req.params.id, organization: req.user.organization },
      req.body,
      { new: true, runValidators: true }
    );
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });
    res.json(meeting);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteMeeting = async (req, res) => {
  try {
    const meeting = await ScheduledMeeting.findOneAndDelete({
      _id: req.params.id,
      organization: req.user.organization,
    });
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });
    res.json({ message: "Meeting deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════
// CONFLICT DETECTION & RESOLUTION
// ═══════════════════════════════════════════

export const detectConflicts = async (req, res) => {
  try {
    const { participantIds, startTime, endTime, excludeMeetingId } = req.query;

    const filter = {
      organization: req.user.organization,
      status: { $in: ["scheduled", "rescheduled"] },
      startTime: { $lt: new Date(endTime) },
      endTime: { $gt: new Date(startTime) },
    };

    if (excludeMeetingId) {
      filter._id = { $ne: excludeMeetingId };
    }

    if (participantIds) {
      const ids = participantIds.split(",");
      filter["participants.user"] = { $in: ids };
    }

    const conflicts = await ScheduledMeeting.find(filter)
      .populate("organizer", "name email")
      .populate("participants.user", "name email")
      .lean();

    res.json({ conflicts, hasConflict: conflicts.length > 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const findAlternativeSlots = async (req, res) => {
  try {
    const { participantIds, duration, startDate, endDate, preferredTime } =
      req.query;

    const dur = parseInt(duration) || 30;
    const start = new Date(startDate || Date.now());
    const end = new Date(endDate || Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Get participant preferences
    const participantPrefs = await SchedulingPreference.find({
      user: { $in: participantIds.split(",") },
      organization: req.user.organization,
    });

    // Get all existing meetings in the range
    const existingMeetings = await ScheduledMeeting.find({
      organization: req.user.organization,
      status: { $in: ["scheduled", "rescheduled"] },
      "participants.user": { $in: participantIds.split(",") },
      startTime: { $gte: start },
      endTime: { $lte: end },
    }).lean();

    // Build availability matrix
    const slots = [];
    const dayMs = 24 * 60 * 60 * 1000;
    const slotStep = 30 * 60 * 1000; // 30 min increments

    for (let d = new Date(start); d <= end; d = new Date(d.getTime() + dayMs)) {
      const dayOfWeek = d.getDay();

      // Check each participant's availability for this day
      const availableParticipants = participantPrefs.filter((p) =>
        p.availability.some(
          (a) =>
            a.dayOfWeek === dayOfWeek &&
            (!a.specificDate ||
              a.specificDate.toDateString() === d.toDateString())
        )
      );

      // Find availability window intersection
      let dayStart = "09:00";
      let dayEnd = "17:00";

      if (availableParticipants.length > 0) {
        const starts = availableParticipants.map(
          (p) =>
            p.availability.find((a) => a.dayOfWeek === dayOfWeek)?.startTime ||
            "09:00"
        );
        const ends = availableParticipants.map(
          (p) =>
            p.availability.find((a) => a.dayOfWeek === dayOfWeek)?.endTime ||
            "17:00"
        );
        dayStart = starts.sort().pop(); // Latest start
        dayEnd = ends.sort()[0]; // Earliest end
      }

      // Generate time slots
      const [sH, sM] = dayStart.split(":").map(Number);
      const [eH, eM] = dayEnd.split(":").map(Number);
      let currentMs =
        d.getTime() + sH * 60 * 60 * 1000 + sM * 60 * 1000;
      const endMs =
        d.getTime() + eH * 60 * 60 * 1000 + eM * 60 * 1000;

      while (currentMs + dur * 60 * 1000 <= endMs) {
        const slotStart = new Date(currentMs);
        const slotEnd = new Date(currentMs + dur * 60 * 1000);

        // Check for conflicts
        const hasConflict = existingMeetings.some(
          (m) =>
            m.startTime < slotEnd && m.endTime > slotStart
        );

        if (!hasConflict) {
          // Score the slot
          let score = 100;

          // Prefer mid-morning and early afternoon
          const hour = slotStart.getHours() + slotStart.getMinutes() / 60;
          if (hour >= 10 && hour <= 11) score += 15;
          else if (hour >= 14 && hour <= 15) score += 10;
          else if (hour < 9 || hour > 17) score -= 30;
          else if (hour >= 12 && hour <= 13) score -= 5;

          // Prefer Tues-Thurs
          const dow = slotStart.getDay();
          if (dow >= 2 && dow <= 4) score += 10;
          else if (dow === 1 || dow === 5) score += 5;
          else score -= 20;

          // If preferred time matches
          if (preferredTime) {
            const prefHour = parseInt(preferredTime.split(":")[0]);
            if (Math.abs(hour - prefHour) <= 1) score += 20;
          }

          // Buffer check
          const hasBuffer = !existingMeetings.some((m) => {
            const bufferMs = 10 * 60 * 1000;
            return (
              m.startTime < new Date(slotEnd.getTime() + bufferMs) &&
              m.endTime > new Date(slotStart.getTime() - bufferMs)
            );
          });
          if (hasBuffer) score += 5;

          slots.push({
            startTime: slotStart,
            endTime: slotEnd,
            score,
            reason: generateSlotReason(score, hour, dow, hasBuffer),
            participantsAvailable: availableParticipants.length,
            totalParticipants: participantIds.split(",").length,
          });
        }

        currentMs += slotStep;
      }
    }

    // Sort by score and return top 10
    const topSlots = slots.sort((a, b) => b.score - a.score).slice(0, 10);

    res.json({ slots: topSlots, totalChecked: slots.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

function generateSlotReason(score, hour, dayOfWeek, hasBuffer) {
  const reasons = [];
  if (score >= 100) reasons.push("Optimal time");
  if (hour >= 10 && hour <= 11) reasons.push("Peak productivity hours");
  if (hour >= 14 && hour <= 15) reasons.push("Good post-lunch slot");
  if (dayOfWeek >= 2 && dayOfWeek <= 4) reasons.push("Mid-week preferred");
  if (hasBuffer) reasons.push("Buffer time available");
  return reasons.join(" • ") || "Available slot";
}

// ═══════════════════════════════════════════
// SMART SCHEDULING
// ═══════════════════════════════════════════

export const smartSchedule = async (req, res) => {
  try {
    const {
      title,
      description,
      participantIds,
      duration,
      priority,
      meetingType,
      preferredDateRange,
      preferredTime,
    } = req.body;

    const start = new Date(preferredDateRange?.start || Date.now());
    const end = new Date(
      preferredDateRange?.end || Date.now() + 14 * 24 * 60 * 60 * 1000
    );

    // Find best slots
    const allIds = [...new Set([req.user._id.toString(), ...participantIds])];

    // Get participant preferences
    const participantPrefs = await SchedulingPreference.find({
      user: { $in: allIds },
      organization: req.user.organization,
    });

    const existingMeetings = await ScheduledMeeting.find({
      organization: req.user.organization,
      status: { $in: ["scheduled", "rescheduled"] },
      "participants.user": { $in: allIds },
      startTime: { $gte: start },
      endTime: { $lte: end },
    }).lean();

    // Find optimal slot
    const dayMs = 24 * 60 * 60 * 1000;
    const dur = parseInt(duration) || 30;
    let bestSlot = null;
    let bestScore = -1;
    const alternatives = [];

    for (
      let d = new Date(start);
      d <= end;
      d = new Date(d.getTime() + dayMs)
    ) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

      // Get participant availability for this day
      const availStarts = [];
      const availEnds = [];
      allIds.forEach((id) => {
        const pref = participantPrefs.find(
          (p) => p.user.toString() === id
        );
        if (pref) {
          const slot = pref.availability.find((a) => a.dayOfWeek === dayOfWeek);
          if (slot) {
            availStarts.push(slot.startTime);
            availEnds.push(slot.endTime);
          }
        }
      });

      if (availStarts.length === 0) continue;

      const dayStart = availStarts.sort().pop();
      const dayEnd = availEnds.sort()[0];

      const [sH, sM] = dayStart.split(":").map(Number);
      const [eH, eM] = dayEnd.split(":").map(Number);
      let currentMs =
        d.getTime() + sH * 60 * 60 * 1000 + sM * 60 * 1000;
      const endMs = d.getTime() + eH * 60 * 60 * 1000 + eM * 60 * 1000;

      while (currentMs + dur * 60 * 1000 <= endMs) {
        const slotStart = new Date(currentMs);
        const slotEnd = new Date(currentMs + dur * 60 * 1000);

        const hasConflict = existingMeetings.some(
          (m) => m.startTime < slotEnd && m.endTime > slotStart
        );

        if (!hasConflict) {
          let score = 100;
          const hour = slotStart.getHours() + slotStart.getMinutes() / 60;

          if (hour >= 10 && hour <= 11) score += 15;
          else if (hour >= 14 && hour <= 15) score += 10;
          else if (hour < 9 || hour > 17) score -= 30;

          if (dayOfWeek >= 2 && dayOfWeek <= 4) score += 10;

          // Priority boosts
          if (priority === "urgent") {
            score += 5; // Just schedule ASAP
          }

          const hasBuffer = !existingMeetings.some((m) => {
            return (
              m.startTime < new Date(slotEnd.getTime() + 10 * 60 * 1000) &&
              m.endTime > new Date(slotStart.getTime() - 10 * 60 * 1000)
            );
          });
          if (hasBuffer) score += 5;

          if (preferredTime) {
            const prefHour = parseInt(preferredTime.split(":")[0]);
            if (Math.abs(hour - prefHour) <= 1) score += 20;
          }

          const entry = {
            startTime: slotStart,
            endTime: slotEnd,
            score,
            reason: generateSlotReason(score, hour, dayOfWeek, hasBuffer),
          };

          if (score > bestScore) {
            bestScore = score;
            bestSlot = entry;
          }
          alternatives.push(entry);
        }

        currentMs += 30 * 60 * 1000;
      }
    }

    if (!bestSlot) {
      return res.status(409).json({
        message: "No available slots found in the given date range",
        suggestion: "Try expanding the date range or reducing the participant list",
      });
    }

    // Create the meeting
    const meeting = new ScheduledMeeting({
      title,
      description,
      organization: req.user.organization,
      organizer: req.user._id,
      participants: allIds.map((id) => ({
        user: id,
        status: id === req.user._id.toString() ? "accepted" : "pending",
      })),
      startTime: bestSlot.startTime,
      endTime: bestSlot.endTime,
      duration: dur,
      priority: priority || "medium",
      meetingType: meetingType || "other",
      smartScheduled: true,
      conflictResolution: {
        hadConflict: false,
        alternativeSlots: alternatives
          .sort((a, b) => b.score - a.score)
          .slice(1, 4),
      },
    });

    await meeting.save();

    res.status(201).json({
      meeting,
      recommendedSlot: bestSlot,
      alternatives: alternatives
        .sort((a, b) => b.score - a.score)
        .slice(1, 4),
      participantsCount: allIds.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════
// ANALYTICS & INSIGHTS
// ═══════════════════════════════════════════

export const getSchedulingAnalytics = async (req, res) => {
  try {
    const orgId = req.user.organization;

    const meetings = await ScheduledMeeting.find({
      organization: orgId,
    }).lean();

    const preferences = await SchedulingPreference.find({
      organization: orgId,
    }).lean();

    const conflicts = await SchedulingConflict.find({
      organization: orgId,
    }).lean();

    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);

    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 7);

    // Basic counts
    const totalMeetings = meetings.length;
    const scheduledMeetings = meetings.filter(
      (m) => m.status === "scheduled"
    ).length;
    const completedMeetings = meetings.filter(
      (m) => m.status === "completed"
    ).length;
    const cancelledMeetings = meetings.filter(
      (m) => m.status === "cancelled"
    ).length;
    const smartScheduled = meetings.filter((m) => m.smartScheduled).length;

    // This week's meetings
    const thisWeekMeetings = meetings.filter(
      (m) =>
        m.startTime >= thisWeekStart &&
        m.startTime < thisWeekEnd &&
        m.status === "scheduled"
    );

    // Meeting type distribution
    const typeDistribution = {};
    meetings.forEach((m) => {
      typeDistribution[m.meetingType] =
        (typeDistribution[m.meetingType] || 0) + 1;
    });

    // Priority distribution
    const priorityDistribution = {};
    meetings.forEach((m) => {
      priorityDistribution[m.priority] =
        (priorityDistribution[m.priority] || 0) + 1;
    });

    // Average duration
    const avgDuration =
      meetings.length > 0
        ? Math.round(
            meetings.reduce((s, m) => s + m.duration, 0) / meetings.length
          )
        : 0;

    // Busiest hours
    const hourDistribution = new Array(24).fill(0);
    meetings.forEach((m) => {
      const hour = new Date(m.startTime).getHours();
      hourDistribution[hour] += 1;
    });
    const busiestHour = hourDistribution.indexOf(
      Math.max(...hourDistribution)
    );

    // Busiest days
    const dayDistribution = new Array(7).fill(0);
    meetings.forEach((m) => {
      const day = new Date(m.startTime).getDay();
      dayDistribution[day] += 1;
    });
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const busiestDay = dayNames[dayDistribution.indexOf(Math.max(...dayDistribution))];

    // Conflict stats
    const totalConflicts = conflicts.length;
    const autoResolved = conflicts.filter(
      (c) => c.resolution?.status === "auto_resolved"
    ).length;
    const pendingConflicts = conflicts.filter(
      (c) => c.resolution?.status === "pending"
    ).length;

    // Weekly trend (last 4 weeks)
    const weeklyTrend = [];
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() - w * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weekMeetings = meetings.filter(
        (m) => m.startTime >= weekStart && m.startTime < weekEnd
      );
      weeklyTrend.push({
        week: weekStart.toISOString().slice(0, 10),
        count: weekMeetings.length,
        smartScheduled: weekMeetings.filter((m) => m.smartScheduled).length,
      });
    }

    // Participant load (who has most meetings)
    const participantLoad = {};
    meetings
      .filter((m) => m.status === "scheduled")
      .forEach((m) => {
        m.participants.forEach((p) => {
          const userId = p.user?.toString() || p.user;
          participantLoad[userId] = (participantLoad[userId] || 0) + 1;
        });
      });
    const topParticipants = Object.entries(participantLoad)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([userId, count]) => ({ userId, meetingCount: count }));

    // Preference stats
    const avgBuffer =
      preferences.length > 0
        ? Math.round(
            preferences.reduce((s, p) => s + p.bufferBetweenMeetings, 0) /
              preferences.length
          )
        : 10;
    const avgMaxMeetings =
      preferences.length > 0
        ? Math.round(
            preferences.reduce((s, p) => s + p.maxMeetingsPerDay, 0) /
              preferences.length
          )
        : 6;

    // Upcoming meetings (next 7 days)
    const upcomingEnd = new Date(now);
    upcomingEnd.setDate(now.getDate() + 7);
    const upcomingMeetings = meetings
      .filter(
        (m) =>
          m.startTime >= now &&
          m.startTime <= upcomingEnd &&
          m.status === "scheduled"
      )
      .sort((a, b) => a.startTime - b.startTime)
      .slice(0, 10);

    res.json({
      summary: {
        totalMeetings,
        scheduledMeetings,
        completedMeetings,
        cancelledMeetings,
        smartScheduled,
        thisWeekCount: thisWeekMeetings.length,
        avgDuration,
        busiestHour,
        busiestDay,
        totalConflicts,
        autoResolved,
        pendingConflicts,
        avgBuffer,
        avgMaxMeetings,
      },
      typeDistribution: Object.entries(typeDistribution).map(
        ([type, count]) => ({ type, count })
      ),
      priorityDistribution: Object.entries(priorityDistribution).map(
        ([priority, count]) => ({ priority, count })
      ),
      hourDistribution: hourDistribution.map((count, hour) => ({
        hour,
        count,
      })),
      dayDistribution: dayNames.map((name, i) => ({
        day: name,
        count: dayDistribution[i],
      })),
      weeklyTrend,
      topParticipants,
      upcomingMeetings,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════
// TEAM AVAILABILITY VIEW
// ═══════════════════════════════════════════

export const getTeamAvailability = async (req, res) => {
  try {
    const { date, duration } = req.query;
    const targetDate = new Date(date || Date.now());
    const dayOfWeek = targetDate.getDay();
    const dur = parseInt(duration) || 30;

    const preferences = await SchedulingPreference.find({
      organization: req.user.organization,
    })
      .populate("user", "name email")
      .lean();

    const dayMs = 24 * 60 * 60 * 1000;
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay.getTime() + dayMs);

    const existingMeetings = await ScheduledMeeting.find({
      organization: req.user.organization,
      status: { $in: ["scheduled", "rescheduled"] },
      startTime: { $gte: startOfDay, $lt: endOfDay },
    })
      .populate("participants.user", "name email")
      .lean();

    // Build team availability timeline
    const teamMembers = preferences.map((pref) => {
      const availSlot = pref.availability.find(
        (a) => a.dayOfWeek === dayOfWeek
      );
      const userMeetings = existingMeetings.filter((m) =>
        m.participants.some(
          (p) => (p.user?._id || p.user)?.toString() === pref.user?._id?.toString()
        )
      );

      const busySlots = userMeetings.map((m) => ({
        startTime: m.startTime,
        endTime: m.endTime,
        meetingTitle: m.title,
      }));

      // Generate available 30-min blocks
      const availableBlocks = [];
      if (availSlot) {
        const [sH, sM] = availSlot.startTime.split(":").map(Number);
        const [eH, eM] = availSlot.endTime.split(":").map(Number);
        let current =
          startOfDay.getTime() + sH * 60 * 60 * 1000 + sM * 60 * 1000;
        const endMs =
          startOfDay.getTime() + eH * 60 * 60 * 1000 + eM * 60 * 1000;

        while (current + dur * 60 * 1000 <= endMs) {
          const blockStart = new Date(current);
          const blockEnd = new Date(current + dur * 60 * 1000);
          const isBusy = busySlots.some(
            (b) => b.startTime < blockEnd && b.endTime > blockStart
          );

          if (!isBusy) {
            availableBlocks.push({
              startTime: blockStart,
              endTime: blockEnd,
            });
          }
          current += 30 * 60 * 1000;
        }
      }

      return {
        user: pref.user,
        availability: availSlot || null,
        busySlots,
        availableBlocks,
        totalAvailableSlots: availableBlocks.length,
        focusTimeBlocks: pref.focusTimeBlocks || [],
      };
    });

    // Find common free slots across all team members
    const allAvailable = teamMembers.filter((m) => m.availability);
    let commonSlots = [];

    if (allAvailable.length > 0) {
      const firstAvail = allAvailable[0].availableBlocks;
      commonSlots = firstAvail.filter((block) =>
        allAvailable.every((member) =>
          member.availableBlocks.some(
            (b) =>
              b.startTime.getTime() === block.startTime.getTime() &&
              b.endTime.getTime() === block.endTime.getTime()
          )
        )
      );
    }

    res.json({
      date: targetDate,
      duration: dur,
      teamMembers,
      commonSlots,
      totalMembers: teamMembers.length,
      availableMembers: allAvailable.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════
// CONFLICT MANAGEMENT
// ═══════════════════════════════════════════

export const getConflicts = async (req, res) => {
  try {
    const conflicts = await SchedulingConflict.find({
      organization: req.user.organization,
    })
      .populate("meeting1")
      .populate("meeting2")
      .populate("affectedParticipants", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ conflicts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const resolveConflict = async (req, res) => {
  try {
    const { conflictId } = req.params;
    const { action, resolution } = req.body;

    const conflict = await SchedulingConflict.findByIdAndUpdate(
      conflictId,
      {
        "resolution.status": "manually_resolved",
        "resolution.action": action,
        "resolution.resolvedBy": req.user._id,
        "resolution.resolvedAt": new Date(),
      },
      { new: true }
    );

    if (!conflict) {
      return res.status(404).json({ message: "Conflict not found" });
    }

    res.json(conflict);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════
// RECOMMENDATIONS
// ═══════════════════════════════════════════

export const getRecommendations = async (req, res) => {
  try {
    const orgId = req.user.organization;

    const [meetings, preferences] = await Promise.all([
      ScheduledMeeting.find({ organization: orgId }).lean(),
      SchedulingPreference.find({ organization: orgId }).lean(),
    ]);

    const recommendations = [];

    // Check for meeting overload
    const upcoming = meetings.filter(
      (m) =>
        m.startTime >= new Date() &&
        m.startTime <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) &&
        m.status === "scheduled"
    );
    if (upcoming.length > 20) {
      recommendations.push({
        type: "meeting_overload",
        title: "High Meeting Load Detected",
        description: `You have ${upcoming.length} meetings scheduled this week. Consider declining non-essential meetings.`,
        priority: "high",
        icon: "⚠️",
        action: "Review and prioritize meetings",
      });
    }

    // Check for back-to-back meetings
    const sortedMeetings = [...upcoming].sort(
      (a, b) => new Date(a.startTime) - new Date(b.startTime)
    );
    let backToBackCount = 0;
    for (let i = 1; i < sortedMeetings.length; i++) {
      const prevEnd = new Date(sortedMeetings[i - 1].endTime);
      const currStart = new Date(sortedMeetings[i].startTime);
      const gapMinutes = (currStart - prevEnd) / (1000 * 60);
      if (gapMinutes < 10) backToBackCount++;
    }
    if (backToBackCount > 3) {
      recommendations.push({
        type: "back_to_back",
        title: "Too Many Back-to-Back Meetings",
        description: `${backToBackCount} meetings have less than 10 minutes between them. Add buffer time to stay productive.`,
        priority: "medium",
        icon: "🔄",
        action: "Add 10-minute buffers between meetings",
      });
    }

    // Check for no buffer preference
    const lowBufferPrefs = preferences.filter(
      (p) => p.bufferBetweenMeetings < 5
    );
    if (lowBufferPrefs.length > 0) {
      recommendations.push({
        type: "low_buffer",
        title: "Increase Buffer Time",
        description: `${lowBufferPrefs.length} team members have less than 5 minutes buffer between meetings. Consider increasing to 10 minutes.`,
        priority: "medium",
        icon: "⏰",
        action: "Update scheduling preferences",
      });
    }

    // Check for meeting time clustering
    const hourCounts = new Array(24).fill(0);
    upcoming.forEach((m) => {
      const hour = new Date(m.startTime).getHours();
      hourCounts[hour]++;
    });
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    if (hourCounts[peakHour] > upcoming.length * 0.4) {
      recommendations.push({
        type: "time_clustering",
        title: "Meeting Time Clustering",
        description: `${Math.round((hourCounts[peakHour] / upcoming.length) * 100)}% of meetings are at ${peakHour}:00. Spread meetings across different time slots.`,
        priority: "low",
        icon: "📊",
        action: "Distribute meetings across the day",
      });
    }

    // Smart scheduling adoption
    const smartCount = meetings.filter((m) => m.smartScheduled).length;
    if (meetings.length > 0) {
      const adoptionRate = Math.round((smartCount / meetings.length) * 100);
      if (adoptionRate < 30) {
        recommendations.push({
          type: "low_adoption",
          title: "Increase Smart Scheduling Usage",
          description: `Only ${adoptionRate}% of meetings use smart scheduling. Let the AI find optimal slots for you.`,
          priority: "low",
          icon: "🤖",
          action: "Use Smart Schedule when creating meetings",
        });
      }
    }

    // Focus time protection
    const focusTimePrefs = preferences.filter(
      (p) => p.focusTimeBlocks && p.focusTimeBlocks.length > 0
    );
    if (focusTimePrefs.length < preferences.length * 0.3) {
      recommendations.push({
        type: "focus_time",
        title: "Enable Focus Time Blocks",
        description:
          "Most team members don't have focus time blocks set up. Protected focus time improves deep work productivity.",
        priority: "medium",
        icon: "🎯",
        action: "Set up focus time blocks in preferences",
      });
    }

    // Positive insight
    if (smartCount > 0) {
      recommendations.push({
        type: "positive",
        title: "Smart Scheduling Working",
        description: `${smartCount} meetings were optimally scheduled, saving an estimated ${smartCount * 15} minutes of conflict resolution time.`,
        priority: "info",
        icon: "✅",
        action: null,
      });
    }

    res.json({ recommendations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
