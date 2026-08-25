import api from "./api";

const BASE = "/api/meeting-roi";

export const getROIRecords = (params) =>
  api.get(BASE, { params }).then((r) => r.data);

export const getROIById = (id) =>
  api.get(`${BASE}/${id}`).then((r) => r.data);

export const createROIRecord = (data) =>
  api.post(BASE, data).then((r) => r.data);

export const updateROIRecord = (id, data) =>
  api.put(`${BASE}/${id}`, data).then((r) => r.data);

export const deleteROIRecord = (id) =>
  api.delete(`${BASE}/${id}`).then((r) => r.data);

export const getROIAnalytics = () =>
  api.get(`${BASE}/analytics`).then((r) => r.data);

export const getBenchmarks = () =>
  api.get(`${BASE}/benchmarks`).then((r) => r.data);

export const simulateROI = (data) =>
  api.post(`${BASE}/simulate`, data).then((r) => r.data);
