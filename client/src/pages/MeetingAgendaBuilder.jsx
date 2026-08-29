import React, { useState, useMemo, useCallback } from "react";

// ─── Data ──────────────────────────────────────────────────────────

/** Pre-built agenda templates for different meeting types */
const AGENDA_TEMPLATES = [
  {
    id: "standup",
    name: "Daily Standup",
    icon: "🏃",
    duration: 15,
    color: "#6366f1",
    sections: [
      { title: "Yesterday's Progress", duration: 5, type: "discussion" },
      { title: "Today's Plan", duration: 5, type: "discussion" },
      { title: "Blockers", duration: 5, type: "discussion" },
    ],
    prepItems: ["Review yesterday's task board", "Note any blockers", "Prepare today's commitments"],
  },
  {
    id: "sprint-planning",
    name: "Sprint Planning",
    icon: "📋",
    duration: 90,
    color: "#8b5cf6",
    sections: [
      { title: "Sprint Goal Review", duration: 10, type: "decision" },
      { title: "Backlog Grooming", duration: 30, type: "discussion" },
      { title: "Story Pointing", duration: 25, type: "discussion" },
      { title: "Capacity Planning", duration: 15, type: "decision" },
      { title: "Sprint Commitment", duration: 10, type: "decision" },
    ],
    prepItems: ["Review product backlog", "Check team availability", "Review velocity from last sprint", "Identify dependencies"],
  },
  {
    id: "retrospective",
    name: "Sprint Retrospective",
    icon: "🔄",
    duration: 60,
    color: "#f59e0b",
    sections: [
      { title: "What Went Well", duration: 15, type: "discussion" },
      { title: "What Could Improve", duration: 15, type: "discussion" },
      { title: "Action Items Review", duration: 10, type: "action" },
      { title: "New Action Items", duration: 15, type: "action" },
      { title: "Team Celebrations", duration: 5, type: "discussion" },
    ],
    prepItems: ["Collect anonymous feedback", "Review last retro action items", "Prepare mood board"],
  },
  {
    id: "1on1",
    name: "1:1 Meeting",
    icon: "🤝",
    duration: 30,
    color: "#10b981",
    sections: [
      { title: "Check-in & Wellbeing", duration: 5, type: "discussion" },
      { title: "Project Updates", duration: 10, type: "discussion" },
      { title: "Challenges & Support", duration: 10, type: "discussion" },
      { title: "Goals & Growth", duration: 5, type: "discussion" },
    ],
    prepItems: ["Review last 1:1 notes", "Check on pending requests", "Prepare growth topics"],
  },
  {
    id: "brainstorm",
    name: "Brainstorm Session",
    icon: "💡",
    duration: 60,
    color: "#ec4899",
    sections: [
      { title: "Problem Statement", duration: 10, type: "discussion" },
      { title: "Ideation Round", duration: 25, type: "discussion" },
      { title: "Idea Evaluation", duration: 15, type: "decision" },
      { title: "Next Steps", duration: 10, type: "action" },
    ],
    prepItems: ["Share problem context beforehand", "Prepare icebreaker", "Set up whiteboard/digital canvas"],
  },
  {
    id: "all-hands",
    name: "All Hands / Town Hall",
    icon: "🏛️",
    duration: 60,
    color: "#06b6d4",
    sections: [
      { title: "Company Updates", duration: 15, type: "discussion" },
      { title: "Team Highlights", duration: 15, type: "discussion" },
      { title: "Q&A Session", duration: 20, type: "discussion" },
      { title: "Open Discussion", duration: 10, type: "discussion" },
    ],
    prepItems: ["Collect team highlights", "Prepare slides", "Curate submitted questions"],
  },
];

/** Meeting effectiveness scoring criteria */
const SCORING_CRITERIA = [
  { id: "clarity", name: "Agenda Clarity", weight: 0.2, description: "Clear objectives and topics defined" },
  { id: "timeManagement", name: "Time Management", weight: 0.25, description: "Stayed within time allocations" },
  { id: "participation", name: "Participation", weight: 0.2, description: "All attendees contributed meaningfully" },
  { id: "decisions", name: "Decisions Made", weight: 0.15, description: "Clear outcomes and next steps" },
  { id: "actionItems", name: "Action Items", weight: 0.1, description: "Tasks assigned with owners and deadlines" },
  { id: "prepQuality", name: "Prep Quality", weight: 0.1, description: "Attendees came prepared" },
];

/** Priority levels for action items */
const PRIORITIES = [
  { id: "critical", label: "Critical", color: "#ef4444", icon: "🔴" },
  { id: "high", label: "High", color: "#f97316", icon: "🟠" },
  { id: "medium", label: "Medium", color: "#f59e0b", icon: "🟡" },
  { id: "low", label: "Low", color: "#10b981", icon: "🟢" },
];

/** Topic status options */
const TOPIC_STATUSES = [
  { id: "pending", label: "Pending", color: "#6b7280" },
  { id: "in-progress", label: "In Progress", color: "#f59e0b" },
  { id: "completed", label: "Completed", color: "#10b981" },
  { id: "deferred", label: "Deferred", color: "#8b5cf6" },
];

// ─── Helpers ───────────────────────────────────────────────────────

/** Format minutes into a compact duration string */
function formatTime(mins) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Generate a unique ID */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Calculate end time from start time + duration */
function addMinutes(timeStr, mins) {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Get color based on effectiveness score */
function getScoreColor(score) {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

/** Get letter grade from score */
function getGrade(score) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  return "D";
}

// ─── Sub-Components ────────────────────────────────────────────────

/** Template card for selecting a meeting agenda template */
function TemplateCard({ template, onSelect, selected }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(template)}
      className={`text-left p-4 rounded-xl border-2 transition-all ${
        selected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{template.icon}</span>
        <div>
          <div className="font-bold text-gray-900 dark:text-white">{template.name}</div>
          <div className="text-xs text-gray-500">{template.duration} min · {template.sections.length} sections</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {template.sections.map((s, i) => (
          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {s.title}
          </span>
        ))}
      </div>
    </button>
  );
}

/** Agenda section/time block item */
function AgendaSection({ section, index, onUpdate, onRemove, startTime }) {
  const endTime = addMinutes(startTime, section.duration);
  const typeColors = { discussion: "#6366f1", decision: "#f59e0b", action: "#10b981", presentation: "#ec4899" };

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
      <div className="flex flex-col items-center gap-1 min-w-[50px]">
        <div className="text-xs font-bold text-gray-500">{startTime}</div>
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
        <div className="text-xs text-gray-500">{endTime}</div>
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
          <input
            type="text"
            value={section.title}
            onChange={(e) => onUpdate({ ...section, title: e.target.value })}
            className="flex-1 text-sm font-semibold bg-transparent border-b border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            placeholder="Section title..."
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={section.type}
            onChange={(e) => onUpdate({ ...section, type: e.target.value })}
            className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <option value="discussion">💬 Discussion</option>
            <option value="decision">⚖️ Decision</option>
            <option value="action">✅ Action</option>
            <option value="presentation">📊 Presentation</option>
          </select>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onUpdate({ ...section, duration: Math.max(5, section.duration - 5) })}
              className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-600 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              −
            </button>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-8 text-center">{section.duration}m</span>
            <button
              type="button"
              onClick={() => onUpdate({ ...section, duration: section.duration + 5 })}
              className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-600 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              +
            </button>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${typeColors[section.type]}20`, color: typeColors[section.type] }}>
            {section.type}
          </span>
        </div>
        <textarea
          value={section.notes || ""}
          onChange={(e) => onUpdate({ ...section, notes: e.target.value })}
          className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-2 text-gray-600 dark:text-gray-400 resize-none focus:outline-none focus:border-blue-500"
          rows={2}
          placeholder="Notes, talking points, or context..."
        />
      </div>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="text-red-400 hover:text-red-600 text-sm p-1"
        title="Remove section"
      >
        ✕
      </button>
    </div>
  );
}

/** Prep checklist item */
function PrepItem({ item, index, onToggle, onRemove, onUpdate }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
      <button
        type="button"
        onClick={() => onToggle(index)}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs transition-all ${
          item.done
            ? "bg-green-500 border-green-500 text-white"
            : "border-gray-300 dark:border-gray-600 hover:border-green-400"
        }`}
      >
        {item.done && "✓"}
      </button>
      <input
        type="text"
        value={item.text}
        onChange={(e) => onUpdate(index, e.target.value)}
        className={`flex-1 text-sm bg-transparent border-none focus:outline-none ${
          item.done ? "line-through text-gray-400" : "text-gray-700 dark:text-gray-300"
        }`}
        placeholder="Preparation item..."
      />
      <button type="button" onClick={() => onRemove(index)} className="text-red-400 hover:text-red-600 text-xs">
        ✕
      </button>
    </div>
  );
}

/** Action item row with assignee, priority, and status */
function ActionItemRow({ item, index, onUpdate, onRemove }) {
  const priority = PRIORITIES.find((p) => p.id === item.priority);
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
      <span className="text-sm">{priority?.icon || "🟡"}</span>
      <input
        type="text"
        value={item.text}
        onChange={(e) => onUpdate(index, { ...item, text: e.target.value })}
        className="flex-1 text-sm bg-transparent border-none text-gray-700 dark:text-gray-300 focus:outline-none"
        placeholder="Action item description..."
      />
      <input
        type="text"
        value={item.assignee}
        onChange={(e) => onUpdate(index, { ...item, assignee: e.target.value })}
        className="w-28 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-gray-600 dark:text-gray-400 focus:outline-none"
        placeholder="Assignee"
      />
      <input
        type="date"
        value={item.deadline}
        onChange={(e) => onUpdate(index, { ...item, deadline: e.target.value })}
        className="w-32 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-gray-600 dark:text-gray-400 focus:outline-none"
      />
      <select
        value={item.priority}
        onChange={(e) => onUpdate(index, { ...item, priority: e.target.value })}
        className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-gray-600 dark:text-gray-400"
      >
        {PRIORITIES.map((p) => (
          <option key={p.id} value={p.id}>{p.icon} {p.label}</option>
        ))}
      </select>
      <button type="button" onClick={() => onRemove(index)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
    </div>
  );
}

/** Effectiveness scoring slider */
function ScoreSlider({ criterion, value, onChange }) {
  const color = getScoreColor(value);
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{criterion.name}</span>
        <span className="text-sm font-bold" style={{ color }}>{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} ${value}%, #e5e7eb ${value}%)`,
        }}
      />
      <p className="text-[10px] text-gray-400">{criterion.description}</p>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────

/**
 * Meeting Agenda Builder — Create structured agendas with time blocks,
 * discussion topics, pre-meeting prep checklists, action items, and
 * post-meeting effectiveness scoring.
 *
 * @returns {React.JSX.Element} Rendered agenda builder page
 */
export default function MeetingAgendaBuilder() {
  const [activeTab, setActiveTab] = useState("templates");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [agendaTitle, setAgendaTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split("T")[0]);
  const [meetingTime, setMeetingTime] = useState("10:00");
  const [sections, setSections] = useState([]);
  const [prepItems, setPrepItems] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [scores, setScores] = useState(
    Object.fromEntries(SCORING_CRITERIA.map((c) => [c.id, 50]))
  );
  const [showPreview, setShowPreview] = useState(false);

  /** Load a template into the builder */
  const loadTemplate = useCallback(
    (template) => {
      setSelectedTemplate(template);
      setAgendaTitle(template.name);
      setSections(
        template.sections.map((s) => ({
          id: uid(),
          title: s.title,
          duration: s.duration,
          type: s.type,
          notes: "",
          status: "pending",
        }))
      );
      setPrepItems(
        template.prepItems.map((text) => ({ id: uid(), text, done: false }))
      );
      setActiveTab("agenda");
    },
    []
  );

  /** Calculate total agenda duration */
  const totalDuration = useMemo(
    () => sections.reduce((sum, s) => sum + s.duration, 0),
    [sections]
  );

  /** Calculate effectiveness score */
  const effectivenessScore = useMemo(() => {
    return Math.round(
      SCORING_CRITERIA.reduce((sum, c) => sum + (scores[c.id] || 0) * c.weight, 0)
    );
  }, [scores]);

  /** Get start time for section at given index */
  const getSectionStartTime = useCallback(
    (index) => {
      let offset = 0;
      for (let i = 0; i < index; i++) offset += sections[i].duration;
      return addMinutes(meetingTime, offset);
    },
    [sections, meetingTime]
  );

  /** Section operations */
  const addSection = () => {
    setSections([
      ...sections,
      { id: uid(), title: "New Topic", duration: 10, type: "discussion", notes: "", status: "pending" },
    ]);
  };

  const updateSection = (index, updated) => {
    const next = [...sections];
    next[index] = updated;
    setSections(next);
  };

  const removeSection = (index) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  /** Prep item operations */
  const addPrepItem = () => setPrepItems([...prepItems, { id: uid(), text: "", done: false }]);
  const togglePrepItem = (index) => {
    const next = [...prepItems];
    next[index] = { ...next[index], done: !next[index].done };
    setPrepItems(next);
  };
  const updatePrepItem = (index, text) => {
    const next = [...prepItems];
    next[index] = { ...next[index], text };
    setPrepItems(next);
  };
  const removePrepItem = (index) => setPrepItems(prepItems.filter((_, i) => i !== index));

  /** Action item operations */
  const addActionItem = () =>
    setActionItems([
      ...actionItems,
      { id: uid(), text: "", assignee: "", deadline: "", priority: "medium" },
    ]);
  const updateActionItem = (index, updated) => {
    const next = [...actionItems];
    next[index] = updated;
    setActionItems(next);
  };
  const removeActionItem = (index) => setActionItems(actionItems.filter((_, i) => i !== index));

  const tabs = [
    { id: "templates", label: "📋 Templates", count: AGENDA_TEMPLATES.length },
    { id: "agenda", label: "📝 Agenda", count: sections.length },
    { id: "prep", label: "✅ Prep", count: prepItems.filter((p) => !p.done).length },
    { id: "actions", label: "🎯 Actions", count: actionItems.length },
    { id: "score", label: "📊 Score", count: effectivenessScore },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📋 Meeting Agenda Builder
          </h1>
          <p className="text-gray-500 text-lg">
            Structure your meetings for maximum productivity
          </p>
        </div>

        {/* Meeting Info Bar */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-gray-500 block mb-1">Meeting Title</label>
            <input
              type="text"
              value={agendaTitle}
              onChange={(e) => setAgendaTitle(e.target.value)}
              className="w-full text-lg font-bold bg-transparent border-none text-gray-900 dark:text-white focus:outline-none"
              placeholder="Enter meeting title..."
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Date</label>
            <input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="text-sm bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 border-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Start Time</label>
            <input
              type="time"
              value={meetingTime}
              onChange={(e) => setMeetingTime(e.target.value)}
              className="text-sm bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 border-none"
            />
          </div>
          <div className="flex items-end gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatTime(totalDuration)}</div>
              <div className="text-xs text-gray-500">Total Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: getScoreColor(effectivenessScore) }}>
                {effectivenessScore}%
              </div>
              <div className="text-xs text-gray-500">Score</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? "bg-blue-500 text-blue-100" : "bg-gray-200 dark:bg-gray-600 text-gray-500"
                }`}>
                  {tab.id === "score" ? getGrade(tab.count) : tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          {/* Templates Tab */}
          {activeTab === "templates" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Choose a Template</h2>
                <button
                  type="button"
                  onClick={() => { setSelectedTemplate(null); setSections([]); setPrepItems([]); setActiveTab("agenda"); }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Start from scratch →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {AGENDA_TEMPLATES.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={loadTemplate}
                    selected={selectedTemplate?.id === template.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Agenda Tab */}
          {activeTab === "agenda" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Agenda Sections ({sections.length})
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    {showPreview ? "✏️ Edit" : "👁️ Preview"}
                  </button>
                  <button
                    type="button"
                    onClick={addSection}
                    className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    + Add Section
                  </button>
                </div>
              </div>

              {sections.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <div className="text-5xl mb-4">📋</div>
                  <p className="text-lg mb-2">No agenda sections yet</p>
                  <p className="text-sm">Choose a template or add sections manually</p>
                </div>
              ) : showPreview ? (
                /* Preview Mode */
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-1">{agendaTitle || "Untitled Meeting"}</h3>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      📅 {meetingDate} · 🕐 {meetingTime} · ⏱️ {formatTime(totalDuration)} · 📝 {sections.length} sections
                    </div>
                  </div>
                  {sections.map((section, i) => (
                    <div key={section.id} className="flex gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="text-center min-w-[60px]">
                        <div className="text-xs font-bold text-gray-500">{getSectionStartTime(i)}</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{section.duration}m</div>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">{section.title}</div>
                        {section.notes && <div className="text-xs text-gray-500 mt-1">{section.notes}</div>}
                      </div>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full h-fit" style={{
                        background: section.status === "completed" ? "#10b98120" : section.status === "in-progress" ? "#f59e0b20" : "#6b728020",
                        color: section.status === "completed" ? "#10b981" : section.status === "in-progress" ? "#f59e0b" : "#6b7280",
                      }}>
                        {section.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Edit Mode */
                <div className="space-y-3">
                  {sections.map((section, i) => (
                    <AgendaSection
                      key={section.id}
                      section={section}
                      index={i}
                      startTime={getSectionStartTime(i)}
                      onUpdate={(updated) => updateSection(i, updated)}
                      onRemove={removeSection}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Prep Tab */}
          {activeTab === "prep" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Pre-Meeting Preparation
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">
                    {prepItems.filter((p) => p.done).length}/{prepItems.length} completed
                  </span>
                  <button
                    type="button"
                    onClick={addPrepItem}
                    className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    + Add Item
                  </button>
                </div>
              </div>

              {prepItems.length > 0 && (
                <div className="mb-6">
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${prepItems.length > 0 ? (prepItems.filter((p) => p.done).length / prepItems.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}

              {prepItems.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <div className="text-5xl mb-4">✅</div>
                  <p className="text-lg mb-2">No preparation items yet</p>
                  <p className="text-sm">Add items to ensure everyone comes prepared</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {prepItems.map((item, i) => (
                    <PrepItem
                      key={item.id}
                      item={item}
                      index={i}
                      onToggle={togglePrepItem}
                      onUpdate={updatePrepItem}
                      onRemove={removePrepItem}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions Tab */}
          {activeTab === "actions" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Action Items ({actionItems.length})
                </h2>
                <button
                  type="button"
                  onClick={addActionItem}
                  className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  + Add Action
                </button>
              </div>

              {actionItems.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <div className="text-5xl mb-4">🎯</div>
                  <p className="text-lg mb-2">No action items yet</p>
                  <p className="text-sm">Define follow-up tasks with owners and deadlines</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-3 text-xs font-semibold text-gray-400 uppercase">
                    <span className="w-5" />
                    <span className="flex-1">Description</span>
                    <span className="w-28">Assignee</span>
                    <span className="w-32">Deadline</span>
                    <span className="w-20">Priority</span>
                    <span className="w-4" />
                  </div>
                  {actionItems.map((item, i) => (
                    <ActionItemRow
                      key={item.id}
                      item={item}
                      index={i}
                      onUpdate={updateActionItem}
                      onRemove={removeActionItem}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Score Tab */}
          {activeTab === "score" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Meeting Effectiveness Score
                </h2>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-4xl font-bold" style={{ color: getScoreColor(effectivenessScore) }}>
                      {effectivenessScore}%
                    </div>
                    <div className="text-xs text-gray-500">Overall</div>
                  </div>
                  <div className="text-center px-3 py-1 rounded-lg" style={{ background: `${getScoreColor(effectivenessScore)}15` }}>
                    <div className="text-xl font-bold" style={{ color: getScoreColor(effectivenessScore) }}>
                      {getGrade(effectivenessScore)}
                    </div>
                    <div className="text-xs text-gray-500">Grade</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  {SCORING_CRITERIA.map((criterion) => (
                    <ScoreSlider
                      key={criterion.id}
                      criterion={criterion}
                      value={scores[criterion.id]}
                      onChange={(val) => setScores({ ...scores, [criterion.id]: val })}
                    />
                  ))}
                </div>

                {/* Breakdown Chart */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Score Breakdown</h3>
                  {SCORING_CRITERIA.map((criterion) => {
                    const value = scores[criterion.id];
                    const weighted = Math.round(value * criterion.weight);
                    return (
                      <div key={criterion.id}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 dark:text-gray-400">{criterion.name}</span>
                          <span className="font-semibold" style={{ color: getScoreColor(value) }}>
                            {value}% × {Math.round(criterion.weight * 100)}% = {weighted}pts
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${value}%`, background: getScoreColor(value) }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-gray-700 dark:text-gray-300">Weighted Total</span>
                      <span style={{ color: getScoreColor(effectivenessScore) }}>{effectivenessScore}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
