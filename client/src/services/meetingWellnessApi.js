import apiClient from "./apiClient.js";

const meetingWellnessApi = {
  getWellnessOverview: (organizationId) =>
    apiClient.get("/api/meeting-wellness/overview", { params: { organizationId } }),

  getBurnoutRisk: (userId) =>
    apiClient.get("/api/meeting-wellness/burnout-risk", { params: { userId } }),

  getFocusTimeStats: (organizationId) =>
    apiClient.get("/api/meeting-wellness/focus-time-stats", { params: { organizationId } }),

  getRecoveryWindows: (organizationId) =>
    apiClient.get("/api/meeting-wellness/recovery-windows", { params: { organizationId } }),

  getTeamWellness: (organizationId) =>
    apiClient.get("/api/meeting-wellness/team", { params: { organizationId } }),

  updatePreferences: (data) =>
    apiClient.put("/api/meeting-wellness/preferences", data),

  getPreferences: () =>
    apiClient.get("/api/meeting-wellness/preferences"),
};

export default meetingWellnessApi;
