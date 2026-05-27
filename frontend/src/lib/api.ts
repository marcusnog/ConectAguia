import axios from "axios";

function buildBaseURL() {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  if (!raw) return "/api";
  const url = raw.startsWith("http") ? raw : `https://${raw}`;
  return `${url.replace(/\/$/, "")}/api`;
}

const baseURL = buildBaseURL();

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("manager");
      window.location.href = `${import.meta.env.BASE_URL}login`;
    }
    return Promise.reject(err);
  }
);
