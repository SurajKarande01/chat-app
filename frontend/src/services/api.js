import axios from 'axios';

// The base context URL pointing to our Spring Boot rest endpoints
const API_URL = 'http://localhost:8080/api';

// Create a configured axios client instance
const api = axios.create({
  baseURL: API_URL,
});

// Axios request interceptor.
// Automatically reads the user's JWT authorization token from browser local storage
// and injects it as a Bearer token header in all outbound HTTP requests.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Forward request setup level errors
    return Promise.reject(error);
  }
);

export default api;
