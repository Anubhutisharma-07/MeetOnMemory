import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Users,
  Clock,
  Zap,
  BarChart3,
  Brain,
  AlertTriangle,
  CheckCircle,
  Star,
  Search,
  Plus,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  Award,
  TrendingUp as TrendingUpIcon,
  RefreshCw,
  Eye,
  Trash2,
  Activity,
  Sparkles,
} from "lucide-react";
import {
  getROIRecords,
  getROIById,
  createROIRecord,
  deleteROIRecord,
  getROIAnalytics,
  getBenchmarks,
  simulateROI,
} from "../services/meetingROIApi";

const MEETING_TYPES = [
  { value: "standup", label: "Standup", icon: "📋" },
  { value: "1on1", label: "1-on-1", icon: "🤝" },
  { value: "team", label: "Team", icon: "👥" },
  { value: "allhands", label: "All Hands", icon: "🏢" },
  { value: "workshop", label: "Workshop", icon: "🛠️" },
  { value: "brainstorm", label: "Brainstorm", icon: "💡" },
  { value: "review", label: "Review", icon: "📝" },
  { value: "client", label: "Client", icon: "💼" },
  { value: "other", label: "Other", icon: "📌" },
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const StatCard = ({ icon: Icon, label, value, subtext, trend, color, trendUp }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 rounded-lg ${color || "bg-blue-100 dark:bg-blue-900/30"}`}>
        <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      </div>
      {trend !== undefined && (
        <span className={`flex items-center gap-0.5 text-xs font-medium ${trendUp ? "text-green-600" : "text-red-600"}`}>
          {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
  </div>
);

const ROIBadge = ({ roi }) => {
  if (roi > 50) return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Excellent</span>;
  if (roi > 0) return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Positive</span>;
  if (roi === 0) return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">Break-even</span>;
  return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Negative</span>;
};

const ROIRecordCard = ({ record, onView, onDelete }) => {
  const typeMeta = MEETING_TYPES.find((t) => t.value === record.meetingType) || MEETING_TYPES[8];
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">{record.title}</h3>
            <ROIBadge roi={record.roiPercentage} />
          </div>
          <p className="text-xs text-gray-500">
            {typeMeta.icon} {typeMeta.label} • {new Date(record.scheduledDate).toLocaleDateString()} • {record.duration}min
          </p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onView(record)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-600 transition-colors">
            <Eye className="h-4 w-4" />
          </button>
          <button onClick={() => onDelete(record._id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-600 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-gray-500">Cost</p>
          <p className="text-sm font-bold text-red-600">{formatCurrency(record.totalCost)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Value</p>
          <p className="text-sm font-bold text-green-600">{formatCurrency(record.totalDecisionValue)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">ROI</p>
          <p className={`text-sm font-bold ${record.roiPercentage >= 0 ? "text-green-600" : "text-red-600"}`}>
            {record.roiPercentage >= 0 ? "+" : ""}{record.roiPercentage}%
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500">
        <span>{record.participants?.length || 0} people</span>
        <span>{record.decisions?.length || 0} decisions</span>
        <span>{record.actionItemsCount || 0} actions</span>
      </div>
    </div>
  );
};

const BenchmarkBar = ({ metric, yourValue, industryValue, better }) => (
  <div className="py-3">
    <div className="flex justify-between text-sm mb-1">
      <span className="text-gray-700 dark:text-gray-300">{metric}</span>
      <div className="flex items-center gap-3">
        <span className={`font-bold ${better ? "text-green-600" : "text-red-600"}`}>{typeof yourValue === "number" && yourValue > 99 ? formatCurrency(yourValue) : yourValue}</span>
        <span className="text-gray-400">vs</span>
        <span className="text-gray-500">{typeof industryValue === "number" && industryValue > 99 ? formatCurrency(industryValue) : industryValue}</span>
        {better ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-red-500" />}
      </div>
    </div>
    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${better ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${Math.min(Math.max((yourValue / Math.max(yourValue, industryValue, 1)) * 100, 10), 100)}%` }} />
    </div>
  </div>
);

const CreateRecordModal = ({ onClose, onSubmit }) => {
  const [form, setForm] = useState({
    title: "",
    meetingType: "team",
    duration: 60,
    scheduledDate: new Date().toISOString().slice(0, 10),
    participants: [{ name: "", hourlyRate: 50, preparationTime: 0, travelTime: 0 }],
    venueCost: 0,
    cateringCost: 0,
    technologyCost: 0,
    travelCost: 0,
    otherCost: 0,
    decisions: [{ title: "", impact: "medium", estimatedValue: 0 }],
    actionItemsCount: 0,
    actionItemsCompleted: 0,
    participantSatisfaction: 7,
    productivityScore: 7,
    goalAchievement: 7,
    followThroughRate: 7,
    engagementScore: 60,
  });

  const addParticipant = () => {
    setForm({ ...form, participants: [...form.participants, { name: "", hourlyRate: 50, preparationTime: 0, travelTime: 0 }] });
  };

  const addDecision = () => {
    setForm({ ...form, decisions: [...form.decisions, { title: "", impact: "medium", estimatedValue: 0 }] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Log Meeting ROI</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Meeting title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400" required />

          <div className="grid grid-cols-3 gap-3">
            <select value={form.meetingType} onChange={(e) => setForm({ ...form, meetingType: e.target.value })} className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
              {MEETING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
            </select>
            <input type="number" placeholder="Duration (min)" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })} className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" min="1" />
            <input type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Participants</label>
            {form.participants.map((p, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 mb-2">
                <input placeholder="Name" value={p.name} onChange={(e) => { const pp = [...form.participants]; pp[i].name = e.target.value; setForm({ ...form, participants: pp }); }} className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                <input type="number" placeholder="$/hr" value={p.hourlyRate} onChange={(e) => { const pp = [...form.participants]; pp[i].hourlyRate = parseFloat(e.target.value); setForm({ ...form, participants: pp }); }} className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                <input type="number" placeholder="Prep (min)" value={p.preparationTime} onChange={(e) => { const pp = [...form.participants]; pp[i].preparationTime = parseInt(e.target.value); setForm({ ...form, participants: pp }); }} className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                <input type="number" placeholder="Travel (min)" value={p.travelTime} onChange={(e) => { const pp = [...form.participants]; pp[i].travelTime = parseInt(e.target.value); setForm({ ...form, participants: pp }); }} className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>
            ))}
            <button type="button" onClick={addParticipant} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"><Plus className="h-3 w-3" /> Add participant</button>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Direct Costs ($)</label>
            <div className="grid grid-cols-5 gap-2">
              {["venueCost", "cateringCost", "technologyCost", "travelCost", "otherCost"].map((key) => (
                <input key={key} type="number" placeholder={key.replace("Cost", "")} value={form[key]} onChange={(e) => setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })} className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white" min="0" />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Decisions Made</label>
            {form.decisions.map((d, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                <input placeholder="Decision" value={d.title} onChange={(e) => { const dd = [...form.decisions]; dd[i].title = e.target.value; setForm({ ...form, decisions: dd }); }} className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                <select value={d.impact} onChange={(e) => { const dd = [...form.decisions]; dd[i].impact = e.target.value; setForm({ ...form, decisions: dd }); }} className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                </select>
                <input type="number" placeholder="Est. value ($)" value={d.estimatedValue} onChange={(e) => { const dd = [...form.decisions]; dd[i].estimatedValue = parseFloat(e.target.value) || 0; setForm({ ...form, decisions: dd }); }} className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>
            ))}
            <button type="button" onClick={addDecision} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"><Plus className="h-3 w-3" /> Add decision</button>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Action Items: {form.actionItemsCount} total, {form.actionItemsCompleted} completed</label>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Total action items" value={form.actionItemsCount} onChange={(e) => setForm({ ...form, actionItemsCount: parseInt(e.target.value) || 0 })} className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" min="0" />
              <input type="number" placeholder="Completed" value={form.actionItemsCompleted} onChange={(e) => setForm({ ...form, actionItemsCompleted: parseInt(e.target.value) || 0 })} className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" min="0" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Quality Scores (1-10)</label>
            <div className="grid grid-cols-2 gap-3">
              {[["participantSatisfaction", "Satisfaction"], ["productivityScore", "Productivity"], ["goalAchievement", "Goal Achievement"], ["followThroughRate", "Follow-through"]].map(([key, label]) => (
                <div key={key}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1"><span>{label}</span><span className="font-bold">{form[key]}/10</span></div>
                  <input type="range" min="1" max="10" value={form[key]} onChange={(e) => setForm({ ...form, [key]: parseInt(e.target.value) })} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors">Save ROI Record</button>
        </form>
      </div>
    </div>
  );
};

const SimulateModal = ({ onClose }) => {
  const [form, setForm] = useState({ participants: 5, duration: 60, hourlyRate: 50, decisionsCount: 2, avgDecisionValue: 1000, venueCost: 0 });
  const [result, setResult] = useState(null);

  const handleSimulate = async () => {
    try {
      const res = await simulateROI(form);
      setResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">ROI What-If Simulator</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div><label className="text-xs text-gray-500 block mb-1">Participants</label><input type="number" value={form.participants} onChange={(e) => setForm({ ...form, participants: parseInt(e.target.value) })} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" /></div>
          <div><label className="text-xs text-gray-500 block mb-1">Duration (min)</label><input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" /></div>
          <div><label className="text-xs text-gray-500 block mb-1">Avg Hourly Rate ($)</label><input type="number" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: parseInt(e.target.value) })} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" /></div>
          <div><label className="text-xs text-gray-500 block mb-1">Decisions Count</label><input type="number" value={form.decisionsCount} onChange={(e) => setForm({ ...form, decisionsCount: parseInt(e.target.value) })} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" /></div>
          <div><label className="text-xs text-gray-500 block mb-1">Avg Decision Value ($)</label><input type="number" value={form.avgDecisionValue} onChange={(e) => setForm({ ...form, avgDecisionValue: parseInt(e.target.value) })} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" /></div>
          <div><label className="text-xs text-gray-500 block mb-1">Venue Cost ($)</label><input type="number" value={form.venueCost} onChange={(e) => setForm({ ...form, venueCost: parseInt(e.target.value) })} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" /></div>
        </div>

        <button onClick={handleSimulate} className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-4 w-4" /> Simulate ROI
        </button>

        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl"><p className="text-xs text-gray-500">Total Cost</p><p className="text-lg font-bold text-red-600">{formatCurrency(result.simulation.totalCost)}</p></div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl"><p className="text-xs text-gray-500">Total Value</p><p className="text-lg font-bold text-green-600">{formatCurrency(result.simulation.totalValue)}</p></div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl"><p className="text-xs text-gray-500">ROI</p><p className={`text-lg font-bold ${result.simulation.roi >= 0 ? "text-green-600" : "text-red-600"}`}>{result.simulation.roi}%</p></div>
              <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl"><p className="text-xs text-gray-500">Cost/Decision</p><p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(result.simulation.costPerDecision)}</p></div>
            </div>

            {result.scenarios?.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Scenario Comparison</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="text-gray-500 border-b border-gray-200 dark:border-gray-600">
                      <th className="text-left py-2">People</th><th className="text-left py-2">Duration</th><th className="text-right py-2">Cost</th><th className="text-right py-2">Value</th><th className="text-right py-2">ROI</th><th className="text-right py-2">Cost/Decision</th>
                    </tr></thead>
                    <tbody>
                      {result.scenarios.slice(0, 12).map((s, i) => (
                        <tr key={i} className="border-b border-gray-100 dark:border-gray-600">
                          <td className="py-1.5">{s.participants}</td>
                          <td className="py-1.5">{s.duration}min</td>
                          <td className="text-right py-1.5">{formatCurrency(s.cost)}</td>
                          <td className="text-right py-1.5 text-green-600">{formatCurrency(s.value)}</td>
                          <td className={`text-right py-1.5 font-bold ${s.roi >= 0 ? "text-green-600" : "text-red-600"}`}>{s.roi}%</td>
                          <td className="text-right py-1.5">{formatCurrency(s.costPerDecision)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════

const MeetingROIDashboard = () => {
  const [records, setRecords] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [benchmarks, setBenchmarks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSimModal, setShowSimModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [recordsRes, analyticsRes, benchmarksRes] = await Promise.all([
        getROIRecords({ meetingType: filterType !== "all" ? filterType : undefined, search: searchTerm }),
        getROIAnalytics(),
        getBenchmarks(),
      ]);
      setRecords(recordsRes.records || []);
      setAnalytics(analyticsRes);
      setBenchmarks(benchmarksRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterType, searchTerm]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (data) => {
    try {
      await createROIRecord(data);
      setShowCreateModal(false);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this ROI record?")) return;
    try { await deleteROIRecord(id); fetchData(); } catch (err) { console.error(err); }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "records", label: "Records", icon: Target },
    { id: "benchmarks", label: "Benchmarks", icon: Award },
    { id: "simulator", label: "Simulator", icon: Calculator },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500">Loading ROI data...</p>
        </div>
      </div>
    );
  }

  const summary = analytics?.summary || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-emerald-600" />
            Meeting ROI Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track meeting costs, decision values, and return on investment
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSimModal(true)} className="px-3 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium rounded-xl text-sm flex items-center gap-2">
            <Calculator className="h-4 w-4" /> Simulate
          </button>
          <button onClick={() => setShowCreateModal(true)} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2 shadow-sm">
            <Plus className="h-4 w-4" /> Log ROI
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700 overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? "bg-emerald-600 text-white shadow-sm" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Target} label="Total Meetings" value={summary.totalMeetings || 0} color="bg-blue-100 dark:bg-blue-900/30" />
            <StatCard icon={DollarSign} label="Total Cost" value={formatCurrency(summary.totalCost || 0)} color="bg-red-100 dark:bg-red-900/30" />
            <StatCard icon={TrendingUp} label="Total Value" value={formatCurrency(summary.totalValue || 0)} subtext={`Net: ${formatCurrency(summary.netValue || 0)}`} color="bg-green-100 dark:bg-green-900/30" />
            <StatCard icon={Activity} label="Average ROI" value={`${summary.avgROI || 0}%`} subtext={`${summary.positiveROI || 0} positive`} color="bg-purple-100 dark:bg-purple-900/30" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={DollarSign} label="Avg Cost/Meeting" value={formatCurrency(summary.avgCostPerMeeting || 0)} color="bg-amber-100 dark:bg-amber-900/30" />
            <StatCard icon={Zap} label="Cost/Decision" value={formatCurrency(summary.avgCostPerDecision || 0)} subtext={`${summary.totalDecisions || 0} total`} color="bg-cyan-100 dark:bg-cyan-900/30" />
            <StatCard icon={Target} label="Cost/Action Item" value={formatCurrency(summary.avgCostPerActionItem || 0)} subtext={`${summary.totalActionItems || 0} total`} color="bg-pink-100 dark:bg-pink-900/30" />
            <StatCard icon={Star} label="Value/Minute" value={formatCurrency(summary.avgValuePerMeeting || 0)} subtext={`${summary.avgValuePerMeeting || 0} avg`} color="bg-orange-100 dark:bg-orange-900/30" />
          </div>

          {/* Type Breakdown & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">ROI by Meeting Type</h3>
              {analytics?.typeAnalysis?.length > 0 ? (
                <div className="space-y-3">
                  {analytics.typeAnalysis.sort((a, b) => b.avgROI - a.avgROI).map((t) => {
                    const meta = MEETING_TYPES.find((m) => m.value === t.type) || MEETING_TYPES[8];
                    return (
                      <div key={t.type} className="flex items-center gap-3">
                        <span className="text-sm w-6">{meta.icon}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300 w-16">{meta.label}</span>
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${t.avgROI >= 0 ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${Math.min(Math.abs(t.avgROI), 100)}%` }} />
                        </div>
                        <span className={`text-sm font-bold w-12 text-right ${t.avgROI >= 0 ? "text-green-600" : "text-red-600"}`}>{t.avgROI}%</span>
                        <span className="text-xs text-gray-400 w-8">{t.count}x</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Recommendations</h3>
              {analytics?.recommendations?.length > 0 ? (
                <div className="space-y-3">
                  {analytics.recommendations.map((rec, i) => (
                    <div key={i} className={`p-3 rounded-lg border-l-4 ${
                      rec.priority === "high" ? "border-red-400 bg-red-50 dark:bg-red-900/10" :
                      rec.priority === "medium" ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10" :
                      "border-green-400 bg-green-50 dark:bg-green-900/10"
                    }`}>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{rec.title}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{rec.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No recommendations</p>
              )}
            </div>
          </div>

          {/* Top & Worst ROI */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-500" /> Top ROI Meetings</h3>
              {analytics?.topROI?.length > 0 ? analytics.topROI.map((m, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div><p className="text-sm font-medium text-gray-900 dark:text-white">{m.title}</p><p className="text-xs text-gray-500">{new Date(m.date).toLocaleDateString()}</p></div>
                  <span className="text-sm font-bold text-green-600">+{m.roi}%</span>
                </div>
              )) : <p className="text-sm text-gray-400 text-center py-4">No data</p>}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"><TrendingDown className="h-4 w-4 text-red-500" /> Lowest ROI Meetings</h3>
              {analytics?.worstROI?.length > 0 ? analytics.worstROI.map((m, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div><p className="text-sm font-medium text-gray-900 dark:text-white">{m.title}</p><p className="text-xs text-gray-500">{new Date(m.date).toLocaleDateString()}</p></div>
                  <span className="text-sm font-bold text-red-600">{m.roi}%</span>
                </div>
              )) : <p className="text-sm text-gray-400 text-center py-4">No data</p>}
            </div>
          </div>
        </div>
      )}

      {/* Records */}
      {activeTab === "records" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search records..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400" />
            </div>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
              <option value="all">All Types</option>
              {MEETING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
            </select>
          </div>
          {records.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {records.map((r) => <ROIRecordCard key={r._id} record={r} onView={setSelectedRecord} onDelete={handleDelete} />)}
            </div>
          ) : (
            <div className="text-center py-16"><TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No ROI records yet</p></div>
          )}
        </div>
      )}

      {/* Benchmarks */}
      {activeTab === "benchmarks" && benchmarks && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2"><Award className="h-4 w-4" /> Your Performance vs Industry Benchmarks</h3>
            <div className="space-y-1">
              {benchmarks.comparison?.map((b, i) => (
                <BenchmarkBar key={i} metric={b.metric} yourValue={b.yourValue} industryValue={b.industryValue} better={b.better} />
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Quality Scores</h3>
            {analytics?.qualityStats && (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  ["avgSatisfaction", "Satisfaction", "/10"],
                  ["avgProductivity", "Productivity", "/10"],
                  ["avgGoalAchievement", "Goal Achievement", "/10"],
                  ["avgFollowThrough", "Follow-through", "/10"],
                  ["avgEngagement", "Engagement", "%"],
                ].map(([key, label, suffix]) => (
                  <div key={key} className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.qualityStats[key]}{suffix}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Simulator */}
      {activeTab === "simulator" && (
        <div className="text-center py-16">
          <Calculator className="h-12 w-12 text-amber-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">Use the What-If Simulator to model different meeting scenarios</p>
          <button onClick={() => setShowSimModal(true)} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium">Open Simulator</button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && <CreateRecordModal onClose={() => setShowCreateModal(false)} onSubmit={handleCreate} />}
      {showSimModal && <SimulateModal onClose={() => setShowSimModal(false)} />}
    </div>
  );
};

export default MeetingROIDashboard;
