import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import dotenv from "dotenv";

dotenv.config();
import "./config/passport.config";
import healthRouter from "./routes/health.route";
import authRouter from "./routes/auth.route";
import { logger } from "./logger/logger";
import pool from "./config/db.config";
import passport from "passport";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(pinoHttp({ logger }));

app.get("/", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT NOW() AS now");
    logger.info({ now: result.rows[0]?.now }, "Database time");
    res.json({ message: "Event Automation API", now: result.rows[0]?.now });
  } catch (err) {
    logger.error({ err }, "Database check failed");
    res.status(503).json({ error: "Service unavailable" });
  }
});

app.use("/api", healthRouter);
app.use("/api/auth", authRouter);

export default app;
