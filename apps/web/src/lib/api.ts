import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true,
});

// A small interceptor to handle automated token attaches if using headers instead of cookies
// But we use HttpOnly cookies in setup, so withCredentials: true is enough mostly.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Global handling of unauthorized if needed, like pushing to login
    }
    return Promise.reject(error);
  }
);
