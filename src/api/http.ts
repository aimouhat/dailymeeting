import axios from 'axios';

const API_URL = `https://mexico-dame-baptist-geology.trycloudflare.com/api`;

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    if (!config.headers) config.headers = {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api; 