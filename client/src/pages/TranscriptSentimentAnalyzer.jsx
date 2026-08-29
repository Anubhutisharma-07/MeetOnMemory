import React, { useState, useMemo } from "react";

// ─── Data ──────────────────────────────────────────────────────────

const MEETING_TRANSCRIPT = {
  title: "Q4 Product Roadmap Review",
  date: "2025-08-28",
  duration: "62 min",
  participants: [
    { id: "sarah", name: "Sarah Chen", role: "Product Lead", avatar: "👩‍💼", color: "#6366f1" },
    { id: "marcus", name: "Marcus Rivera", role: "Engineering Lead", avatar: "👨‍💻", color: "#10b981" },
    { id: "priya", name: "Priya Patel", role: "Design Lead", avatar: "👩‍🎨", color: "#f59e0b" },
    { id: "james", name: "James Wilson", role: "QA Lead", avatar: "👨‍🔧", color: "#ef4444" },
    { id: "lisa", name: "Lisa Park", role: "Data Analyst", avatar: "👩‍🔬", color: "#a855f7" }
  ],
  segments: [
    { time: "00:00", speaker: "sarah", text: "Welcome everyone! I'm really excited to share our Q4 roadmap. We've made incredible progress this quarter.", sentiment: 0.85, emotion: "excitement", topics: ["roadmap", "progress"] },
    { time: "02:15", speaker: "marcus", text: "Thanks Sarah. The engineering team has been working hard. We've completed 87% of the sprint goals. However, I'm a bit concerned about the API migration timeline.", sentiment: 0.45, emotion: "concern", topics: ["engineering", "API", "timeline"] },
    { time: "04:30", speaker: "priya", text: "The new design system is looking fantastic! Users love the refreshed UI. We got a 92% satisfaction score on the latest prototype.", sentiment: 0.92, emotion: "enthusiasm", topics: ["design", "UI", "satisfaction"] },
    { time: "06:45", speaker: "james", text: "I need to flag some quality concerns. We found 23 critical bugs in the last release. The regression rate is higher than acceptable.", sentiment: -0.6, emotion: "worry", topics: ["quality", "bugs", "regression"] },
    { time: "09:00", speaker: "sarah", text: "Those are valid concerns James. Let's prioritize the critical bugs. Marcus, can your team handle a quick hotfix sprint?", sentiment: 0.3, emotion: "neutral", topics: ["bugs", "sprint", "prioritization"] },
    { time: "11:15", speaker: "marcus", text: "Absolutely! We can allocate two engineers for the hotfix. It should take about a week. But I'm worried this will delay the payment integration feature.", sentiment: -0.1, emotion: "concern", topics: ["hotfix", "payment", "delay"] },
    { time: "13:30", speaker: "lisa", text: "The data shows that user engagement dropped 12% after the last release. I think the quality issues are directly impacting retention.", sentiment: -0.45, emotion: "analysis", topics: ["engagement", "retention", "data"] },
    { time: "15:45", speaker: "priya", text: "That aligns with what we're seeing in user feedback. The good news is that users who stay are rating the new features very highly.", sentiment: 0.55, emotion: "optimism", topics: ["feedback", "features", "rating"] },
    { time: "18:00", speaker: "sarah", text: "OK, so here's the plan: hotfix sprint this week, payment integration next week, and we'll do a staged rollout for the remaining features.", sentiment: 0.6, emotion: "determination", topics: ["plan", "hotfix", "rollout"] },
    { time: "20:15", speaker: "james", text: "I'm happy with this approach. I'll prepare a QA checklist for the hotfix. We need to prevent future regressions.", sentiment: 0.5, emotion: "relief", topics: ["QA", "checklist", "prevention"] },
    { time: "22:30", speaker: "marcus", text: "One more thing — the new hire onboarding is going well. Two junior devs are ramping up nicely. They're enthusiastic and learning fast.", sentiment: 0.8, emotion: "pride", topics: ["onboarding", "hiring", "team"] },
    { time: "24:45", speaker: "lisa", text: "I've prepared a competitive analysis report. Our main competitor launched a similar feature last week. We need to differentiate.", sentiment: -0.3, emotion: "alertness", topics: ["competition", "differentiation"] },
    { time: "27:00", speaker: "priya", text: "I've been working on some innovative interaction patterns that will set us apart. The prototypes are really compelling.", sentiment: 0.75, emotion: "creativity", topics: ["innovation", "prototypes"] },
    { time: "29:15", speaker: "sarah", text: "Great discussion everyone. Let's reconvene Friday to review the hotfix progress. I'm confident we can turn this around quickly.", sentiment: 0.7, emotion: "confidence", topics: ["meeting", "progress", "confidence"] },
    { time: "31:00", speaker: "james", text: "Before we wrap up — I want to commend the team. Despite the challenges, morale is high and collaboration is excellent.", sentiment: 0.88, emotion: "appreciation", topics: ["team", "collaboration", "morale"] }
  ]
}

const EMOTIONS = {
  excitement: { color: "#f59e0b", icon: "🎉", label: "Excitement" },
  enthusiasm: { color: "#10b981", icon: "🔥", label: "Enthusiasm" },
  concern: { color: "#f97316", icon: "⚠️", label: "Concern" },
  worry: { color: "#ef4444", icon: "😟", label: "Worry" },
  neutral: { color: "#64748b", icon: "😐", label: "Neutral" },
  optimism: { color: "#06b6d4", icon: "🌈", label: "Optimism" },
  analysis: { color: "#8b5cf6", icon: "📊", label: "Analysis" },
  determination: { color: "#3b82f6", icon: "💪", label: "Determination" },
  relief: { color: "#10b981", icon: "😌", label: "Relief" },
  pride: { color: "#a855f7", icon: "🏆", label: "Pride" },
  alertness: { color: "#f97316", icon: "🔔", label: "Alertness" },
  creativity: { color: "#ec4899", icon: "💡", label: "Creativity" },
  confidence: { color: "#3b82f6", icon: "🎯", label: "Confidence" },
  appreciation: { color: "#10b981", icon: "❤️", label: "Appreciation" }
}

const SENTIMENT_WORDS = [
  { word: "great", count: 4, sentiment: "positive" },
  { word: "concerned", count: 3, sentiment: "negative" },
  { word: "excited", count: 2, sentiment: "positive" },
  { word: "fantastic", count: 2, sentiment: "positive" },
  { word: "worried", count: 2, sentiment: "negative" },
  { word: "progress", count: 3, sentiment: "positive" },
  { word: "critical", count: 2, sentiment: "negative" },
  { word: "excellent", count: 2, sentiment: "positive" },
  { word: "confident", count: 2, sentiment: "positive" },
  { word: "happy", count: 1, sentiment: "positive" },
  { word: "flag", count: 1, sentiment: "negative" },
  { word: "love", count: 1, sentiment: "positive" },
  { word: "compelling", count: 1, sentiment: "positive" },
  { word: "high", count: 2, sentiment: "positive" },
  { word: "regression", count: 1, sentiment: "negative" },
  { word: "impact", count: 1, sentiment: "negative" },
  { word: "turnaround", count: 1, sentiment: "positive" },
  { word: "innovative", count: 1, sentiment: "positive" }
]

// ─── Helpers ───────────────────────────────────────────────────────

function getSentimentColor(value) {
  if (value >= 0.6) return "#10b981"
  if (value >= 0.2) return "#06b6d4"
  if (value >= -0.2) return "#f59e0b"
  if (value >= -0.6) return "#f97316"
  return "#ef4444"
}

function getSentimentLabel(value) {
  if (value >= 0.6) return "Very Positive"
  if (value >= 0.2) return "Positive"
  if (value >= -0.2) return "Neutral"
  if (value >= -0.6) return "Negative"
  return "Very Negative"
}

function getSentimentEmoji(value) {
  if (value >= 0.6) return "😊"
  if (value >= 0.2) return "🙂"
  if (value >= -0.2) return "😐"
  if (value >= -0.6) return "😟"
  return "😠"
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

function SentimentGauge({ value, size = 120 }) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const normalizedValue = (value + 1) / 2
  const offset = circumference - normalizedValue * circumference * 0.75
  const color = getSentimentColor(value)

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
          <span className="text-3xl">{getSentimentEmoji(value)}</span>
          <span className="text-lg font-bold" style={{ color }}>{(value * 100).toFixed(0)}%</span>
        </div>
      </div>
      <span className="text-xs text-gray-500 font-medium">{getSentimentLabel(value)}</span>
    </div>
  )
}

function SentimentBar({ value, label, color }) {
  const width = Math.abs(value) * 100
  const isPositive = value >= 0
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-xs text-gray-500 w-16 text-right">{label}</span>
      <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full relative overflow-hidden">
        <div className="absolute top-0 h-full rounded-full transition-all duration-300" style={{
          width: `${width}%`,
          left: isPositive ? "50%" : undefined,
          right: !isPositive ? "50%" : undefined,
          background: color
        }} />
        <div className="absolute top-0 left-1/2 w-px h-full bg-gray-400" />
      </div>
      <span className="text-xs font-semibold w-12" style={{ color }}>{(value * 100).toFixed(0)}%</span>
    </div>
  )
}

function TranscriptSegment({ segment, speaker, isSelected, onClick }) {
  const emotion = EMOTIONS[segment.emotion]
  return (
    <div onClick={onClick} className={`p-4 rounded-xl border cursor-pointer transition-all ${
      isSelected
        ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md"
        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
    }`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{speaker.avatar}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-gray-900 dark:text-white">{speaker.name}</span>
            <span className="text-xs text-gray-400">{segment.time}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${emotion.color}15`, color: emotion.color }}>
              {emotion.icon} {emotion.label}
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{segment.text}</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">Sentiment:</span>
              <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{
                  width: `${((segment.sentiment + 1) / 2) * 100}%`,
                  background: getSentimentColor(segment.sentiment)
                }} />
              </div>
              <span className="text-xs font-semibold" style={{ color: getSentimentColor(segment.sentiment) }}>
                {segment.sentiment > 0 ? '+' : ''}{(segment.sentiment * 100).toFixed(0)}
              </span>
            </div>
            <div className="flex gap-1">
              {segment.topics.map((topic, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SpeakerCard({ participant, avgSentiment, segmentCount, dominantEmotion }) {
  const emotion = EMOTIONS[dominantEmotion] || EMOTIONS.neutral
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{participant.avatar}</span>
        <div>
          <div className="text-sm font-bold text-gray-900 dark:text-white">{participant.name}</div>
          <div className="text-xs text-gray-500">{participant.role}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-lg font-bold" style={{ color: getSentimentColor(avgSentiment) }}>
            {(avgSentiment > 0 ? '+' : '')}{(avgSentiment * 100).toFixed(0)}
          </div>
          <div className="text-xs text-gray-500">Avg Sentiment</div>
        </div>
        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-lg font-bold" style={{ color: participant.color }}>{segmentCount}</div>
          <div className="text-xs text-gray-500">Segments</div>
        </div>
      </div>
      <div className="mt-2 text-center">
        <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${emotion.color}15`, color: emotion.color }}>
          {emotion.icon} {emotion.label}
        </span>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────

export default function TranscriptSentimentAnalyzer() {
  const [selectedSegment, setSelectedSegment] = useState(null)
  const [filterEmotion, setFilterEmotion] = useState("all")

  const meeting = MEETING_TRANSCRIPT

  // Compute stats
  const stats = useMemo(() => {
    const segments = meeting.segments
    const avgSentiment = segments.reduce((s, seg) => s + seg.sentiment, 0) / segments.length
    const positiveCount = segments.filter(s => s.sentiment > 0.2).length
    const negativeCount = segments.filter(s => s.sentiment < -0.2).length
    const neutralCount = segments.length - positiveCount - negativeCount

    // Emotion distribution
    const emotions = {}
    segments.forEach(s => {
      emotions[s.emotion] = (emotions[s.emotion] || 0) + 1
    })

    // Speaker stats
    const speakers = {}
    meeting.participants.forEach(p => {
      const speakerSegments = segments.filter(s => s.speaker === p.id)
      speakers[p.id] = {
        ...p,
        avgSentiment: speakerSegments.reduce((s, seg) => s + seg.sentiment, 0) / (speakerSegments.length || 1),
        segmentCount: speakerSegments.length,
        dominantEmotion: speakerSegments.reduce((acc, seg) => {
          acc[seg.emotion] = (acc[seg.emotion] || 0) + 1
          return acc
        }, {})
      }
      const dominant = Object.entries(speakers[p.id].dominantEmotion).sort((a, b) => b[1] - a[1])[0]
      speakers[p.id].dominantEmotion = dominant ? dominant[0] : "neutral"
    })

    // Topic frequency
    const topics = {}
    segments.forEach(s => s.topics.forEach(t => { topics[t] = (topics[t] || 0) + 1 }))
    const topTopics = Object.entries(topics).sort((a, b) => b[1] - a[1]).slice(0, 10)

    // Sentiment over time (for chart)
    const sentimentTimeline = segments.map((s, i) => ({
      index: i,
      time: s.time,
      sentiment: s.sentiment,
      speaker: s.speaker
    }))

    return { avgSentiment, positiveCount, negativeCount, neutralCount, emotions, speakers, topTopics, sentimentTimeline }
  }, [meeting])

  // Filter segments
  const filteredSegments = useMemo(() => {
    if (filterEmotion === "all") return meeting.segments
    return meeting.segments.filter(s => s.emotion === filterEmotion)
  }, [meeting.segments, filterEmotion])

  const uniqueEmotions = [...new Set(meeting.segments.map(s => s.emotion))]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🎭 Transcript Sentiment Analyzer
          </h1>
          <p className="text-gray-500 text-lg">{meeting.title} · {meeting.date} · {meeting.duration}</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard icon="📊" label="Avg Sentiment" value={`${(stats.avgSentiment * 100).toFixed(0)}%`}
            color={getSentimentColor(stats.avgSentiment)} sub={getSentimentLabel(stats.avgSentiment)} />
          <KPICard icon="😊" label="Positive Segments" value={stats.positiveCount} color="#10b981"
            sub={`${Math.round(stats.positiveCount / meeting.segments.length * 100)}% of total`} />
          <KPICard icon="😟" label="Negative Segments" value={stats.negativeCount} color="#ef4444"
            sub={`${Math.round(stats.negativeCount / meeting.segments.length * 100)}% of total`} />
          <KPICard icon="🎭" label="Emotion Types" value={Object.keys(stats.emotions).length} color="#a855f7"
            sub={`${meeting.participants.length} participants`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Transcript */}
          <div className="lg:col-span-2 space-y-4">
            {/* Emotion Filter */}
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setFilterEmotion("all")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterEmotion === "all" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
              }`}>All ({meeting.segments.length})</button>
              {uniqueEmotions.map(emotion => {
                const em = EMOTIONS[emotion]
                const count = meeting.segments.filter(s => s.emotion === emotion).length
                return (
                  <button key={emotion} onClick={() => setFilterEmotion(emotion)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterEmotion === emotion ? "text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                  }`} style={filterEmotion === emotion ? { background: em.color } : {}}>
                    {em.icon} {em.label} ({count})
                  </button>
                )
              })}
            </div>

            {/* Transcript Segments */}
            <div className="space-y-3">
              {filteredSegments.map((segment, i) => {
                const speaker = meeting.participants.find(p => p.id === segment.speaker)
                return (
                  <TranscriptSegment key={i} segment={segment} speaker={speaker}
                    isSelected={selectedSegment === i}
                    onClick={() => setSelectedSegment(selectedSegment === i ? null : i)} />
                )
              })}
            </div>
          </div>

          {/* Right: Analysis */}
          <div className="space-y-6">
            {/* Overall Sentiment */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-center">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">🎯 Overall Meeting Sentiment</h3>
              <SentimentGauge value={stats.avgSentiment} size={140} />
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-green-500">✅ Positive: {stats.positiveCount}</span>
                  <span className="text-gray-500">😐 Neutral: {stats.neutralCount}</span>
                  <span className="text-red-500">⚠️ Negative: {stats.negativeCount}</span>
                </div>
              </div>
            </div>

            {/* Sentiment Timeline */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">📈 Sentiment Timeline</h3>
              <div className="flex items-end gap-1 h-24">
                {stats.sentimentTimeline.map((point, i) => {
                  const participant = meeting.participants.find(p => p.id === point.speaker)
                  const height = ((point.sentiment + 1) / 2) * 100
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="w-full rounded-t transition-all duration-200 cursor-pointer hover:opacity-80" style={{
                        height: `${Math.max(height, 5)}%`,
                        background: participant?.color || "#6366f1"
                      }} />
                      <span className="text-[8px] text-gray-400">{point.time.split(":")[0]}</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-center gap-3 mt-3">
                {meeting.participants.map(p => (
                  <div key={p.id} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-xs text-gray-500">{p.name.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Speaker Profiles */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">👥 Speaker Sentiment</h3>
              <div className="space-y-3">
                {Object.values(stats.speakers).map(speaker => (
                  <div key={speaker.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                    <span className="text-xl">{speaker.avatar}</span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{speaker.name}</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{
                            width: `${((speaker.avgSentiment + 1) / 2) * 100}%`,
                            background: getSentimentColor(speaker.avgSentiment)
                          }} />
                        </div>
                        <span className="text-xs font-bold" style={{ color: getSentimentColor(speaker.avgSentiment) }}>
                          {speaker.avgSentiment > 0 ? '+' : ''}{(speaker.avgSentiment * 100).toFixed(0)}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs">{EMOTIONS[speaker.dominantEmotion]?.icon || "😐"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Topics */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">🏷️ Hot Topics</h3>
              {stats.topTopics.map(([topic, count], i) => (
                <div key={topic} className="flex items-center gap-2 py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <span className="text-xs font-bold text-gray-400 w-4">#{i + 1}</span>
                  <span className="text-sm text-gray-900 dark:text-white flex-1">{topic}</span>
                  <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full font-semibold">{count}x</span>
                </div>
              ))}
            </div>

            {/* Emotion Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">🎭 Emotion Distribution</h3>
              {Object.entries(stats.emotions).sort((a, b) => b[1] - a[1]).map(([emotion, count]) => {
                const em = EMOTIONS[emotion]
                const percentage = Math.round(count / meeting.segments.length * 100)
                return (
                  <div key={emotion} className="flex items-center gap-2 py-1.5">
                    <span className="text-lg">{em.icon}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{em.label}</span>
                    <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${percentage}%`, background: em.color }} />
                    </div>
                    <span className="text-xs font-bold" style={{ color: em.color }}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
