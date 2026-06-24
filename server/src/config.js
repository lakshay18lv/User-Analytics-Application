import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/user_analytics",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:4000"
};
