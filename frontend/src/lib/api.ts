import axios from "axios";

function buildBaseURL() {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  if (!raw) return "/api";
  const url = raw.startsWith("http") ? raw : `https://${raw}`;
  return `${url.replace(/\/$/, "")}/api`;
}

const baseURL = buildBaseURL();

export const api = axios.create({
  baseURL,
  withCredentials: true, // envia httpOnly cookie em todas as requisições
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("manager");
      window.location.href = `${import.meta.env.BASE_URL}login`;
    }
    return Promise.reject(err);
  }
);
