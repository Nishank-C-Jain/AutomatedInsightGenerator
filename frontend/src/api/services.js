import apiClient from './apiClient.js';

export const fetchDashboardStats = async () => {
    const response = await apiClient.get('/dashboard');
    return response.data;
};

export const fetchDatasets = async () => {
    const response = await apiClient.get('/datasets');
    return response.data;
};

/** Fetch a single dataset row (name, status, file_size, etc.) — no analysis. */
export const fetchDatasetInfo = async (id) => {
    const response = await apiClient.get(`/datasets/${id}`);
    return response.data;
};

/**
 * Fetch cached analysis result from DB.
 * Returns { success, status, dataset_id, analysis } or { success, status, analysis: null }
 */
export const fetchAnalysis = async (datasetId) => {
    const response = await apiClient.get(`/analytics/${datasetId}`);
    return response.data;
};

/**
 * Trigger the full analysis pipeline (Node → Python → PostgreSQL).
 * Can take up to 2 minutes; returns { success, dataset_id, analysis }.
 */
export const runAnalysis = async (datasetId) => {
    const response = await apiClient.post(`/analytics/${datasetId}/run`);
    return response.data;
};

export const uploadDataset = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/datasets/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

/**
 * Dataset-specific AI Chat services
 */
export const sendChatMessage = async (datasetId, question, sessionId = null) => {
    const response = await apiClient.post(`/chat/${datasetId}`, {
        question,
        session_id: sessionId || undefined,
    });
    return response.data;
};

export const fetchChatSessions = async (datasetId) => {
    const response = await apiClient.get(`/chat/${datasetId}/sessions`);
    return response.data;
};

export const fetchChatHistory = async (datasetId, sessionId = null) => {
    const params = sessionId ? { session_id: sessionId } : {};
    const response = await apiClient.get(`/chat/${datasetId}/history`, { params });
    return response.data;
};

export const clearChatHistory = async (datasetId, sessionId = null) => {
    const params = sessionId ? { session_id: sessionId } : {};
    const response = await apiClient.delete(`/chat/${datasetId}/history`, { params });
    return response.data;
};

/**
 * Fetch a preview of the raw dataset rows + column metadata.
 * Returns { success, total_rows, total_cols, columns, rows, dataset_name }
 */
export const fetchDatasetPreview = async (datasetId, limit = 50) => {
    const response = await apiClient.get(`/datasets/${datasetId}/preview`, { params: { limit } });
    return response.data;
};
