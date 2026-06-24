import React, { useEffect, useMemo, useState } from "react";
import { getHeatmap, getPages, getSessionEvents, getSessions } from "./api";

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function SessionCard({ session, selected, onSelect }) {
  return (
    <button type="button" className={`session-card ${selected ? "selected" : ""}`} onClick={() => onSelect(session.sessionId)}>
      <div>
        <strong>{session.sessionId.slice(0, 8)}</strong>
        <span>{session.eventCount} events</span>
      </div>
      <small>{formatDate(session.lastEventAt)}</small>
    </button>
  );
}

function JourneyPanel({ loading, events, sessionId }) {
  if (!sessionId) {
    return <div className="empty-state">Select a session to view the user journey.</div>;
  }

  if (loading) {
    return <div className="empty-state">Loading session events...</div>;
  }

  if (events.length === 0) {
    return <div className="empty-state">This session has no tracked events yet.</div>;
  }

  return (
    <div className="journey-list">
      {events.map((event, index) => (
        <article className="journey-item" key={`${event._id || index}-${event.timestamp}`}>
          <div className="journey-index">{index + 1}</div>
          <div className="journey-content">
            <div className="journey-meta">
              <strong>{event.eventType}</strong>
              <span>{formatDate(event.timestamp)}</span>
            </div>
            <p>{event.pageUrl}</p>
            {event.eventType === "click" ? (
              <small>
                Click position: {event.x}, {event.y}
              </small>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function HeatmapCanvas({ clicks }) {
  return (
    <div className="heatmap-canvas">
      {clicks.length === 0 ? <div className="heatmap-empty">No clicks recorded for this page yet.</div> : null}
      {clicks.map((click, index) => (
        <span
          key={`${click._id || index}-${click.timestamp}`}
          className="heat-dot"
          style={{
            left: `${Math.min(Math.max(click.x / 12, 2), 98)}%`,
            top: `${Math.min(Math.max(click.y / 8, 2), 94)}%`
          }}
        />
      ))}
    </div>
  );
}

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [pages, setPages] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedPage, setSelectedPage] = useState("");
  const [events, setEvents] = useState([]);
  const [clicks, setClicks] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingJourney, setLoadingJourney] = useState(false);
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);
  const [activeView, setActiveView] = useState("sessions");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getSessions(), getPages()])
      .then(([sessionsResponse, pagesResponse]) => {
        const sessionList = sessionsResponse.sessions || [];
        const pageList = pagesResponse.pages || [];
        setSessions(sessionList);
        setPages(pageList);

        if (sessionList.length > 0) {
          setSelectedSession(sessionList[0].sessionId);
        }
        if (pageList.length > 0) {
          setSelectedPage(pageList[0].pageUrl);
        }
      })
      .catch(() => setError("We could not load analytics data right now."))
      .finally(() => setLoadingSessions(false));
  }, []);

  useEffect(() => {
    if (!selectedSession) return;
    setLoadingJourney(true);
    getSessionEvents(selectedSession)
      .then((response) => {
        setEvents(response.events || []);
      })
      .catch(() => setError("Failed to load session journey."))
      .finally(() => setLoadingJourney(false));
  }, [selectedSession]);

  useEffect(() => {
    if (!selectedPage) return;
    setLoadingHeatmap(true);
    getHeatmap(selectedPage)
      .then((response) => {
        setClicks(response.clicks || []);
      })
      .catch(() => setError("Failed to load heatmap data."))
      .finally(() => setLoadingHeatmap(false));
  }, [selectedPage]);

  const totalEvents = useMemo(
    () => sessions.reduce((sum, session) => sum + session.eventCount, 0),
    [sessions]
  );

  const totalSessions = sessions.length;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <span className="brand">CausalFunnel</span>
          <h1>User Analytics</h1>
          <p>Track sessions, inspect journeys, and view click activity on a simple heatmap.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <strong>{totalSessions}</strong>
            <span>Sessions</span>
          </div>
          <div className="stat-card">
            <strong>{totalEvents}</strong>
            <span>Events</span>
          </div>
        </div>

        <nav className="view-switcher">
          <button type="button" className={activeView === "sessions" ? "active" : ""} onClick={() => setActiveView("sessions")}>
            Sessions View
          </button>
          <button type="button" className={activeView === "heatmap" ? "active" : ""} onClick={() => setActiveView("heatmap")}>
            Heatmap View
          </button>
        </nav>

        <div className="panel">
          <div className="panel-header">
            <h2>Sessions</h2>
            {loadingSessions ? <span className="muted">Loading…</span> : <span className="muted">{sessions.length} total</span>}
          </div>

          <div className="session-list">
            {sessions.map((session) => (
              <SessionCard
                key={session.sessionId}
                session={session}
                selected={selectedSession === session.sessionId}
                onSelect={setSelectedSession}
              />
            ))}
            {!loadingSessions && sessions.length === 0 ? <div className="empty-state">No sessions yet. Open the demo page to create one.</div> : null}
          </div>
        </div>
      </aside>

      <main className="content">
        {error ? <div className="error-banner">{error}</div> : null}

        {activeView === "sessions" ? (
          <section className="panel">
            <div className="panel-header">
              <div>
                <span className="section-label">Session journey</span>
                <h2>Ordered events</h2>
              </div>
              <span className="muted">{selectedSession ? selectedSession : "No session selected"}</span>
            </div>
            <JourneyPanel loading={loadingJourney} events={events} sessionId={selectedSession} />
          </section>
        ) : null}

        {activeView === "heatmap" ? (
          <section className="panel">
            <div className="panel-header">
              <div>
                <span className="section-label">Heatmap</span>
                <h2>Page clicks</h2>
              </div>
              <select value={selectedPage} onChange={(event) => setSelectedPage(event.target.value)}>
                {pages.map((page) => (
                  <option key={page.pageUrl} value={page.pageUrl}>
                    {page.pageUrl}
                  </option>
                ))}
              </select>
            </div>

            <div className="heatmap-wrap">
              {pages.length === 0 ? (
                <div className="empty-state">No tracked pages yet. Visit the demo page to generate click data.</div>
              ) : loadingHeatmap ? (
                <div className="empty-state">Loading heatmap...</div>
              ) : (
                <HeatmapCanvas clicks={clicks} />
              )}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
