import MeetingROI from "../models/meetingROIModel.js";

// ═══════════════════════════════════════════
// CRUD
// ═══════════════════════════════════════════

export const getROIRecords = async (req, res) => {
  try {
    const {
      meetingType,
      status,
      page = 1,
      limit = 20,
      sortBy = "scheduledDate",
      sortOrder = "desc",
      startDate,
      endDate,
    } = req.query;

    const filter = { organization: req.user.organization };
    if (meetingType) filter.meetingType = meetingType;
    if (status) filter.status = status;
    if (startDate && endDate) {
      filter.scheduledDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [records, total] = await Promise.all([
      MeetingROI.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate("participants.user", "name email")
        .lean(),
      MeetingROI.countDocuments(filter),
    ]);

    // Compute virtual fields
    const enriched = records.map((r) => {
      const laborCost = r.participants.reduce((sum, p) => {
        const totalTime = (r.duration + (p.preparationTime || 0) + (p.travelTime || 0)) / 60;
        return sum + totalTime * (p.hourlyRate || 50);
      }, 0);
      const totalCost = laborCost + (r.venueCost || 0) + (r.cateringCost || 0) + (r.technologyCost || 0) + (r.travelCost || 0) + (r.otherCost || 0);
      const totalDecisionValue = (r.decisions || []).reduce((sum, d) => sum + (d.estimatedValue || 0), 0);
      const roiPercentage = totalCost > 0 ? Math.round(((totalDecisionValue - totalCost) / totalCost) * 100) : 0;

      return {
        ...r,
        totalCost: Math.round(totalCost),
        totalDecisionValue: Math.round(totalDecisionValue),
        roiPercentage,
        costPerDecision: (r.decisions?.length || 0) > 0 ? Math.round(totalCost / r.decisions.length) : 0,
        costPerActionItem: (r.actionItemsCount || 0) > 0 ? Math.round(totalCost / r.actionItemsCount) : 0,
        valuePerMinute: r.duration > 0 ? Math.round(totalDecisionValue / r.duration) : 0,
      };
    });

    res.json({
      records: enriched,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getROIById = async (req, res) => {
  try {
    const record = await MeetingROI.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    })
      .populate("participants.user", "name email")
      .lean();

    if (!record) return res.status(404).json({ message: "ROI record not found" });

    // Enrich
    const laborCost = record.participants.reduce((sum, p) => {
      const totalTime = (record.duration + (p.preparationTime || 0) + (p.travelTime || 0)) / 60;
      return sum + totalTime * (p.hourlyRate || 50);
    }, 0);
    const totalCost = laborCost + (record.venueCost || 0) + (record.cateringCost || 0) + (record.technologyCost || 0) + (record.travelCost || 0) + (record.otherCost || 0);
    const totalDecisionValue = (record.decisions || []).reduce((sum, d) => sum + (d.estimatedValue || 0), 0);

    res.json({
      ...record,
      totalCost: Math.round(totalCost),
      totalDecisionValue: Math.round(totalDecisionValue),
      roiPercentage: totalCost > 0 ? Math.round(((totalDecisionValue - totalCost) / totalCost) * 100) : 0,
      costPerDecision: (record.decisions?.length || 0) > 0 ? Math.round(totalCost / record.decisions.length) : 0,
      costPerActionItem: (record.actionItemsCount || 0) > 0 ? Math.round(totalCost / record.actionItemsCount) : 0,
      valuePerMinute: record.duration > 0 ? Math.round(totalDecisionValue / record.duration) : 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createROIRecord = async (req, res) => {
  try {
    const record = new MeetingROI({
      ...req.body,
      organization: req.user.organization,
      status: "completed",
    });
    await record.save();
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateROIRecord = async (req, res) => {
  try {
    const record = await MeetingROI.findOneAndUpdate(
      { _id: req.params.id, organization: req.user.organization },
      req.body,
      { new: true, runValidators: true }
    );
    if (!record) return res.status(404).json({ message: "ROI record not found" });
    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteROIRecord = async (req, res) => {
  try {
    const record = await MeetingROI.findOneAndDelete({
      _id: req.params.id,
      organization: req.user.organization,
    });
    if (!record) return res.status(404).json({ message: "ROI record not found" });
    res.json({ message: "ROI record deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════

function enrichRecord(r) {
  const laborCost = (r.participants || []).reduce((sum, p) => {
    const totalTime = (r.duration + (p.preparationTime || 0) + (p.travelTime || 0)) / 60;
    return sum + totalTime * (p.hourlyRate || 50);
  }, 0);
  const totalCost = laborCost + (r.venueCost || 0) + (r.cateringCost || 0) + (r.technologyCost || 0) + (r.travelTime || 0) * 0 + (r.travelCost || 0) + (r.otherCost || 0);
  const totalDecisionValue = (r.decisions || []).reduce((sum, d) => sum + (d.estimatedValue || 0), 0);
  const roiPercentage = totalCost > 0 ? Math.round(((totalDecisionValue - totalCost) / totalCost) * 100) : 0;
  return {
    ...r,
    totalCost: Math.round(totalCost),
    totalDecisionValue: Math.round(totalDecisionValue),
    roiPercentage,
  };
}

export const getROIAnalytics = async (req, res) => {
  try {
    const orgId = req.user.organization;
    const records = await MeetingROI.find({ organization: orgId }).lean();

    const enriched = records.map(enrichRecord);

    // Overall stats
    const totalMeetings = enriched.length;
    const totalCostAll = enriched.reduce((s, r) => s + r.totalCost, 0);
    const totalValueAll = enriched.reduce((s, r) => s + r.totalDecisionValue, 0);
    const avgROI = totalMeetings > 0
      ? Math.round(enriched.reduce((s, r) => s + r.roiPercentage, 0) / totalMeetings)
      : 0;
    const avgCostPerMeeting = totalMeetings > 0 ? Math.round(totalCostAll / totalMeetings) : 0;
    const avgValuePerMeeting = totalMeetings > 0 ? Math.round(totalValueAll / totalMeetings) : 0;
    const totalDecisions = enriched.reduce((s, r) => s + (r.decisions?.length || 0), 0);
    const avgCostPerDecision = totalDecisions > 0 ? Math.round(totalCostAll / totalDecisions) : 0;
    const totalActionItems = enriched.reduce((s, r) => s + (r.actionItemsCount || 0), 0);
    const avgCostPerActionItem = totalActionItems > 0 ? Math.round(totalCostAll / totalActionItems) : 0;

    // Positive vs negative ROI
    const positiveROI = enriched.filter((r) => r.roiPercentage > 0).length;
    const negativeROI = enriched.filter((r) => r.roiPercentage < 0).length;
    const breakevenROI = enriched.filter((r) => r.roiPercentage === 0).length;

    // Type breakdown
    const typeBreakdown = {};
    enriched.forEach((r) => {
      if (!typeBreakdown[r.meetingType]) {
        typeBreakdown[r.meetingType] = { count: 0, totalCost: 0, totalValue: 0, totalROI: 0, totalDecisions: 0, totalActionItems: 0 };
      }
      typeBreakdown[r.meetingType].count++;
      typeBreakdown[r.meetingType].totalCost += r.totalCost;
      typeBreakdown[r.meetingType].totalValue += r.totalDecisionValue;
      typeBreakdown[r.meetingType].totalROI += r.roiPercentage;
      typeBreakdown[r.meetingType].totalDecisions += r.decisions?.length || 0;
      typeBreakdown[r.meetingType].totalActionItems += r.actionItemsCount || 0;
    });

    const typeAnalysis = Object.entries(typeBreakdown).map(([type, data]) => ({
      type,
      count: data.count,
      avgCost: Math.round(data.totalCost / data.count),
      avgValue: Math.round(data.totalValue / data.count),
      avgROI: Math.round(data.totalROI / data.count),
      totalDecisions: data.totalDecisions,
      totalActionItems: data.totalActionItems,
    }));

    // Monthly trend
    const monthlyTrend = {};
    enriched.forEach((r) => {
      const month = new Date(r.scheduledDate).toISOString().slice(0, 7);
      if (!monthlyTrend[month]) monthlyTrend[month] = { count: 0, cost: 0, value: 0, roi: 0 };
      monthlyTrend[month].count++;
      monthlyTrend[month].cost += r.totalCost;
      monthlyTrend[month].value += r.totalDecisionValue;
      monthlyTrend[month].roi += r.roiPercentage;
    });

    // Cost breakdown
    const costBreakdown = {
      labor: enriched.reduce((s, r) => {
        return s + (r.participants || []).reduce((ps, p) => {
          return ps + ((r.duration + (p.preparationTime || 0) + (p.travelTime || 0)) / 60) * (p.hourlyRate || 50);
        }, 0);
      }, 0),
      venue: enriched.reduce((s, r) => s + (r.venueCost || 0), 0),
      catering: enriched.reduce((s, r) => s + (r.cateringCost || 0), 0),
      technology: enriched.reduce((s, r) => s + (r.technologyCost || 0), 0),
      travel: enriched.reduce((s, r) => s + (r.travelCost || 0), 0),
      other: enriched.reduce((s, r) => s + (r.otherCost || 0), 0),
    };

    // Quality averages
    const qualityStats = {
      avgSatisfaction: totalMeetings > 0
        ? Math.round(enriched.reduce((s, r) => s + (r.participantSatisfaction || 0), 0) / totalMeetings * 10) / 10
        : 0,
      avgProductivity: totalMeetings > 0
        ? Math.round(enriched.reduce((s, r) => s + (r.productivityScore || 0), 0) / totalMeetings * 10) / 10
        : 0,
      avgGoalAchievement: totalMeetings > 0
        ? Math.round(enriched.reduce((s, r) => s + (r.goalAchievement || 0), 0) / totalMeetings * 10) / 10
        : 0,
      avgFollowThrough: totalMeetings > 0
        ? Math.round(enriched.reduce((s, r) => s + (r.followThroughRate || 0), 0) / totalMeetings * 10) / 10
        : 0,
      avgEngagement: totalMeetings > 0
        ? Math.round(enriched.reduce((s, r) => s + (r.engagementScore || 0), 0) / totalMeetings)
        : 0,
    };

    // Top ROI meetings
    const topROI = [...enriched]
      .sort((a, b) => b.roiPercentage - a.roiPercentage)
      .slice(0, 5)
      .map((r) => ({
        title: r.title,
        roi: r.roiPercentage,
        cost: r.totalCost,
        value: r.totalDecisionValue,
        date: r.scheduledDate,
        type: r.meetingType,
      }));

    // Worst ROI meetings
    const worstROI = [...enriched]
      .sort((a, b) => a.roiPercentage - b.roiPercentage)
      .slice(0, 5)
      .map((r) => ({
        title: r.title,
        roi: r.roiPercentage,
        cost: r.totalCost,
        value: r.totalDecisionValue,
        date: r.scheduledDate,
        type: r.meetingType,
      }));

    // Recommendations
    const recommendations = [];
    if (avgROI < 0) {
      recommendations.push({
        type: "warning",
        title: "Negative Average ROI",
        description: `Your meetings average ${avgROI}% ROI. Consider reducing duration or participants to cut costs.`,
        priority: "high",
      });
    }
    if (avgCostPerDecision > 500) {
      recommendations.push({
        type: "cost",
        title: "High Cost Per Decision",
        description: `Each decision costs $${avgCostPerDecision} on average. Try making fewer, higher-impact meetings.`,
        priority: "medium",
      });
    }
    if (qualityStats.avgSatisfaction > 0 && qualityStats.avgSatisfaction < 5) {
      recommendations.push({
        type: "quality",
        title: "Low Participant Satisfaction",
        description: `Average satisfaction is ${qualityStats.avgSatisfaction}/10. Review meeting agendas and formats.`,
        priority: "high",
      });
    }
    if (positiveROI > totalMeetings * 0.7) {
      recommendations.push({
        type: "positive",
        title: "Strong ROI Performance",
        description: `${Math.round((positiveROI / totalMeetings) * 100)}% of meetings have positive ROI. Keep it up!`,
        priority: "info",
      });
    }
    if (qualityStats.avgEngagement > 0 && qualityStats.avgEngagement < 40) {
      recommendations.push({
        type: "engagement",
        title: "Low Engagement Scores",
        description: `Average engagement is ${qualityStats.avgEngagement}%. Try shorter meetings with clearer agendas.`,
        priority: "medium",
      });
    }

    res.json({
      summary: {
        totalMeetings,
        totalCost: Math.round(totalCostAll),
        totalValue: Math.round(totalValueAll),
        netValue: Math.round(totalValueAll - totalCostAll),
        avgROI,
        avgCostPerMeeting,
        avgValuePerMeeting,
        avgCostPerDecision,
        avgCostPerActionItem,
        totalDecisions,
        totalActionItems,
        positiveROI,
        negativeROI,
        breakevenROI,
      },
      typeAnalysis,
      monthlyTrend: Object.entries(monthlyTrend)
        .map(([month, data]) => ({
          month,
          count: data.count,
          avgCost: Math.round(data.cost / data.count),
          avgValue: Math.round(data.value / data.count),
          avgROI: Math.round(data.roi / data.count),
        }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      costBreakdown,
      qualityStats,
      topROI,
      worstROI,
      recommendations,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════
// BENCHMARKS
// ═══════════════════════════════════════════

export const getBenchmarks = async (req, res) => {
  try {
    const orgId = req.user.organization;
    const records = await MeetingROI.find({ organization: orgId }).lean();
    const enriched = records.map(enrichRecord);

    // Industry benchmarks (simulated)
    const industryBenchmarks = {
      avgCostPerMeeting: 500,
      avgROI: 25,
      avgCostPerDecision: 350,
      avgSatisfaction: 7.2,
      avgProductivity: 6.8,
      avgEngagement: 55,
      avgFollowThrough: 65,
      positiveROIPercentage: 60,
    };

    // Your stats
    const total = enriched.length;
    const yourStats = {
      avgCostPerMeeting: total > 0 ? Math.round(enriched.reduce((s, r) => s + r.totalCost, 0) / total) : 0,
      avgROI: total > 0 ? Math.round(enriched.reduce((s, r) => s + r.roiPercentage, 0) / total) : 0,
      avgCostPerDecision: 0,
      avgSatisfaction: total > 0 ? Math.round(enriched.reduce((s, r) => s + (r.participantSatisfaction || 0), 0) / total * 10) / 10 : 0,
      avgProductivity: total > 0 ? Math.round(enriched.reduce((s, r) => s + (r.productivityScore || 0), 0) / total * 10) / 10 : 0,
      avgEngagement: total > 0 ? Math.round(enriched.reduce((s, r) => s + (r.engagementScore || 0), 0) / total) : 0,
      avgFollowThrough: total > 0 ? Math.round(enriched.reduce((s, r) => s + (r.followThroughRate || 0), 0) / total * 10) / 10 : 0,
      positiveROIPercentage: total > 0 ? Math.round(enriched.filter((r) => r.roiPercentage > 0).length / total * 100) : 0,
    };

    const totalDecisions = enriched.reduce((s, r) => s + (r.decisions?.length || 0), 0);
    yourStats.avgCostPerDecision = totalDecisions > 0
      ? Math.round(enriched.reduce((s, r) => s + r.totalCost, 0) / totalDecisions)
      : 0;

    // Comparison
    const comparison = Object.keys(industryBenchmarks).map((key) => {
      const your = yourStats[key] || 0;
      const industry = industryBenchmarks[key];
      const diff = your - industry;
      const better = key === "avgCostPerMeeting" || key === "avgCostPerDecision"
        ? diff < 0
        : diff > 0;

      return {
        metric: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
        yourValue: your,
        industryValue: industry,
        difference: Math.abs(Math.round(diff)),
        better,
      };
    });

    res.json({ comparison, yourStats, industryBenchmarks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════
// WHAT-IF SIMULATOR
// ═══════════════════════════════════════════

export const simulateROI = async (req, res) => {
  try {
    const { participants, duration, hourlyRate, decisionsCount, avgDecisionValue, venueCost } = req.body;

    const laborCost = (participants || 5) * (duration || 60) / 60 * (hourlyRate || 50);
    const totalCost = laborCost + (venueCost || 0);
    const totalValue = (decisionsCount || 2) * (avgDecisionValue || 1000);
    const roi = totalCost > 0 ? Math.round(((totalValue - totalCost) / totalCost) * 100) : 0;

    // Simulate scenarios
    const scenarios = [];
    [3, 5, 8, 12].forEach((p) => {
      [30, 60, 90, 120].forEach((d) => {
        const cost = p * d / 60 * (hourlyRate || 50) + (venueCost || 0);
        const value = (decisionsCount || 2) * (avgDecisionValue || 1000);
        scenarios.push({
          participants: p,
          duration: d,
          cost: Math.round(cost),
          value: Math.round(value),
          roi: cost > 0 ? Math.round(((value - cost) / cost) * 100) : 0,
          costPerDecision: (decisionsCount || 2) > 0 ? Math.round(cost / (decisionsCount || 2)) : 0,
        });
      });
    });

    res.json({
      simulation: {
        participants: participants || 5,
        duration: duration || 60,
        hourlyRate: hourlyRate || 50,
        decisionsCount: decisionsCount || 2,
        avgDecisionValue: avgDecisionValue || 1000,
        totalCost: Math.round(totalCost),
        totalValue: Math.round(totalValue),
        roi,
        costPerDecision: (decisionsCount || 2) > 0 ? Math.round(totalCost / (decisionsCount || 2)) : 0,
      },
      scenarios: scenarios.sort((a, b) => b.roi - a.roi),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
