import api from "./api";

const BASE = "/api/smart-scheduler";

// Preferences
export const getMyPreferences = () =>
  api.get(`${BASE}/preferences`).then((r) => r.data);

export const updatePreferences = (data) =>
  api.put(`${BASE}/preferences`, data).then((r) => r.data);

// Meetings
export const getScheduledMeetings = (params) =>
  api.get(`${BASE}/meetings`, { params }).then((r) => r.data);

export const createMeeting = (data) =>
  api.post(`${BASE}/meetings`, data).then((r) => r.data);

export const updateMeeting = (id, data) =>
  api.put(`${BASE}/meetings/${id}`, data).then((r) => r.data);

export const deleteMeeting = (id) =>
  api.delete(`${BASE}/meetings/${id}`).then((r) => r.data);

// Conflicts
export const detectConflicts = (params) =>
  api.get(`${BASE}/conflicts/detect`, { params }).then((r) => r.data);

export const getConflicts = () =>
  api.get(`${BASE}/conflicts`).then((r) => r.data);

export const resolveConflict = (conflictId, data) =>
  api.put(`${BASE}/conflicts/${conflictId}/resolve`, data).then((r) => r.data);

// Smart scheduling
export const smartSchedule = (data) =>
  api.post(`${BASE}/smart-schedule`, data).then((r) => r.data);

export const findAlternativeSlots = (params) =>
  api.get(`${BASE}/alternative-slots`, { params }).then((r) => r.data);

// Team availability
export const getTeamAvailability = (params) =>
  api.get(`${BASE}/team-availability`, { params }).then((r) => r.data);

// Analytics
export const getSchedulingAnalytics = () =>
  api.get(`${BASE}/analytics`).then((r) => r.data);

export const getRecommendations = () =>
  api.get(`${BASE}/recommendations`).then((r) => r.data);
