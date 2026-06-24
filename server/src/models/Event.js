import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: ["page_view", "click"],
      index: true,
    },
    pageUrl: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    x: {
      type: Number,
      default: null,
    },
    y: {
      type: Number,
      default: null,
    },
    userAgent: {
      type: String,
      default: "",
    },
    referrer: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

eventSchema.index({ sessionId: 1, timestamp: 1 });
eventSchema.index({ pageUrl: 1, eventType: 1, timestamp: 1 });

export const Event = mongoose.model("Event", eventSchema);
