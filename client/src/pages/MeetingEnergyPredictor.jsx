import React, { useState, useMemo } from "react";

// ─── Data ──────────────────────────────────────────────────────────

const ENERGY_FACTORS = [
  { id: "duration", name: "Meeting Duration", weight: 0.25, icon: "⏱️", description: "Longer meetings drain more energy" },
  { id: "timeOfDay", name: "Time of Day", weight: 0.2, icon: "🕐", description: "Energy varies with circadian rhythm" },
  { id: "backToBack", name: "Back-to-Back Count", weight: 0.2, icon: "🔗", description: "Consecutive meetings compound fatigue" },
  { id: "participantCount", name: "Participant Count", icon: "👥", weight: 0.15, description: "More people = more cognitive load" },
  { id: "meetingType", name: "Meeting Type", weight: 0.1, icon: "📋", description: "Brainstorm vs status update" },
  { id: "dayOfWeek", name: "Day of Week", weight: 0.1, icon: "📅", description: "Energy patterns across the week" }
]

const MEETING_TYPES = [
  { id: "standup", name: "Daily Standup", energyImpact: 15, duration: 15, optimalTime: "09:00" },
  { id: "brainstorm", name: "Brainstorm Session", energyImpact: 45, duration: 60, optimalTime: "10:00" },
  { id: "review", name: "Code/Design Review", energyImpact: 30, duration: 45, optimalTime: "14:00" },
  { id: "one-on-one", name: "1:1 Meeting", energyImpact: 20, duration: 30, optimalTime: "11:00" },
  { id: "all-hands", name: "All Hands", energyImpact: 40, duration: 60, optimalTime: "10:00" },
  { id: "retrospective", name: "Retrospective", energyImpact: 35, duration: 60, optimalTime: "15:00" },
  { id: "planning", name: "Sprint Planning", energyImpact: 50, duration: 90, optimalTime: "09:30" },
  { id: "status", name: "Status Update", energyImpact: 15, duration: 30, optimalTime: "16:00" }
]

const WEEKLY_SCHEDULE = [
  { day: "Monday", meetings: [
    { time: "09:00", name: "Daily Standup", type: "standup", duration: 15, participants: 6 },
    { time: "10:00", name: "Sprint Planning", type: "planning", duration: 90, participants: 8 },
    { time: "14:00", name: "Design Review", type: "review", duration: 45, participants: 4 }
  ]},
  { day: "Tuesday", meetings: [
    { time: "09:00", name: "Daily Standup", type: "standup", duration: 15, participants: 6 },
    { time: "11:00", name: "1:1 with Manager", type: "one-on-one", duration: 30, participants: 2 },
    { time: "13:00", name: "Brainstorm: Q4 Goals", type: "brainstorm", duration: 60, participants: 10 },
    { time: "15:00", name: "Team Retro", type: "retrospective", duration: 60, participants: 7 }
  ]},
  { day: "Wednesday", meetings: [
    { time: "09:00", name: "Daily Standup", type: "standup", duration: 15, participants: 6 },
    { time: "10:30", name: "Architecture Review", type: "review", duration: 45, participants: 5 },
    { time: "14:00", name: "Cross-team Sync", type: "status", duration: 30, participants: 12 }
  ]},
  { day: "Thursday", meetings: [
    { time: "09:00", name: "Daily Standup", type: "standup", duration: 15, participants: 6 },
    { time: "10:00", name: "All Hands", type: "all-hands", duration: 60, participants: 25 },
    { time: "13:30", name: "1:1 with PM", type: "one-on-one", duration: 30, participants: 2 },
    { time: "15:00", name: "Code Review Session", type: "review", duration: 45, participants: 3 }
  ]},
  { day: "Friday", meetings: [
    { time: "09:00", name: "Daily Standup", type: "standup", duration: 15, participants: 6 },
    { time: "11:00", name: "Week Demo", type: "status", duration: 30, participants: 15 },
    { time: "14:00", name: "Planning Poker", type: "planning", duration: 45, participants: 6 }
  ]}
]

const ENERGY_TIPS = [
  { title: "Schedule deep work before 10 AM", description: "Your cognitive energy peaks in the morning. Protect this time for focused work.", impact: "high", icon: "🧠" },
  { title: "Take 5-min breaks between meetings", description: "Even a short break allows your brain to reset and recharge.", impact: "high", icon: "☕" },
  { title: "Move meetings to standing format", description: "Standing meetings are 34% shorter and keep energy levels higher.", impact: "medium", icon: "🧍" },
  { title: "Batch similar meetings together", description: "Context switching between meeting types drains extra energy.", impact: "medium", icon: "📦" },
  { title: "Use async updates for status meetings", description: "Replace 30-min status meetings with written updates when possible.", impact: "high", icon: "📝" },
  { title: "Block Friday afternoons for recovery", description: "End the week with lighter tasks to recharge for Monday.", impact: "low", icon: "🔋" },
  { title: "Limit meetings to 50 minutes", description: "Build in 10-min buffers for mental breaks and preparation.", impact: "medium", icon: "⏰" },
  { title: "Prioritize 1:1s over group meetings", meaning: "Smaller meetings are less draining and more productive.", impact: "medium", icon: "👥" }
]

// ─── Helpers ───────────────────────────────────────────────────────

function getEnergyColor(level) {
  if (level >= 80) return "#10b981"
  if (level >= 60) return "#f59e0b"
  if (level >= 40) return "#f97316"
  return "#ef4444"
}

function getEnergyLabel(level) {
  if (level >= 80) return "High Energy"
  if (level >= 60) return "Moderate"
  if (level >= 40) return "Low Energy"
  return "Burnout Risk"
}

function getEnergyGradient(level) {
  if (level >= 80) return "linear-gradient(135deg, #10b98110, #06b6d410)"
  if (level >= 60) return "linear-gradient(135deg, #f59e0b10, #f9731610)"
  if (level >= 40) return "linear-gradient(135deg, #f9731610, #ef444410)"
  return "linear-gradient(135deg, #ef444410, #dc262610)"
}

function formatDuration(mins) {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ─── Sub-Components ────────────────────────────────────────────────

function KPICard({ icon, label, value, color, sub }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${color}15` }}>
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
          <div className="text-sm text-gray-500">{label}</div>
          {sub && <div className="text-xs mt-0.5" style={{ color }}>{sub}</div>}
        </div>
      </div>
    </div>
  )
}

function EnergyRing({ level, size = 120 }) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (level / 100) * circumference * 0.75
  const color = getEnergyColor(level)
  const grade = level >= 90 ? "A+" : level >= 80 ? "A" : level >= 70 ? "B+" : level >= 60 ? "B" : level >= 50 ? "C" : "D"

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(135deg)" }}>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="8"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`} strokeLinecap="round" />
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{level}%</span>
          <span className="text-sm font-bold" style={{ color }}>{grade}</span>
        </div>
      </div>
      <span className="text-xs text-gray-500">{getEnergyLabel(level)}</span>
    </div>
  )
}

function EnergyBar({ label, value, max = 100, color }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-semibold" style={{ color }}>{value}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  )
}

function MeetingCard({ meeting, energyImpact }) {
  const type = MEETING_TYPES.find(t => t.id === meeting.type)
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
      <div className="text-center min-w-[50px]">
        <div className="text-xs text-gray-500">{meeting.time}</div>
        <div className="text-sm font-bold text-gray-900 dark:text-white">{meeting.duration}m</div>
      </div>
      <div className="w-px h-10 bg-gray-300 dark:bg-gray-600" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{meeting.name}</div>
        <div className="text-xs text-gray-500">{meeting.participants} participants · {type?.name}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-bold" style={{ color: getEnergyColor(100 - energyImpact) }}>
          -{energyImpact}%
        </div>
        <div className="text-xs text-gray-500">energy</div>
      </div>
    </div>
  )
}

function HourlyChart({ hours }) {
  const maxVal = Math.max(...hours.map(h => h.value), 1)
  return (
    <div className="flex items-end gap-1 h-32">
      {hours.map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t transition-all duration-300" style={{
            height: `${(h.value / maxVal) * 100}%`,
            background: getEnergyColor(h.value),
            minHeight: '4px'
          }} />
          <span className="text-[9px] text-gray-500 -rotate-45 origin-top-left whitespace-nowrap">{h.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────

export default function MeetingEnergyPredictor() {
  const [selectedDay, setSelectedDay] = useState(0)
  const [selectedMeeting, setSelectedMeeting] = useState(null)

  const daySchedule = WEEKLY_SCHEDULE[selectedDay]

  // Calculate energy for each hour
  const hourlyEnergy = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const hour = 8 + i
      const timeStr = `${String(hour).padStart(2, "0")}:00`
      const meetingsAtHour = daySchedule.meetings.filter(m => {
        const mHour = parseInt(m.time.split(":")[0])
        return mHour === hour || (mHour < hour && mHour + Math.ceil(m.duration / 60) > hour)
      })
      const drain = meetingsAtHour.reduce((sum, m) => {
        const type = MEETING_TYPES.find(t => t.id === m.type)
        return sum + (type?.energyImpact || 20) * 0.3
      }, 0)
      const baseEnergy = hour >= 9 && hour <= 11 ? 90 : hour >= 14 && hour <= 16 ? 80 : hour >= 13 ? 70 : 85
      return {
        label: `${hour}:00`,
        value: Math.max(10, Math.min(100, Math.round(baseEnergy - drain)))
      }
    })
  }, [selectedDay, daySchedule])

  // Calculate day stats
  const dayStats = useMemo(() => {
    const totalMinutes = daySchedule.meetings.reduce((s, m) => s + m.duration, 0)
    const totalEnergyDrain = daySchedule.meetings.reduce((s, m) => {
      const type = MEETING_TYPES.find(t => t.id === m.type)
      return s + (type?.energyImpact || 20)
    }, 0)
    const avgEnergy = Math.round(hourlyEnergy.reduce((s, h) => s + h.value, 0) / hourlyEnergy.length)
    const backToBackCount = daySchedule.meetings.reduce((count, m, i) => {
      if (i === 0) return 0
      const prev = daySchedule.meetings[i - 1]
      const prevEnd = prev.time.split(":").map(Number)[0] * 60 + prev.time.split(":").map(Number)[1] + prev.duration
      const currStart = m.time.split(":").map(Number)[0] * 60 + m.time.split(":").map(Number)[1]
      return currStart - prevEnd < 15 ? count + 1 : count
    }, 0)
    return { totalMinutes, totalEnergyDrain, avgEnergy, backToBackCount, meetingCount: daySchedule.meetings.length }
  }, [daySchedule, hourlyEnergy])

  // Best/worst hours
  const bestHour = hourlyEnergy.reduce((best, h) => h.value > best.value ? h : best, hourlyEnergy[0])
  const worstHour = hourlyEnergy.reduce((worst, h) => h.value < worst.value ? h : worst, hourlyEnergy[0])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ⚡ Meeting Energy Predictor
          </h1>
          <p className="text-gray-500 text-lg">
            Forecast your energy levels and optimize your meeting schedule
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard icon="📊" label="Avg Energy" value={`${dayStats.avgEnergy}%`} color={getEnergyColor(dayStats.avgEnergy)}
            sub={getEnergyLabel(dayStats.avgEnergy)} />
          <KPICard icon="📅" label="Meetings Today" value={dayStats.meetingCount} color="#6366f1"
            sub={`${formatDuration(dayStats.totalMinutes)} total`} />
          <KPICard icon="🔗" label="Back-to-Back" value={dayStats.backToBackCount} color={dayStats.backToBackCount > 1 ? "#ef4444" : "#10b981"}
            sub={dayStats.backToBackCount > 1 ? "⚠️ High load" : "✓ Manageable"} />
          <KPICard icon="🔋" label="Energy Drain" value={`-${dayStats.totalEnergyDrain}`} color="#f59e0b"
            sub="Total energy cost" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Day Schedule */}
          <div className="lg:col-span-2 space-y-6">
            {/* Day Selector */}
            <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-xl p-2 border border-gray-200 dark:border-gray-700">
              {WEEKLY_SCHEDULE.map((day, i) => (
                <button key={i} onClick={() => setSelectedDay(i)} className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                  selectedDay === i
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}>
                  {day.day.slice(0, 3)}
                </button>
              ))}
            </div>

            {/* Energy Forecast Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📈 Hourly Energy Forecast</h3>
              <HourlyChart hours={hourlyEnergy} />
              <div className="flex justify-between mt-4 text-xs text-gray-500">
                <span>🟢 Best: {bestHour.label} ({bestHour.value}%)</span>
                <span>🔴 Worst: {worstHour.label} ({worstHour.value}%)</span>
              </div>
            </div>

            {/* Meeting Schedule */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                📋 {daySchedule.day} Schedule
              </h3>
              <div className="space-y-3">
                {daySchedule.meetings.map((meeting, i) => {
                  const type = MEETING_TYPES.find(t => t.id === meeting.type)
                  return (
                    <div key={i} onClick={() => setSelectedMeeting(selectedMeeting === i ? null : i)}
                      className="cursor-pointer transition-all">
                      <MeetingCard meeting={meeting} energyImpact={type?.energyImpact || 20} />
                      {selectedMeeting === i && (
                        <div className="mt-2 ml-16 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300">
                          <div className="grid grid-cols-2 gap-2">
                            <div>⏱️ Duration: {meeting.duration} min</div>
                            <div>👥 Participants: {meeting.participants}</div>
                            <div>📋 Type: {type?.name}</div>
                            <div>⚡ Energy cost: -{type?.energyImpact}%</div>
                            <div>🕐 Optimal time: {type?.optimalTime}</div>
                            <div>📊 Impact: {type?.description}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right: Energy Analysis */}
          <div className="space-y-6">
            {/* Energy Score */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-center"
              style={{ background: getEnergyGradient(dayStats.avgEnergy) }}>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">🎯 Day Energy Score</h3>
              <EnergyRing level={dayStats.avgEnergy} size={140} />
              <div className="mt-4 space-y-2">
                <EnergyBar label="Morning (8-12)" value={hourlyEnergy.slice(0, 4).reduce((s, h) => s + h.value, 0) / 4} color="#6366f1" />
                <EnergyBar label="Afternoon (12-17)" value={hourlyEnergy.slice(4, 9).reduce((s, h) => s + h.value, 0) / 5} color="#f59e0b" />
                <EnergyBar label="Evening (17-20)" value={hourlyEnergy.slice(9).reduce((s, h) => s + h.value, 0) / 3} color="#10b981" />
              </div>
            </div>

            {/* Energy Factors */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">🔍 Energy Factors</h3>
              {ENERGY_FACTORS.map(factor => (
                <div key={factor.id} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <span className="text-lg">{factor.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{factor.name}</div>
                    <div className="text-xs text-gray-500">{factor.description}</div>
                  </div>
                  <div className="text-xs font-bold text-gray-400">{Math.round(factor.weight * 100)}%</div>
                </div>
              ))}
            </div>

            {/* Quick Tips */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">💡 Energy Tips</h3>
              {ENERGY_TIPS.slice(0, 4).map((tip, i) => (
                <div key={i} className="flex items-start gap-2 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <span className="text-lg mt-0.5">{tip.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{tip.title}</div>
                    <div className="text-xs text-gray-500">{tip.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
