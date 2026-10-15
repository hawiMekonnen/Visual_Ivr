import axios from "axios";

// When accessed from mobile or remote browser, always use relative requests through Vite proxy
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes("localhost")) {
    return envUrl;
  }
  return ""; // Relative path /api/... through Vite dev proxy
};

const client = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to add JWT token to admin requests
client.interceptors.request.use(
  (config) => {
    if (config.baseURL && config.baseURL.includes("localhost")) {
      config.baseURL = "";
    }
    const token = localStorage.getItem("admin_token");
    if (token && config.url && config.url.includes("/api/admin")) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default client;
