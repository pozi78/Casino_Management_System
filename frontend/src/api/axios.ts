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
        const status = error.response?.status;
        const detail = error.response?.data?.detail;

        // Auto-logout triggers
        const isAuthError =
            status === 401 ||
            (status === 403 && detail === "Could not validate credentials") ||
            (status === 400 && detail === "Inactive user") ||
            (status === 404 && detail === "User not found");

        if (isAuthError) {
            localStorage.removeItem('token');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
