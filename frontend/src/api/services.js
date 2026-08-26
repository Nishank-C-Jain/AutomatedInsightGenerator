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
