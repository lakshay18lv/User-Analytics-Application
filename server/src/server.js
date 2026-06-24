import { createApp } from "./app.js";
import { connectDatabase } from "./db.js";
import { config } from "./config.js";

async function bootstrap() {
  await connectDatabase();

  const app = await createApp();
  app.listen(config.port, () => {
    console.log("MongoDB connected");
    console.log(`Server running on http://localhost:${config.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
