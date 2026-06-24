const API_BASE = import.meta.env.VITE_API_URL || "";

async function request(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

export function getSessions() {
  return request("/api/events/sessions");
}

export function getSessionEvents(sessionId) {
  return request(`/api/events/sessions/${encodeURIComponent(sessionId)}/events`);
}

export function getPages() {
  return request("/api/events/pages");
}

export function getHeatmap(pageUrl) {
  return request(`/api/events/heatmap?pageUrl=${encodeURIComponent(pageUrl)}`);
}
