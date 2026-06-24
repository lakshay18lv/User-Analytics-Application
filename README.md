# User Analytics Application

A simple full-stack analytics demo for tracking page views and clicks, storing them in MongoDB, and reviewing the data in a clean React dashboard.

## Tech Stack

- **Frontend:** React, Vite
- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose
- **Tracking:** Lightweight browser script served from the backend

## Project Structure

- `server/` — API, MongoDB models, and the tracking script
- `client/` — React dashboard
- `scripts/` — small helper scripts for local development

## Setup

1. Install dependencies from the project root:
   ```bash
   npm install
   ```

2. Start MongoDB locally.

3. Run the app:
   ```bash
   npm run dev
   ```

## How It Works

- The tracker script generates a session id and stores it in `localStorage` plus a cookie.
- It sends `page_view` and `click` events to the backend.
- The backend stores every event in MongoDB and exposes session and heatmap APIs.
- The dashboard reads those APIs and presents sessions, journeys, and click heatmaps.

## API Endpoints

- `POST /api/events` — receive an event
- `GET /api/sessions` — list sessions with event counts
- `GET /api/sessions/:sessionId/events` — ordered events for one session
- `GET /api/heatmap?pageUrl=...` — click positions for a page
- `GET /api/pages` — distinct tracked pages for the heatmap dropdown

## Assumptions / Trade-offs

- Events are stored in a single `events` collection for simpler querying.
- Sessions are derived from events at read time, which keeps writes fast and the schema small.
- Heatmap data is represented as click dots, which is enough for a hiring assignment without adding a heavier charting library.

## Demo Page

Open the demo page served by the backend to generate tracking data:

- `http://localhost:4000/demo.html`

The tracker script is available at:

- `http://localhost:4000/tracker.js`
