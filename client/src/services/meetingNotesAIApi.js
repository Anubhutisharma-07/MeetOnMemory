import api from "./api";

const BASE = "/api/notes-ai";

// Notes CRUD
export const getNotes = (params) =>
  api.get(BASE, { params }).then((r) => r.data);

export const getNoteById = (id) =>
  api.get(`${BASE}/${id}`).then((r) => r.data);

export const createNotes = (data) =>
  api.post(BASE, data).then((r) => r.data);

export const updateNotes = (id, data) =>
  api.put(`${BASE}/${id}`, data).then((r) => r.data);

export const deleteNotes = (id) =>
  api.delete(`${BASE}/${id}`).then((r) => r.data);

// AI Generation
export const generateNotes = (data) =>
  api.post(`${BASE}/generate`, data).then((r) => r.data);

// Action Items
export const getActionItems = (params) =>
  api.get(`${BASE}/action-items`, { params }).then((r) => r.data);

export const addActionItem = (noteId, data) =>
  api.post(`${BASE}/${noteId}/action-items`, data).then((r) => r.data);

export const updateActionItem = (noteId, itemId, data) =>
  api.put(`${BASE}/${noteId}/action-items/${itemId}`, data).then((r) => r.data);

export const deleteActionItem = (noteId, itemId) =>
  api.delete(`${BASE}/${noteId}/action-items/${itemId}`).then((r) => r.data);

// Review & Export
export const reviewNotes = (id, data) =>
  api.post(`${BASE}/${id}/review`, data).then((r) => r.data);

export const exportNotes = (id, format) =>
  api.get(`${BASE}/${id}/export`, { params: { format } }).then((r) => r.data);

export const getVersionHistory = (id) =>
  api.get(`${BASE}/${id}/versions`).then((r) => r.data);

// Templates
export const getTemplates = () =>
  api.get(`${BASE}/templates`).then((r) => r.data);

export const createTemplate = (data) =>
  api.post(`${BASE}/templates`, data).then((r) => r.data);

export const deleteTemplate = (id) =>
  api.delete(`${BASE}/templates/${id}`).then((r) => r.data);

// Analytics
export const getNotesAnalytics = () =>
  api.get(`${BASE}/analytics`).then((r) => r.data);
