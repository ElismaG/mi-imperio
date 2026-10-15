// apiUrl.js - Detecta automáticamente la URL del backend
export const getApiUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:5000";
    }

    return `${protocol}//${hostname}:5000`;
  }
  return "http://localhost:5000";
};

export const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${getApiUrl()}${path}`;
};
