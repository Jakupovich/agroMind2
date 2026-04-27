import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('safevision_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('safevision_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const register = (data: {
  email: string;
  password: string;
  full_name: string;
  organization_name?: string;
}) => api.post('/auth/register', data);

export const getMe = () => api.get('/auth/me');

// Dashboard
export const getDashboardStats = () => api.get('/analytics/dashboard');
export const getIncidentTrends = (days?: number) =>
  api.get('/analytics/trends', { params: { days } });
export const getZoneRisks = (locationId?: number) =>
  api.get('/analytics/zones', { params: { location_id: locationId } });
export const getHeatmapData = () => api.get('/analytics/heatmap');
export const getRiskPredictions = () => api.get('/analytics/risk-predictions');

// Incidents
export const getIncidents = (params?: Record<string, string | number>) =>
  api.get('/incidents', { params });
export const getIncidentStats = () => api.get('/incidents/stats');
export const getIncident = (id: number) => api.get(`/incidents/${id}`);
export const updateIncident = (id: number, data: Record<string, string>) =>
  api.patch(`/incidents/${id}`, data);

// Locations
export const getLocations = () => api.get('/locations');
export const createLocation = (data: Record<string, string>) =>
  api.post('/locations', data);

// Cameras
export const getCameras = (locationId: number) =>
  api.get(`/locations/${locationId}/cameras`);
export const createCamera = (locationId: number, data: Record<string, unknown>) =>
  api.post(`/locations/${locationId}/cameras`, data);

// Users
export const getUsers = () => api.get('/users');
export const createUser = (data: Record<string, unknown>) =>
  api.post('/users', data);

// Organization
export const getOrganization = () => api.get('/organizations/current');

// Billing
export const getPlans = () => api.get('/billing/plans');
export const getSubscription = () => api.get('/billing/subscription');
