import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  Users,
  Zap,
  AlertTriangle,
  CheckCircle,
  Search,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Target,
  BarChart3,
  Brain,
  Shield,
  ArrowRight,
  Timer,
  RefreshCw,
  Settings,
  Sparkles,
  TrendingUp,
  CalendarClock,
  UserCheck,
  Flame,
} from "lucide-react";
import {
  getMyPreferences,
  updatePreferences,
  getScheduledMeetings,
  createMeeting,
  smartSchedule,
  getSchedulingAnalytics,
  getTeamAvailability,
  detectConflicts,
  getRecommendations,
  getConflicts,
} from "../services/smartSchedulerApi";

const MEETING_TYPES = [
  { value: "standup", label: "Standup", icon: "📋", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "1on1", label: "1-on-1", icon: "🤝", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  { value: "team", label: "Team", icon: "👥", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  { value: "allhands", label: "All Hands", icon: "🏢", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  { value: "workshop", label: "Workshop", icon: "🛠️", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
  { value: "brainstorm", label: "Brainstorm", icon: "💡", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" },
  { value: "review", label: "Review", icon: "📝", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  { value: "other", label: "Other", icon: "📌", color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
];

const PRIORITY_COLORS = {
  low: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const formatTime = (date) => {
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

const StatCard = ({ icon: Icon, label, value, subtext, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
    <div className={`p-2 rounded-lg w-fit mb-2 ${color || "bg-blue-100 dark:bg-blue-900/30"}`}>
      <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
    </div>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    {subtext && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtext}</p>}
  </div>
);

const MeetingTypeBadge = ({ type }) => {
  const meta = MEETING_TYPES.find((t) => t.value === type) || MEETING_TYPES[7];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${meta.color}`}>
      {meta.icon} {meta.label}
    </span>
  );
};

const DayColumn = ({ day, date, meetings, onSlotClick }) => {
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8AM to 7PM
  const isToday = new Date().toDateString() === date.toDateString();

  return (
    <div className={`flex-1 min-w-[100px] border-r border-gray-100 dark:border-gray-700 last:border-r-0 ${isToday ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}>
      <div className={`text-center py-2 border-b border-gray-100 dark:border-gray-700 ${isToday ? "bg-blue-100 dark:bg-blue-900/30" : "bg-gray-50 dark:bg-gray-800"}`}>
        <p className="text-xs font-medium text-gray-500">{DAY_NAMES[date.getDay()]}</p>
        <p className={`text-lg font-bold ${isToday ? "text-blue-600" : "text-gray-900 dark:text-white"}`}>{date.getDate()}</p>
      </div>
      <div className="relative">
        {hours.map((hour) => (
          <div key={hour} className="h-12 border-b border-gray-50 dark:border-gray-800 relative">
            <span className="absolute -top-2 left-1 text-[9px] text-gray-400">{hour}:00</span>
          </div>
        ))}
        {meetings.map((m) => {
          const start = new Date(m.startTime);
          const end = new Date(m.endTime);
          const startHour = start.getHours() + start.getMinutes() / 60;
          const endHour = end.getHours() + end.getMinutes() / 60;
          const top = (startHour - 8) * 48;
          const height = Math.max((endHour - startHour) * 48, 24);
          const typeMeta = MEETING_TYPES.find((t) => t.value === m.meetingType) || MEETING_TYPES[7];
          return (
            <div
              key={m._id}
              className={`absolute left-1 right-1 rounded-lg px-2 py-1 text-[10px] font-medium overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border ${m.smartScheduled ? "border-emerald-300 dark:border-emerald-700" : "border-gray-200 dark:border-gray-600"}`}
              style={{
                top: `${top}px`,
                height: `${height}px`,
                backgroundColor: m.smartScheduled ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)",
                color: m.smartScheduled ? "#059669" : "#2563eb",
              }}
              title={`${m.title} (${formatTime(m.startTime)} - ${formatTime(m.endTime)})`}
            >
              <p className="font-semibold truncate">{m.smartScheduled && "🤖 "}{m.title}</p>
              {height > 30 && <p className="truncate opacity-75">{formatTime(m.startTime)} - {formatTime(m.endTime)}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SmartScheduleModal = ({ onClose, onSubmit, loading }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    duration: 30,
    priority: "medium",
    meetingType: "team",
    preferredTime: "10:00",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Sparkles className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Smart Schedule</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Our AI will find the optimal time slot considering everyone's availability, preferences, and meeting load.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Meeting title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400"
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Duration</label>
              <select
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Meeting Type</label>
              <select
                value={form.meetingType}
                onChange={(e) => setForm({ ...form, meetingType: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {MEETING_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Preferred Time</label>
              <input
                type="time"
                value={form.preferredTime}
                onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Finding optimal slot...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Smart Schedule
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const RecommendationCard = ({ rec }) => {
  const priorityColor = {
    high: "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10",
    medium: "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10",
    low: "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10",
    info: "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10",
  };

  return (
    <div className={`p-4 rounded-xl border-l-4 ${priorityColor[rec.priority] || priorityColor.info}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{rec.icon}</span>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{rec.title}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rec.description}</p>
          {rec.action && (
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
              <ArrowRight className="h-3 w-3" /> {rec.action}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════

const SmartMeetingScheduler = () => {
  const [meetings, setMeetings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [teamAvailability, setTeamAvailability] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("calendar");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [showSmartModal, setShowSmartModal] = useState(false);
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartResult, setSmartResult] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const weekStart = new Date(selectedDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + weekOffset * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const [meetingsRes, analyticsRes, teamRes, recsRes, conflictsRes] = await Promise.all([
        getScheduledMeetings({
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString(),
        }),
        getSchedulingAnalytics(),
        getTeamAvailability({
          date: selectedDate.toISOString(),
          duration: 30,
        }),
        getRecommendations(),
        getConflicts(),
      ]);

      setMeetings(meetingsRes.meetings || []);
      setAnalytics(analyticsRes);
      setTeamAvailability(teamRes);
      setRecommendations(recsRes.recommendations || []);
      setConflicts(conflictsRes.conflicts || []);
    } catch (err) {
      console.error("Failed to fetch scheduler data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, weekOffset]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSmartSchedule = async (data) => {
    try {
      setSmartLoading(true);
      const result = await smartSchedule({
        ...data,
        participantIds: [],
        preferredDateRange: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });
      setSmartResult(result);
      setShowSmartModal(false);
      fetchAll();
    } catch (err) {
      console.error("Smart scheduling failed:", err);
    } finally {
      setSmartLoading(false);
    }
  };

  const getWeekDays = () => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const getMeetingsForDay = (date) => {
    const dayStr = date.toDateString();
    return meetings.filter(
      (m) => new Date(m.startTime).toDateString() === dayStr
    );
  };

  const tabs = [
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "team", label: "Team Availability", icon: Users },
    { id: "conflicts", label: "Conflicts", icon: AlertTriangle },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "recommendations", label: "AI Insights", icon: Brain },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500">Loading scheduler...</p>
        </div>
      </div>
    );
  }

  const summary = analytics?.summary || {};
  const weekDays = getWeekDays();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarClock className="h-7 w-7 text-emerald-600" />
            Smart Meeting Scheduler
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            AI-powered scheduling with conflict detection and availability matching
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAll}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors flex items-center gap-2 text-sm"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={() => setShowSmartModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2 shadow-sm"
          >
            <Sparkles className="h-4 w-4" /> Smart Schedule
          </button>
        </div>
      </div>

      {/* Smart Result Banner */}
      {smartResult && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">Meeting Scheduled! 🎉</h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                <strong>{smartResult.meeting?.title}</strong> scheduled for{" "}
                {smartResult.recommendedSlot && formatDate(smartResult.recommendedSlot.startTime)} at{" "}
                {smartResult.recommendedSlot && formatTime(smartResult.recommendedSlot.startTime)}
                {smartResult.recommendedSlot?.reason && ` — ${smartResult.recommendedSlot.reason}`}
              </p>
              <button
                onClick={() => setSmartResult(null)}
                className="text-xs text-emerald-600 hover:text-emerald-800 mt-1 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.id === "conflicts" && conflicts.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold bg-red-500 text-white rounded-full">
                {conflicts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Calendar Tab */}
      {activeTab === "calendar" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset(weekOffset - 1)}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {weekDays[0].toLocaleDateString("en-US", { month: "long", day: "numeric" })} —{" "}
                {weekDays[6].toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </span>
              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                className="px-3 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-200"
              >
                Today
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {meetings.length} meetings this week
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="flex overflow-x-auto">
              {weekDays.map((day) => (
                <DayColumn
                  key={day.toISOString()}
                  day={day}
                  date={day}
                  meetings={getMeetingsForDay(day)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Team Availability Tab */}
      {activeTab === "team" && teamAvailability && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Team Members" value={teamAvailability.totalMembers} color="bg-blue-100 dark:bg-blue-900/30" />
            <StatCard icon={UserCheck} label="Available Today" value={teamAvailability.availableMembers} color="bg-green-100 dark:bg-green-900/30" />
            <StatCard icon={Calendar} label="Common Slots" value={teamAvailability.commonSlots?.length || 0} color="bg-purple-100 dark:bg-purple-900/30" />
            <StatCard icon={Timer} label="Meeting Duration" value={`${teamAvailability.duration} min`} color="bg-amber-100 dark:bg-amber-900/30" />
          </div>

          {/* Team Member Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(teamAvailability.teamMembers || []).map((member) => (
              <div
                key={member.user?._id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 font-bold text-sm">
                    {member.user?.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{member.user?.name || "Unknown"}</p>
                    <p className="text-xs text-gray-500">{member.user?.email || ""}</p>
                  </div>
                </div>

                {member.availability ? (
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Available: {member.availability.startTime} - {member.availability.endTime}
                  </div>
                ) : (
                  <div className="text-xs text-red-500 mb-2">Not available today</div>
                )}

                <div className="text-xs text-gray-500 mb-1">
                  {member.totalAvailableSlots} available {teamAvailability.duration}-min slots
                </div>

                {/* Busy slots */}
                {member.busySlots.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-[10px] font-medium text-gray-400 uppercase">Busy:</p>
                    {member.busySlots.map((slot, i) => (
                      <div key={i} className="px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded text-[10px] text-red-600 dark:text-red-400 truncate">
                        {formatTime(slot.startTime)} - {slot.meetingTitle}
                      </div>
                    ))}
                  </div>
                )}

                {/* Available blocks */}
                {member.availableBlocks.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-[10px] font-medium text-gray-400 uppercase">Free:</p>
                    <div className="flex flex-wrap gap-1">
                      {member.availableBlocks.slice(0, 6).map((block, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-green-50 dark:bg-green-900/20 rounded text-[9px] text-green-600 dark:text-green-400">
                          {formatTime(block.startTime)}
                        </span>
                      ))}
                      {member.availableBlocks.length > 6 && (
                        <span className="text-[9px] text-gray-400">+{member.availableBlocks.length - 6} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Common Free Slots */}
          {teamAvailability.commonSlots?.length > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4" /> Common Free Slots (Everyone Available)
              </h3>
              <div className="flex flex-wrap gap-2">
                {teamAvailability.commonSlots.map((slot, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-700 rounded-lg text-sm font-medium text-emerald-700 dark:text-emerald-400"
                  >
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conflicts Tab */}
      {activeTab === "conflicts" && (
        <div className="space-y-4">
          {conflicts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {conflicts.map((conflict) => (
                <div
                  key={conflict._id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 p-4 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {conflict.conflictType?.replace(/_/g, " ").toUpperCase()}
                    </h3>
                    <span className={`ml-auto px-2 py-0.5 text-[10px] font-medium rounded-full ${
                      conflict.resolution?.status === "resolved"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {conflict.resolution?.status || "pending"}
                    </span>
                  </div>
                  {conflict.affectedParticipants?.length > 0 && (
                    <p className="text-xs text-gray-500">
                      {conflict.affectedParticipants.length} participants affected
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Shield className="h-12 w-12 text-green-300 dark:text-green-700 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No conflicts detected! 🎉</p>
              <p className="text-sm text-gray-400 mt-1">All meetings are properly scheduled.</p>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Calendar} label="Total Meetings" value={summary.totalMeetings || 0} color="bg-blue-100 dark:bg-blue-900/30" />
            <StatCard icon={Zap} label="Smart Scheduled" value={summary.smartScheduled || 0} subtext={`${summary.totalMeetings ? Math.round((summary.smartScheduled / summary.totalMeetings) * 100) : 0}% adoption`} color="bg-emerald-100 dark:bg-emerald-900/30" />
            <StatCard icon={Clock} label="Avg Duration" value={`${summary.avgDuration || 0}m`} color="bg-amber-100 dark:bg-amber-900/30" />
            <StatCard icon={Flame} label="Busiest Hour" value={`${summary.busiestHour || 9}:00`} subtext={summary.busiestDay} color="bg-red-100 dark:bg-red-900/30" />
          </div>

          {/* Weekly Trend */}
          {analytics.weeklyTrend?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Weekly Meeting Trend</h3>
              <div className="flex items-end gap-3 h-32">
                {analytics.weeklyTrend.map((week) => {
                  const maxCount = Math.max(...analytics.weeklyTrend.map((w) => w.count), 1);
                  const height = (week.count / maxCount) * 100;
                  return (
                    <div key={week.week} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{week.count}</span>
                      <div className="w-full bg-emerald-500 rounded-t-md transition-all" style={{ height: `${height}%` }} />
                      <span className="text-[10px] text-gray-400">{week.week.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hour Distribution */}
          {analytics.hourDistribution?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Meetings by Hour</h3>
              <div className="flex items-end gap-1 h-32">
                {analytics.hourDistribution.slice(8, 19).map((item) => {
                  const maxCount = Math.max(...analytics.hourDistribution.map((h) => h.count), 1);
                  const height = (item.count / maxCount) * 100;
                  return (
                    <div key={item.hour} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] text-gray-500">{item.count}</span>
                      <div className={`w-full rounded-t-md transition-all ${item.hour === summary.busiestHour ? "bg-red-500" : "bg-blue-400"}`} style={{ height: `${Math.max(height, 4)}%` }} />
                      <span className="text-[9px] text-gray-400">{item.hour}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Type Distribution */}
          {analytics.typeDistribution?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Meeting Types</h3>
              <div className="space-y-2">
                {analytics.typeDistribution.sort((a, b) => b.count - a.count).map((item) => {
                  const meta = MEETING_TYPES.find((t) => t.value === item.type) || MEETING_TYPES[7];
                  const maxCount = Math.max(...analytics.typeDistribution.map((t) => t.count), 1);
                  return (
                    <div key={item.type} className="flex items-center gap-3">
                      <span className="text-sm w-6">{meta.icon}</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 w-20">{meta.label}</span>
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(item.count / maxCount) * 100}%` }} />
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white w-8 text-right">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === "recommendations" && (
        <div className="space-y-4">
          {recommendations.length > 0 ? (
            recommendations.map((rec, i) => (
              <RecommendationCard key={i} rec={rec} />
            ))
          ) : (
            <div className="text-center py-16">
              <Brain className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No recommendations at this time</p>
            </div>
          )}
        </div>
      )}

      {/* Smart Schedule Modal */}
      {showSmartModal && (
        <SmartScheduleModal
          onClose={() => setShowSmartModal(false)}
          onSubmit={handleSmartSchedule}
          loading={smartLoading}
        />
      )}
    </div>
  );
};

export default SmartMeetingScheduler;
