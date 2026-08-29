import React, { useState, useMemo } from "react";

// ─── Data ──────────────────────────────────────────────────────────

const TEAMS = [
  { id: "eng", name: "Engineering", members: 12, avgSalary: 145000 },
  { id: "product", name: "Product", members: 5, avgSalary: 130000 },
  { id: "design", name: "Design", members: 4, avgSalary: 120000 },
  { id: "marketing", name: "Marketing", members: 6, avgSalary: 95000 },
  { id: "sales", name: "Sales", members: 8, avgSalary: 110000 },
  { id: "hr", name: "People Ops", members: 3, avgSalary: 105000 }
]

const MONTHLY_MEETINGS = [
  { name: "Sprint Planning", team: "eng", participants: 8, duration: 90, frequency: "weekly", type: "planning" },
  { name: "Daily Standup", team: "eng", participants: 12, duration: 15, frequency: "daily", type: "status" },
  { name: "Product Review", team: "product", participants: 6, duration: 60, frequency: "weekly", type: "review" },
  { name: "Design Critique", team: "design", participants: 5, duration: 45, frequency: "weekly", type: "review" },
  { name: "All Hands", team: "all", participants: 38, duration: 60, frequency: "monthly", type: "all-hands" },
  { name: "1:1 Manager", team: "eng", participants: 2, duration: 30, frequency: "weekly", type: "1:1" },
  { name: "Marketing Sync", team: "marketing", participants: 6, duration: 30, frequency: "weekly", type: "status" },
  { name: "Sales Pipeline", team: "sales", participants: 8, duration: 45, frequency: "weekly", type: "review" },
  { name: "Retrospective", team: "eng", participants: 10, duration: 60, frequency: "biweekly", type: "retrospective" },
  { name: "Cross-team Sync", team: "all", participants: 15, duration: 30, frequency: "weekly", type: "status" },
  { name: "Interview Panel", team: "hr", participants: 3, duration: 45, frequency: "daily", type: "interview" },
  { name: "OKR Review", team: "product", participants: 8, duration: 60, frequency: "monthly", type: "review" },
  { name: "Tech Deep Dive", team: "eng", participants: 6, duration: 90, frequency: "biweekly", type: "brainstorm" },
  { name: "Budget Review", team: "finance", participants: 4, duration: 30, frequency: "monthly", type: "review" }
]

const COST_RECOMMENDATIONS = [
  { title: "Convert standups to async", meetings: ["Daily Standup"], savings: 12400, effort: "low", icon: "📝", description: "Replace 15-min daily standups with async Slack updates for the 12-person engineering team" },
  { title: "Reduce all-hands frequency", meetings: ["All Hands"], savings: 8900, effort: "medium", icon: "📢", description: "Switch from monthly to biweekly all-hands meetings — save 19 person-hours per month" },
  { title: "Shorten pipeline reviews", meetings: ["Sales Pipeline"], savings: 4200, effort: "low", icon: "⏱️", description: "Cut 45-min sales pipeline reviews to 30 min with pre-read docs" },
  { title: "Merge sync meetings", meetings: ["Marketing Sync", "Cross-team Sync"], savings: 3100, effort: "medium", icon: "🔀", description: "Combine overlapping sync meetings into one shared session" },
  { title: "Use Loom for updates", meetings: ["Product Review"], savings: 2800, effort: "low", icon: "🎬", description: "Record product updates as Loom videos instead of live meetings" },
  { title: "Batch interview panels", meetings: ["Interview Panel"], savings: 6500, effort: "high", icon: "🎯", description: "Schedule interviews in dedicated blocks instead of scattered throughout the day" }
]

// ─── Helpers ───────────────────────────────────────────────────────

const AVG_HOURS_PER_MONTH = 160
const WEEKS_PER_MONTH = 4.33

function getFrequencyMultiplier(freq) {
  if (freq === "daily") return AVG_HOURS_PER_MONTH / (8 * 22) * 22
  if (freq === "weekly") return WEEKS_PER_MONTH
  if (freq === "biweekly") return WEEKS_PER_MONTH / 2
  return 1 // monthly
}

function calculateMeetingCost(meeting) {
  const team = TEAMS.find(t => t.id === meeting.team)
  const hourlyRate = team ? team.avgSalary / AVG_HOURS_PER_MONTH : 100
  const hourlyRateAll = TEAMS.reduce((s, t) => s + t.avgSalary, 0) / TEAMS.length / AVG_HOURS_PER_MONTH
  const rate = meeting.team === "all" ? hourlyRateAll : hourlyRate
  const costPerMeeting = rate * meeting.participants * (meeting.duration / 60)
  const monthlyCost = costPerMeeting * getFrequencyMultiplier(meeting.frequency)
  return { costPerMeeting, monthlyCost, hourlyRate: rate }
}

function formatCurrency(amount) {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}k`
  return `$${amount.toFixed(0)}`
}

function formatCurrencyFull(amount) {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function getColor(amount, threshold1, threshold2) {
  if (amount >= threshold2) return "#ef4444"
  if (amount >= threshold1) return "#f59e0b"
  return "#10b981"
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
          <div className="text-2xl font-bold" style={{ color }}>{value}</div>
          <div className="text-sm text-gray-500">{label}</div>
          {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
        </div>
      </div>
    </div>
  )
}

function CostBar({ label, value, maxValue, color, amount }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{formatCurrencyFull(amount)}</span>
      </div>
      <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{
          width: `${Math.min((amount / maxValue) * 100, 100)}%`,
          background: color
        }} />
      </div>
      <div className="text-xs text-gray-400 mt-0.5">{value}</div>
    </div>
  )
}

function RecommendationCard({ rec, onAccept }) {
  const effortColor = { low: "#10b981", medium: "#f59e0b", high: "#ef4444" }
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{rec.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">{rec.title}</h4>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{
              background: `${effortColor[rec.effort]}15`,
              color: effortColor[rec.effort]
            }}>{rec.effort} effort</span>
          </div>
          <p className="text-xs text-gray-500 mb-2">{rec.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-green-600">-{formatCurrencyFull(rec.savings)}/mo</span>
            <span className="text-xs text-gray-400">{rec.savings * 12 >= 1000 ? `-${formatCurrency(rec.savings * 12)}/yr` : `-${formatCurrencyFull(rec.savings * 12)}/yr`}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────

export default function MeetingCostTracker() {
  const [selectedTeam, setSelectedTeam] = useState("all")
  const [sortBy, setSortBy] = useState("cost")

  const meetingCosts = useMemo(() => {
    return MONTHLY_MEETINGS.map(m => ({
      ...m,
      ...calculateMeetingCost(m)
    }))
  }, [])

  const filteredMeetings = useMemo(() => {
    let meetings = selectedTeam === "all" ? meetingCosts : meetingCosts.filter(m => m.team === selectedTeam || m.team === "all")
    if (sortBy === "cost") meetings.sort((a, b) => b.monthlyCost - a.monthlyCost)
    if (sortBy === "participants") meetings.sort((a, b) => b.participants - a.participants)
    if (sortBy === "duration") meetings.sort((a, b) => b.duration - a.duration)
    if (sortBy === "frequency") meetings.sort((a, b) => getFrequencyMultiplier(b.frequency) - getFrequencyMultiplier(a.frequency))
    return meetings
  }, [meetingCosts, selectedTeam, sortBy])

  const totalMonthlyCost = meetingCosts.reduce((s, m) => s + m.monthlyCost, 0)
  const totalYearlyCost = totalMonthlyCost * 12
  const totalPersonHours = meetingCosts.reduce((s, m) => {
    const freq = getFrequencyMultiplier(m.frequency)
    return s + m.participants * (m.duration / 60) * freq
  }, 0)
  const totalMeetingsPerMonth = meetingCosts.reduce((s, m) => s + getFrequencyMultiplier(m.frequency), 0)
  const avgCostPerMeeting = meetingCosts.reduce((s, m) => s + m.costPerMeeting, 0) / meetingCosts.length

  const maxMonthlyCost = Math.max(...meetingCosts.map(m => m.monthlyCost))

  // Team breakdown
  const teamBreakdown = useMemo(() => {
    const teams = {}
    for (const m of meetingCosts) {
      const key = m.team === "all" ? "all" : m.team
      if (!teams[key]) teams[key] = { cost: 0, hours: 0, meetings: 0 }
      teams[key].cost += m.monthlyCost
      teams[key].hours += m.participants * (m.duration / 60) * getFrequencyMultiplier(m.frequency)
      teams[key].meetings += getFrequencyMultiplier(m.frequency)
    }
    return Object.entries(teams)
      .map(([id, data]) => ({
        ...data,
        id,
        name: id === "all" ? "All Hands" : TEAMS.find(t => t.id === id)?.name || id,
        costPerMember: data.cost / (TEAMS.find(t => t.id === id)?.members || 38)
      }))
      .sort((a, b) => b.cost - a.cost)
  }, [meetingCosts])

  const maxTeamCost = Math.max(...teamBreakdown.map(t => t.cost))

  // Total potential savings
  const totalSavings = COST_RECOMMENDATIONS.reduce((s, r) => s + r.savings, 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            💰 Meeting Cost Tracker
          </h1>
          <p className="text-gray-500 text-lg">
            Calculate the real cost of your meetings and find savings opportunities
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard icon="💵" label="Monthly Cost" value={formatCurrencyFull(totalMonthlyCost)} color="#ef4444"
            sub={`${formatCurrency(totalYearlyCost)}/year`} />
          <KPICard icon="⏰" label="Person-Hours/Month" value={formatCurrencyFull(Math.round(totalPersonHours))} color="#6366f1"
            sub={`${Math.round(totalPersonHours / AVG_HOURS_PER_MONTH)} FTEs`} />
          <KPICard icon="📊" label="Avg Cost/Meeting" value={formatCurrencyFull(avgCostPerMeeting)} color="#f59e0b"
            sub={`${Math.round(totalMeetingsPerMonth)} meetings/month`} />
          <KPICard icon="💎" label="Potential Savings" value={`-${formatCurrencyFull(totalSavings)}`} color="#10b981"
            sub={`${formatCurrency(totalSavings * 12)}/year`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Meeting Costs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <div className="flex gap-4 items-center flex-wrap">
              <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm">
                <option value="all">All Teams</option>
                {TEAMS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm">
                <option value="cost">Sort by Cost</option>
                <option value="participants">Sort by Participants</option>
                <option value="duration">Sort by Duration</option>
                <option value="frequency">Sort by Frequency</option>
              </select>
            </div>

            {/* Meeting Cost List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📋 Meeting Costs</h3>
              {filteredMeetings.map((m, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ background: getColor(m.monthlyCost, 500, 2000) + "15", color: getColor(m.monthlyCost, 500, 2000) }}>
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{m.name}</div>
                    <div className="text-xs text-gray-500">
                      {m.participants} people × {m.duration}min · {m.frequency}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: getColor(m.monthlyCost, 500, 2000) }}>
                      {formatCurrencyFull(m.monthlyCost)}/mo
                    </div>
                    <div className="text-xs text-gray-400">{formatCurrencyFull(m.costPerMeeting)} each</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Analysis */}
          <div className="space-y-6">
            {/* Team Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">🏢 Team Breakdown</h3>
              {teamBreakdown.map(team => (
                <CostBar key={team.id} label={team.name}
                  value={`${Math.round(team.hours)}h · ${Math.round(team.meetings)} meetings`}
                  maxValue={maxTeamCost} amount={team.cost}
                  color={getColor(team.cost, 3000, 10000)} />
              ))}
            </div>

            {/* Cost Per Team Member */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">👤 Cost Per Team Member</h3>
              {teamBreakdown.filter(t => t.id !== "all").map(team => {
                const teamInfo = TEAMS.find(t => t.id === team.id)
                return (
                  <div key={team.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{team.name}</div>
                      <div className="text-xs text-gray-500">{teamInfo?.members} members</div>
                    </div>
                    <div className="text-sm font-bold" style={{ color: getColor(team.costPerMember, 200, 500) }}>
                      {formatCurrencyFull(team.costPerMember)}/person
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Hourly Rates */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">💰 Team Hourly Rates</h3>
              {TEAMS.map(team => (
                <div key={team.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{team.name}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    ${Math.round(team.avgSalary / AVG_HOURS_PER_MONTH)}/hr
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            💡 Cost-Saving Recommendations
            <span className="text-sm font-normal text-green-600 ml-3">Save up to {formatCurrencyFull(totalSavings)}/month</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {COST_RECOMMENDATIONS.sort((a, b) => b.savings - a.savings).map((rec, i) => (
              <RecommendationCard key={i} rec={rec} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
