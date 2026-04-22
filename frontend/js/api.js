import { API_BASE, STORAGE_KEY } from "./config.js";

const getStoredAuth = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch (error) {
    return null;
  }
};

const setStoredAuth = (payload) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

const clearStoredAuth = () => {
  localStorage.removeItem(STORAGE_KEY);
};

const request = async (endpoint, options = {}) => {
  const auth = getStoredAuth();
  const isForm = options.body instanceof FormData;
  const headers = {
    Accept: "application/json",
    ...(options.headers || {})
  };

  if (!isForm) {
    headers["Content-Type"] = "application/json";
  }

  if (auth?.token) {
    headers.Authorization = `Bearer ${auth.token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: options.method || "GET",
    headers,
    body: isForm ? options.body : options.body ? JSON.stringify(options.body) : undefined
  });

  let payload = {};

  try {
    payload = await response.json();
  } catch (error) {
    payload = {};
  }

  if (!response.ok) {
    const validationMessage = payload.errors?.[0]?.message;
    throw new Error(validationMessage || payload.message || "Request failed.");
  }

  return payload;
};

const api = {
  getStoredAuth,
  setStoredAuth,
  clearStoredAuth,
  register: (formData) => request("/auth/register", { method: "POST", body: formData }),
  login: (credentials) => request("/auth/login", { method: "POST", body: credentials }),
  logout: () => request("/auth/logout", { method: "POST" }),
  getMe: () => request("/auth/me"),
  getCommunityUsers: () => request("/auth/community"),
  updateProfile: (formData) => request("/auth/profile", { method: "PUT", body: formData }),
  getAlbums: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/albums${query ? `?${query}` : ""}`);
  },
  createAlbum: (payload) => request("/albums", { method: "POST", body: payload }),
  getAlbum: (albumId) => request(`/albums/${albumId}`),
  deleteAlbum: (albumId) => request(`/albums/${albumId}`, { method: "DELETE" }),
  getImages: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/images${query ? `?${query}` : ""}`);
  },
  uploadImage: (formData) => request("/images", { method: "POST", body: formData }),
  deleteImage: (imageId) => request(`/images/${imageId}`, { method: "DELETE" }),
  addComment: (payload) => request("/comments", { method: "POST", body: payload }),
  getNotifications: () => request("/notifications"),
  markNotificationsRead: () => request("/notifications/read-all", { method: "PUT" }),
  deleteNotification: (notificationId) => request(`/notifications/${notificationId}`, { method: "DELETE" }),
  toggleReaction: (payload) => request("/reactions/toggle", { method: "POST", body: payload })
};

export default api;
