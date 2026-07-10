import axios from 'axios';
import { FuelDataInput, PredictionResult, APIResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const fuelAPI = {
  // Ingest data and get prediction
  predict: async (data: FuelDataInput): Promise<PredictionResult> => {
    const response = await api.post<APIResponse>('/api/v1/ingest', data);
    if (!response.data.prediction) {
      throw new Error(response.data.message || 'Prediction failed');
    }
    return response.data.prediction;
  },

  // Train models with stored data
  trainModels: async (): Promise<{ status: string; message: string }> => {
    const response = await api.post<APIResponse>('/api/v1/train');
    return {
      status: response.data.status,
      message: response.data.message || 'Training started',
    };
  },

  // Get health status
  healthCheck: async () => {
    const response = await api.get('/api/v1/health');
    return response.data;
  },

  // Export training data
  exportData: async () => {
    const response = await api.get('/api/v1/export');
    return response.data;
  },

  // Clear stored data
  clearData: async () => {
    const response = await api.delete('/api/v1/data');
    return response.data;
  },
};
