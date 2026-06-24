import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { eventsRouter } from "./routes/events.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");
const clientIndexHtmlPath = path.join(rootDir, "client", "index.html");
const dashboardBuildPath = path.join(
  rootDir,
  "server",
  "public",
  "app",
  "index.html",
);

export async function createApp() {
  const app = express();

  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/events", eventsRouter);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: path.join(rootDir, "client"),
      appType: "custom",
      server: {
        middlewareMode: true,
      },
    });

    app.use(vite.middlewares);

    app.get("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api/")) {
        return next();
      }

      try {
        const template = fs.readFileSync(clientIndexHtmlPath, "utf-8");
        const html = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (error) {
        next(error);
      }
    });
  } else {
    app.use(
      express.static(path.join(__dirname, "../public"), { index: false }),
    );

    app.get("/", (_req, res) => {
      if (fs.existsSync(dashboardBuildPath)) {
        res.sendFile(dashboardBuildPath);
        return;
      }

      res.sendFile(path.join(__dirname, "../public/index.html"));
    });

    app.get("*", (req, res, next) => {
      if (req.originalUrl.startsWith("/api/")) {
        return next();
      }

      const buildIndex = path.join(
        rootDir,
        "server",
        "public",
        "app",
        "index.html",
      );
      if (fs.existsSync(buildIndex)) {
        res.sendFile(buildIndex);
        return;
      }

      next();
    });
  }

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
    });
  });

  return app;
}
