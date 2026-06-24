import { Router } from "express";
import { Event } from "../models/Event.js";

export const eventsRouter = Router();

function normalizeEvent(payload) {
  const eventType = payload.event_type || payload.eventType;
  const pageUrl = payload.page_url || payload.pageUrl;
  const sessionId = payload.session_id || payload.sessionId;

  return {
    sessionId,
    eventType,
    pageUrl,
    timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
    x: payload.x ?? null,
    y: payload.y ?? null,
    userAgent: payload.user_agent || payload.userAgent || "",
    referrer: payload.referrer || ""
  };
}

eventsRouter.post("/", async (req, res, next) => {
  try {
    const event = normalizeEvent(req.body || {});

    if (!event.sessionId || !event.eventType || !event.pageUrl || Number.isNaN(event.timestamp.getTime())) {
      return res.status(400).json({
        message: "session_id, event_type, page_url, and a valid timestamp are required"
      });
    }

    const savedEvent = await Event.create(event);
    return res.status(201).json({ event: savedEvent });
  } catch (error) {
    next(error);
  }
});

eventsRouter.get("/sessions", async (_req, res, next) => {
  try {
    const sessions = await Event.aggregate([
      {
        $group: {
          _id: "$sessionId",
          eventCount: { $sum: 1 },
          firstEventAt: { $min: "$timestamp" },
          lastEventAt: { $max: "$timestamp" }
        }
      },
      {
        $sort: { lastEventAt: -1 }
      },
      {
        $project: {
          _id: 0,
          sessionId: "$_id",
          eventCount: 1,
          firstEventAt: 1,
          lastEventAt: 1
        }
      }
    ]);

    res.json({ sessions });
  } catch (error) {
    next(error);
  }
});

eventsRouter.get("/sessions/:sessionId/events", async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const events = await Event.find({ sessionId }).sort({ timestamp: 1 }).lean();
    res.json({ sessionId, events });
  } catch (error) {
    next(error);
  }
});

eventsRouter.get("/heatmap", async (req, res, next) => {
  try {
    const { pageUrl } = req.query;
    if (!pageUrl) {
      return res.status(400).json({ message: "pageUrl query parameter is required" });
    }

    const clicks = await Event.find({
      pageUrl,
      eventType: "click",
      x: { $ne: null },
      y: { $ne: null }
    })
      .sort({ timestamp: 1 })
      .lean();

    res.json({ pageUrl, clicks });
  } catch (error) {
    next(error);
  }
});

eventsRouter.get("/pages", async (_req, res, next) => {
  try {
    const pages = await Event.aggregate([
      {
        $group: {
          _id: "$pageUrl",
          clickCount: {
            $sum: {
              $cond: [{ $eq: ["$eventType", "click"] }, 1, 0]
            }
          },
          eventCount: { $sum: 1 }
        }
      },
      {
        $sort: { eventCount: -1, _id: 1 }
      },
      {
        $project: {
          _id: 0,
          pageUrl: "$_id",
          clickCount: 1,
          eventCount: 1
        }
      }
    ]);

    res.json({ pages });
  } catch (error) {
    next(error);
  }
});
