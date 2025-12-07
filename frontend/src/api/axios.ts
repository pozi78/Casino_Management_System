import axios from 'axios';

// Use environment variable or default to port 9000 (Internal Docker Port if mapped, or localhost for local dev)
// Crucially, for remote deployment, VITE_API_URL should be set in docker-compose.
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:9000';

const api = axios.create({
    baseURL: `${baseURL}/api/v1`, // Append /api/v1
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            // Optional: Redirect to login or handle logout
        }
        return Promise.reject(error);
    }
);

export default api;
