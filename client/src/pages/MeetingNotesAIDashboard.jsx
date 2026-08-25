import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Sparkles,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  X,
  Search,
  Filter,
  Download,
  Eye,
  Edit3,
  Trash2,
  Brain,
  Target,
  BarChart3,
  TrendingUp,
  Tag,
  Calendar,
  Users,
  Star,
  Copy,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Zap,
  BookOpen,
  Layout,
  RefreshCw,
} from "lucide-react";
import {
  getNotes,
  getNoteById,
  generateNotes,
  updateNotes,
  deleteNotes,
  getActionItems,
  updateActionItem,
  addActionItem,
  reviewNotes,
  exportNotes,
  getTemplates,
  createTemplate,
  getNotesAnalytics,
} from "../services/meetingNotesAIApi";

const STATUS_COLORS = {
  draft: "bg-gray-500",
  processing: "bg-blue-500",
  completed: "bg-emerald-500",
  reviewed: "bg-purple-500",
  archived: "bg-slate-500",
};

const PRIORITY_COLORS = {
  low: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const SENTIMENT_COLORS = {
  positive: "text-green-600 bg-green-50 dark:bg-green-900/20",
  neutral: "text-gray-600 bg-gray-50 dark:bg-gray-700",
  negative: "text-red-600 bg-red-50 dark:bg-red-900/20",
  mixed: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
};

const QualityScoreBar = ({ label, score }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs text-gray-500 w-24">{label}</span>
    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-500" : "bg-red-500"
        }`}
        style={{ width: `${score}%` }}
      />
    </div>
    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-8 text-right">
      {score}%
    </span>
  </div>
);

const StatCard = ({ icon: Icon, label, value, subtext, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
    <div className={`p-2 rounded-lg w-fit mb-2 ${color || "bg-blue-100 dark:bg-blue-900/30"}`}>
      <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
    </div>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
  </div>
);

const NoteCard = ({ note, onView, onDelete }) => {
  const actionCount = note.actionItems?.length || 0;
  const completedCount = note.actionItems?.filter((a) => a.status === "completed").length || 0;
  const decisionCount = note.decisions?.length || 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
              {note.title}
            </h3>
            <span
              className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full text-white ${STATUS_COLORS[note.status]}`}
            >
              {note.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            {new Date(note.meetingDate || note.createdAt).toLocaleDateString()}
            {note.duration > 0 && ` • ${note.duration}min`}
            {note.version > 1 && ` • v${note.version}`}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onView(note)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(note._id)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {note.summary && (
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
          {note.summary}
        </p>
      )}

      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Target className="h-3 w-3" /> {actionCount} tasks
          {completedCount > 0 && <span className="text-green-500">({completedCount} done)</span>}
        </span>
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3" /> {decisionCount} decisions
        </span>
        {note.aiConfidence > 0 && (
          <span className="flex items-center gap-1">
            <Brain className="h-3 w-3" /> {Math.round(note.aiConfidence * 100)}%
          </span>
        )}
      </div>

      {note.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {note.tags.slice(0, 4).map((tag, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const ActionItemRow = ({ item, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={item.status === "completed"}
          onChange={() =>
            onUpdate(item.noteId, item._id, {
              status: item.status === "completed" ? "pending" : "completed",
            })
          }
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium ${
              item.status === "completed"
                ? "text-gray-400 line-through"
                : "text-gray-900 dark:text-white"
            }`}
          >
            {item.title}
          </p>
          <p className="text-xs text-gray-500">
            {item.assigneeName || "Unassigned"} • {item.category}
          </p>
        </div>
        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${PRIORITY_COLORS[item.priority]}`}>
          {item.priority}
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>
      {expanded && (
        <div className="mt-2 ml-7 p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-xs text-gray-600 dark:text-gray-400">
          {item.description || "No description"}
          {item.extractedFrom && (
            <p className="mt-1 text-gray-400 italic">Extracted from: "{item.extractedFrom}"</p>
          )}
        </div>
      )}
    </div>
  );
};

const GenerateModal = ({ onClose, onSubmit, loading }) => {
  const [form, setForm] = useState({
    title: "",
    rawInput: "",
    inputType: "text",
    duration: 60,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Generate AI Notes</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
          className="space-y-4"
        >
          <input
            type="text"
            placeholder="Meeting title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.inputType}
              onChange={(e) => setForm({ ...form, inputType: e.target.value })}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="text">📝 Text Notes</option>
              <option value="transcript">🎙️ Transcript</option>
              <option value="bullet_points">📋 Bullet Points</option>
              <option value="audio_summary">🔊 Audio Summary</option>
            </select>
            <input
              type="number"
              placeholder="Duration (minutes)"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              min="1"
            />
          </div>

          <textarea
            placeholder="Paste meeting content, transcript, or bullet points here... The AI will analyze the content and extract key topics, action items, decisions, and generate structured notes."
            value={form.rawInput}
            onChange={(e) => setForm({ ...form, rawInput: e.target.value })}
            rows={8}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 resize-none font-mono"
          />

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
            <p className="text-xs text-purple-700 dark:text-purple-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI will automatically extract: key topics, action items with assignees, decisions, participants, and quality scores
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !form.rawInput}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Generating notes...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate AI Notes
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const NoteDetailModal = ({ note, onClose, onReview, onExport }) => {
  const [activeSection, setActiveSection] = useState("summary");

  if (!note) return null;

  const sections = [
    { id: "summary", label: "Summary", icon: FileText },
    { id: "topics", label: "Key Topics", icon: Tag },
    { id: "actions", label: "Action Items", icon: Target },
    { id: "decisions", label: "Decisions", icon: Zap },
    { id: "quality", label: "Quality", icon: Star },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{note.title}</h2>
            <p className="text-sm text-gray-500">
              {new Date(note.meetingDate || note.createdAt).toLocaleDateString()} • v{note.version}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onExport(note._id, "markdown")}
              className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1"
            >
              <Download className="h-3 w-3" /> Export
            </button>
            {note.status === "completed" && (
              <button
                onClick={() => onReview(note._id)}
                className="px-3 py-1.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-200 flex items-center gap-1"
              >
                <CheckCircle className="h-3 w-3" /> Approve
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 p-2 border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeSection === s.id
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <s.icon className="h-3 w-3" />
              {s.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeSection === "summary" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Executive Summary</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{note.executiveSummary}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Summary</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{note.summary}</p>
              </div>
              {note.fullNotes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Notes</h3>
                  <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
                    {note.fullNotes}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeSection === "topics" && (
            <div className="space-y-3">
              {note.keyTopics?.length > 0 ? (
                note.keyTopics.map((topic, i) => (
                  <div
                    key={i}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border-l-4 border-blue-400"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{topic.title}</h4>
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${SENTIMENT_COLORS[topic.sentiment]}`}>
                        {topic.sentiment}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{topic.summary}</p>
                    {topic.keywords?.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {topic.keywords.map((kw, j) => (
                          <span key={j} className="px-1.5 py-0.5 text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No key topics extracted</p>
              )}
            </div>
          )}

          {activeSection === "actions" && (
            <div className="space-y-2">
              {note.actionItems?.length > 0 ? (
                note.actionItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <CheckCircle className={`h-4 w-4 ${item.status === "completed" ? "text-green-500" : "text-gray-300"}`} />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${item.status === "completed" ? "text-gray-400 line-through" : "text-gray-900 dark:text-white"}`}>
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500">{item.assigneeName} • {item.category}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${PRIORITY_COLORS[item.priority]}`}>
                      {item.priority}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No action items</p>
              )}
            </div>
          )}

          {activeSection === "decisions" && (
            <div className="space-y-3">
              {note.decisions?.length > 0 ? (
                note.decisions.map((d, i) => (
                  <div key={i} className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                    <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">{d.title}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{d.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>Outcome: <strong>{d.outcome}</strong></span>
                      {d.decidedByName?.length > 0 && <span>By: {d.decidedByName.join(", ")}</span>}
                      <span className={`px-1.5 py-0.5 rounded ${PRIORITY_COLORS[d.impact]}`}>{d.impact} impact</span>
                    </div>
                    {d.rationale && (
                      <p className="text-xs text-gray-500 mt-1 italic">Rationale: {d.rationale}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No decisions recorded</p>
              )}
            </div>
          )}

          {activeSection === "quality" && note.qualityScores && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-2xl font-bold text-blue-600">{note.qualityScores.completeness}%</p>
                  <p className="text-xs text-gray-500">Completeness</p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <p className="text-2xl font-bold text-green-600">{note.qualityScores.clarity}%</p>
                  <p className="text-xs text-gray-500">Clarity</p>
                </div>
                <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <p className="text-2xl font-bold text-amber-600">{note.qualityScores.actionability}%</p>
                  <p className="text-xs text-gray-500">Actionability</p>
                </div>
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <p className="text-2xl font-bold text-purple-600">{note.qualityScores.accuracy}%</p>
                  <p className="text-xs text-gray-500">Accuracy</p>
                </div>
              </div>
              <div className="space-y-2">
                <QualityScoreBar label="Completeness" score={note.qualityScores.completeness} />
                <QualityScoreBar label="Clarity" score={note.qualityScores.clarity} />
                <QualityScoreBar label="Actionability" score={note.qualityScores.actionability} />
                <QualityScoreBar label="Accuracy" score={note.qualityScores.accuracy} />
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>AI Confidence: <strong>{Math.round((note.aiConfidence || 0) * 100)}%</strong></span>
                <span>Processing: <strong>{note.processingTime || 0}ms</strong></span>
                <span>Words: <strong>{note.wordCount || 0}</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════

const MeetingNotesAIDashboard = () => {
  const [notes, setNotes] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("notes");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedNote, setSelectedNote] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genLoading, setGenLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [notesRes, itemsRes, analyticsRes] = await Promise.all([
        getNotes({
          search: searchTerm,
          status: filterStatus !== "all" ? filterStatus : undefined,
        }),
        getActionItems(),
        getNotesAnalytics(),
      ]);
      setNotes(notesRes.notes || []);
      setActionItems(itemsRes.items || []);
      setAnalytics(analyticsRes);
    } catch (err) {
      console.error("Failed to fetch notes data:", err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerate = async (form) => {
    try {
      setGenLoading(true);
      await generateNotes(form);
      setShowGenerateModal(false);
      fetchData();
    } catch (err) {
      console.error("Failed to generate notes:", err);
    } finally {
      setGenLoading(false);
    }
  };

  const handleReview = async (noteId) => {
    try {
      await reviewNotes(noteId, { reviewNotes: "Approved" });
      setSelectedNote(null);
      fetchData();
    } catch (err) {
      console.error("Failed to review:", err);
    }
  };

  const handleExport = async (noteId, format) => {
    try {
      const result = await exportNotes(noteId, format);
      // Download as file
      const blob = new Blob([result.exported], {
        type: format === "json" ? "application/json" : "text/markdown",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meeting-notes.${format === "json" ? "json" : "md"}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export:", err);
    }
  };

  const handleUpdateActionItem = async (noteId, itemId, data) => {
    try {
      await updateActionItem(noteId, itemId, data);
      fetchData();
    } catch (err) {
      console.error("Failed to update:", err);
    }
  };

  const tabs = [
    { id: "notes", label: "AI Notes", icon: FileText },
    { id: "action-items", label: "Action Items", icon: Target },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500">Loading AI notes...</p>
        </div>
      </div>
    );
  }

  const summary = analytics?.summary || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="h-7 w-7 text-purple-600" />
            Meeting Notes AI
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            AI-powered meeting notes with action items, decisions, and quality scoring
          </p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2 shadow-sm"
        >
          <Sparkles className="h-4 w-4" /> Generate Notes
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-purple-600 text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.id === "action-items" && actionItems.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold bg-white/20 rounded-full">{actionItems.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Notes Tab */}
      {activeTab === "notes" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
              <option value="reviewed">Reviewed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {notes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {notes.map((note) => (
                <NoteCard
                  key={note._id}
                  note={note}
                  onView={setSelectedNote}
                  onDelete={(id) => {
                    if (window.confirm("Delete this note?")) {
                      deleteNotes(id).then(fetchData);
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Brain className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">No notes yet. Generate your first AI notes!</p>
            </div>
          )}
        </div>
      )}

      {/* Action Items Tab */}
      {activeTab === "action-items" && (
        <div className="space-y-3">
          {actionItems.length > 0 ? (
            actionItems.map((item, i) => (
              <ActionItemRow
                key={`${item.noteId}-${item._id || i}`}
                item={item}
                onUpdate={handleUpdateActionItem}
              />
            ))
          ) : (
            <div className="text-center py-16">
              <Target className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">No action items yet</p>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={FileText} label="Total Notes" value={summary.totalNotes || 0} subtext={`${summary.reviewedNotes || 0} reviewed`} color="bg-purple-100 dark:bg-purple-900/30" />
            <StatCard icon={Target} label="Action Items" value={summary.totalActionItems || 0} subtext={`${summary.completedActionItems || 0} completed`} color="bg-blue-100 dark:bg-blue-900/30" />
            <StatCard icon={Zap} label="Decisions" value={summary.totalDecisions || 0} color="bg-amber-100 dark:bg-amber-900/30" />
            <StatCard icon={Brain} label="AI Confidence" value={`${summary.avgConfidence || 0}%`} color="bg-green-100 dark:bg-green-900/30" />
          </div>

          {/* Quality Scores */}
          {analytics.avgQuality && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <Star className="h-4 w-4" /> Average Quality Scores
              </h3>
              <div className="space-y-3">
                <QualityScoreBar label="Completeness" score={analytics.avgQuality.completeness} />
                <QualityScoreBar label="Clarity" score={analytics.avgQuality.clarity} />
                <QualityScoreBar label="Actionability" score={analytics.avgQuality.actionability} />
                <QualityScoreBar label="Accuracy" score={analytics.avgQuality.accuracy} />
              </div>
            </div>
          )}

          {/* Monthly Trend */}
          {analytics.monthlyTrend?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Monthly Notes Trend</h3>
              <div className="flex items-end gap-2 h-32">
                {analytics.monthlyTrend.map((m) => {
                  const maxCount = Math.max(...analytics.monthlyTrend.map((x) => x.count), 1);
                  const height = (m.count / maxCount) * 100;
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-medium text-gray-500">{m.count}</span>
                      <div className="w-full bg-purple-500 rounded-t-md" style={{ height: `${height}%` }} />
                      <span className="text-[10px] text-gray-400">{m.month.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top Tags */}
          {analytics.topTags?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <Tag className="h-4 w-4" /> Top Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {analytics.topTags.map((t, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full text-sm font-medium"
                  >
                    {t.tag} <span className="text-purple-400 ml-1">({t.count})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {selectedNote && (
        <NoteDetailModal
          note={selectedNote}
          onClose={() => setSelectedNote(null)}
          onReview={handleReview}
          onExport={handleExport}
        />
      )}

      {showGenerateModal && (
        <GenerateModal
          onClose={() => setShowGenerateModal(false)}
          onSubmit={handleGenerate}
          loading={genLoading}
        />
      )}
    </div>
  );
};

export default MeetingNotesAIDashboard;
