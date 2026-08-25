import React, { useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import AppContent from "../context/AppContent";
import meetingWellnessApi from "../services/meetingWellnessApi";
import Navbar from "../components/Navbar.jsx";
import { toast } from "react-toastify";
import {
  Heart,
  Brain,
  Clock,
  Shield,
  Users,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Coffee,
  Activity,
  Settings,
  Target,
  BarChart3,
  Sun,
} from "lucide-react";

/* ─── Utility ──────────────────────────────────────────────────────────────── */
const RISK_COLORS = {
  low: { bg: "bg-green-50 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", border: "border-green-200 dark:border-green-800" },
  medium: { bg: "bg-yellow-50 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", border: "border-yellow-200 dark:border-yellow-800" },
  high: { bg: "bg-orange-50 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800" },
  critical: { bg: "bg-red-50 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-800" },
};

const REC_COLORS = {
  critical: "border-l-red-500",
  warning: "border-l-yellow-500",
  info: "border-l-blue-500",
  positive: "border-l-green-500",
};

const SCORE_RING_COLOR = (score) => {
  if (score >= 70) return "#22c55e";
  if (score >= 50) return "#eab308";
  if (score >= 30) return "#f97316";
  return "#ef4444";
};

/* ─── Score Ring ───────────────────────────────────────────────────────────── */
const ScoreRing = ({ score, size = 120, label }) => {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = SCORE_RING_COLOR(score);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#374151" strokeWidth={8} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-2xl font-bold text-white">{score}</span>
        <span className="text-xs text-gray-400">{label}</span>
      </div>
    </div>
  );
};

/* ─── Bar Chart ────────────────────────────────────────────────────────────── */
const SimpleBarChart = ({ data, labelKey, valueKey, maxValue, color = "#6366f1" }) => {
  const max = maxValue || Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-10 text-right">{d[labelKey]}</span>
          <div className="flex-1 bg-gray-700 rounded-full h-5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min((d[valueKey] / max) * 100, 100)}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-xs text-gray-300 w-12">{d[valueKey]}h</span>
        </div>
      ))}
    </div>
  );
};

/* ─── Main Page ────────────────────────────────────────────────────────────── */
const MeetingWellness = () => {
  const { t } = useTranslation();
  const { activeOrganization } = useContext(AppContent);

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [burnout, setBurnout] = useState(null);
  const [focusTime, setFocusTime] = useState(null);
  const [recovery, setRecovery] = useState(null);
  const [team, setTeam] = useState(null);
  const [preferences, setPreferences] = useState(null);

  const orgId = activeOrganization?._id;

  const fetchData = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [ovRes, brRes, ftRes, rwRes, tmRes, prRes] = await Promise.all([
        meetingWellnessApi.getWellnessOverview(orgId).catch(() => ({ data: {} })),
        meetingWellnessApi.getBurnoutRisk().catch(() => ({ data: {} })),
        meetingWellnessApi.getFocusTimeStats(orgId).catch(() => ({ data: {} })),
        meetingWellnessApi.getRecoveryWindows(orgId).catch(() => ({ data: {} })),
        meetingWellnessApi.getTeamWellness(orgId).catch(() => ({ data: {} })),
        meetingWellnessApi.getPreferences().catch(() => ({ data: {} })),
      ]);
      setOverview(ovRes.data?.overview || null);
      setBurnout(brRes.data?.burnoutRisk || null);
      setFocusTime(ftRes.data?.focusTime || null);
      setRecovery(rwRes.data?.recovery || null);
      setTeam(tmRes.data?.team || null);
      setPreferences(prRes.data?.preferences || null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load wellness data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [orgId]);

  const tabs = [
    { id: "overview", label: "Overview", icon: Heart },
    { id: "burnout", label: "Burnout Risk", icon: Brain },
    { id: "focus", label: "Focus Time", icon: Target },
    { id: "recovery", label: "Recovery", icon: Coffee },
    { id: "team", label: "Team", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="ml-3 text-gray-500 dark:text-gray-400">Loading wellness data…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500" />
            {t("meetingWellness.title", "Meeting Wellness Dashboard")}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t("meetingWellness.subtitle", "Monitor meeting load, burnout risk, focus time, and team wellness")}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === id
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* OVERVIEW TAB */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "overview" && overview && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Wellness Score</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{overview.wellnessScore}</div>
                <div className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${RISK_COLORS[overview.burnoutRisk]?.bg} ${RISK_COLORS[overview.burnoutRisk]?.text}`}>
                  {overview.burnoutRisk} risk
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-indigo-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">This Week</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{overview.totalWeeklyHours}h</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{overview.totalWeeklyMeetings} meetings</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Daily Average</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {Math.round(overview.avgDailyMinutes / 60)}h
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{overview.avgDailyMeetings} meetings/day</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Back-to-Back</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{overview.backToBackCount}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">consecutive meetings</p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Sun className="w-5 h-5 text-yellow-500" />
                  Daily Meeting Hours
                </h3>
                <SimpleBarChart
                  data={overview.dailyBreakdown}
                  labelKey="day"
                  valueKey="hours"
                  color="#6366f1"
                />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Meeting Type Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(overview.typeDistribution).map(([type, count]) => (
                    <div key={type} className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 w-24 capitalize">{type}</span>
                      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${(count / overview.totalWeeklyMeetings) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {overview.recommendations?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Recommendations
                </h3>
                <div className="space-y-3">
                  {overview.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className={`border-l-4 ${REC_COLORS[rec.type] || "border-l-gray-400"} bg-gray-50 dark:bg-gray-700/50 rounded-r-lg p-4`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{rec.title}</div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rec.message}</p>
                      <span className="text-xs text-gray-400 mt-1 inline-block">Impact: {rec.impact}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* BURNOUT RISK TAB */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "burnout" && burnout && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center">
                <div className="relative">
                  <ScoreRing score={burnout.score} size={140} label="Risk Score" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-2">Risk Level</h3>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${RISK_COLORS[burnout.level]?.bg} ${RISK_COLORS[burnout.level]?.text}`}>
                  {burnout.level?.toUpperCase()}
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Trend</span>
                    <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                      {burnout.trend === "increasing" && <TrendingUp className="w-4 h-4 text-red-500" />}
                      {burnout.trend === "decreasing" && <TrendingDown className="w-4 h-4 text-green-500" />}
                      {burnout.trend === "stable" && <Minus className="w-4 h-4 text-yellow-500" />}
                      {burnout.trend}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Avg Weekly</span>
                    <span className="text-gray-700 dark:text-gray-300">{burnout.avgWeeklyHours}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Meetings Analyzed</span>
                    <span className="text-gray-700 dark:text-gray-300">{burnout.totalMeetingsAnalyzed}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-3">Recovery Suggestions</h3>
                <div className="space-y-2">
                  {burnout.recoverySuggestions?.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Weekly Load Chart */}
            {burnout.weeklyLoads?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">4-Week Meeting Load</h3>
                <SimpleBarChart
                  data={burnout.weeklyLoads}
                  labelKey="weekLabel"
                  valueKey="hours"
                  color={burnout.score > 55 ? "#f97316" : "#22c55e"}
                />
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* FOCUS TIME TAB */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "focus" && focusTime && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <Target className="w-5 h-5 text-indigo-500 mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{focusTime.targetMetPercentage}%</div>
                <p className="text-xs text-gray-500">Target Met</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <Clock className="w-5 h-5 text-green-500 mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(focusTime.totalAvailableMinutes / 60)}h</div>
                <p className="text-xs text-gray-500">Available This Week</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <CheckCircle className="w-5 h-5 text-green-500 mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{focusTime.targetMetDays}</div>
                <p className="text-xs text-gray-500">Days Target Met</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <AlertTriangle className="w-5 h-5 text-red-500 mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{focusTime.targetMissDays}</div>
                <p className="text-xs text-gray-500">Days Below Target</p>
              </div>
            </div>

            {/* Daily Focus Windows */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Focus Windows</h3>
              <div className="space-y-3">
                {focusTime.focusWindows?.map((w, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-500 w-10">{w.day}</span>
                    <div className="flex-1">
                      <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative">
                        {/* Meeting blocks */}
                        <div
                          className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full"
                          style={{ width: `${Math.min((w.meetingMinutes / 480) * 100, 100)}%` }}
                        />
                        {/* Target line */}
                        <div
                          className="absolute top-0 h-full w-0.5 bg-yellow-400"
                          style={{ left: `${(focusTime.targetDailyMinutes / 480) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 w-16 text-right">{w.availableMinutes}min free</span>
                    {w.targetMet ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* RECOVERY TAB */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "recovery" && recovery && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <Coffee className="w-5 h-5 text-orange-500 mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{recovery.totalWindows}</div>
                <p className="text-xs text-gray-500">Recovery Windows</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <Clock className="w-5 h-5 text-blue-500 mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{recovery.avgRecoveryMinutes}min</div>
                <p className="text-xs text-gray-500">Average Gap</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <CheckCircle className="w-5 h-5 text-green-500 mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{recovery.adequateWindows}</div>
                <p className="text-xs text-gray-500">Adequate (≥15min)</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <Activity className="w-5 h-5 text-indigo-500 mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{recovery.totalRecoveryMinutes}min</div>
                <p className="text-xs text-gray-500">Total Recovery Time</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Recovery Assessment</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{recovery.recommendation}</p>

              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Upcoming Gaps</h4>
              <div className="space-y-2">
                {recovery.windows?.map((w, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      w.adequacy === "excellent" ? "bg-green-500" :
                      w.adequacy === "good" ? "bg-blue-500" :
                      w.adequacy === "adequate" ? "bg-yellow-500" : "bg-red-500"
                    }`} />
                    <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{w.durationMinutes}min</span> between{" "}
                      <span className="text-gray-500">{w.betweenFrom}</span> → <span className="text-gray-500">{w.betweenTo}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      w.adequacy === "excellent" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      w.adequacy === "good" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                      w.adequacy === "adequate" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {w.adequacy}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TEAM TAB */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "team" && team && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <Users className="w-5 h-5 text-indigo-500 mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{team.teamSize}</div>
                <p className="text-xs text-gray-500">Team Members</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <Heart className="w-5 h-5 text-red-500 mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{team.avgWellnessScore}</div>
                <p className="text-xs text-gray-500">Avg Wellness Score</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <AlertTriangle className="w-5 h-5 text-red-500 mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{team.atRiskCount}</div>
                <p className="text-xs text-gray-500">At Risk Members</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <Shield className="w-5 h-5 text-green-500 mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{team.healthDistribution?.excellent || 0}</div>
                <p className="text-xs text-gray-500">Excellent Health</p>
              </div>
            </div>

            {/* Team Members */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Wellness Overview</h3>
              <div className="space-y-3">
                {team.members?.map((m, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                      {m.name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">{m.name}</div>
                      <div className="text-xs text-gray-500">{m.weeklyHours}h this week · {m.weeklyMeetings} meetings</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${m.wellnessScore}%`,
                            backgroundColor: SCORE_RING_COLOR(m.wellnessScore),
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-8">{m.wellnessScore}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${RISK_COLORS[m.riskLevel]?.bg} ${RISK_COLORS[m.riskLevel]?.text}`}>
                        {m.riskLevel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* SETTINGS TAB */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "settings" && preferences && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Wellness Preferences</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Daily Meeting Minutes</label>
                <input
                  type="number"
                  min={60}
                  max={480}
                  value={preferences.maxDailyMeetingMinutes}
                  onChange={(e) => setPreferences({ ...preferences, maxDailyMeetingMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Current: {Math.round(preferences.maxDailyMeetingMinutes / 60)} hours</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Daily Focus Minutes Target</label>
                <input
                  type="number"
                  min={30}
                  max={480}
                  value={preferences.dailyFocusMinutesTarget}
                  onChange={(e) => setPreferences({ ...preferences, dailyFocusMinutesTarget: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Current: {Math.round(preferences.dailyFocusMinutesTarget / 60)} hours</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Consecutive Meetings</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={preferences.maxConsecutiveMeetings}
                  onChange={(e) => setPreferences({ ...preferences, maxConsecutiveMeetings: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Break Minutes</label>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={preferences.preferredBreakMinutes}
                  onChange={(e) => setPreferences({ ...preferences, preferredBreakMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.enableBurnoutAlerts}
                  onChange={(e) => setPreferences({ ...preferences, enableBurnoutAlerts: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label className="text-sm text-gray-700 dark:text-gray-300">Enable Burnout Alerts</label>
              </div>

              <button
                onClick={async () => {
                  try {
                    await meetingWellnessApi.updatePreferences(preferences);
                    toast.success("Preferences saved!");
                  } catch {
                    toast.error("Failed to save preferences");
                  }
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MeetingWellness;
