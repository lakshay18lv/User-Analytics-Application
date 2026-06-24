(function () {
  const TRACKER_KEY = "causalfunnel_session_id";
  const COOKIE_NAME = "causalfunnel_session_id";
  const currentScript = document.currentScript;
  const explicitApiUrl = currentScript?.dataset?.apiUrl || window.__ANALYTICS_API_URL__ || "";
  const API_URL = explicitApiUrl || (currentScript?.src ? new URL(currentScript.src).origin : window.location.origin);

  function createSessionId() {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }

    return `session_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function getCookie(name) {
    return document.cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`))?.split("=")[1];
  }

  function setCookie(name, value) {
    document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 30}`;
  }

  function getSessionId() {
    const stored = localStorage.getItem(TRACKER_KEY) || getCookie(COOKIE_NAME);
    if (stored) {
      localStorage.setItem(TRACKER_KEY, stored);
      setCookie(COOKIE_NAME, stored);
      return stored;
    }

    const sessionId = createSessionId();
    localStorage.setItem(TRACKER_KEY, sessionId);
    setCookie(COOKIE_NAME, sessionId);
    return sessionId;
  }

  const sessionId = getSessionId();

  function sendEvent(payload) {
    const body = JSON.stringify(payload);
    const url = `${API_URL}/api/events`;

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(url, blob)) {
        return;
      }
    }

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body,
      keepalive: true
    }).catch(() => {});
  }

  function basePayload(eventType) {
    return {
      session_id: sessionId,
      event_type: eventType,
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      referrer: document.referrer || ""
    };
  }

  sendEvent(basePayload("page_view"));

  document.addEventListener(
    "click",
    (event) => {
      sendEvent({
        ...basePayload("click"),
        x: Math.round(event.clientX),
        y: Math.round(event.clientY)
      });
    },
    true
  );
})();
