import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    // If token is invalid/expired, redirect to login.
    if (status === 401) {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } catch (_) {}

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;

