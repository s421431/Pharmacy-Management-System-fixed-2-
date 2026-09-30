import axios from 'axios';
import authService from './authService';

const apiClient = axios.create({
    baseURL: 'http://localhost:5286'


});

// Interceptor to automatically add the JWT token to every request
apiClient.interceptors.request.use(
    (config) => {
        const user = authService.getCurrentUser();
        if (user?.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;