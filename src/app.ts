import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import passport from "passport";
import { logger } from "./logger/logger";
import sql from "./config/db.config";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.routes";
import collegeRoutes from "./routes/college.routes";
import departmentRoutes from "./routes/department.routes";
import eventRoutes from "./routes/event.routes";
import registrationRoutes from "./routes/registration.routes";
import notificationRoutes from "./routes/notification.routes";
import healthRoutes from "./routes/health.route";
import "./config/passport.config";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.get("/", async (_req: Request, res: Response) => {
  try {
    const [row] = await sql`SELECT NOW() AS now`;
    logger.info({ now: row?.now }, "Database time");
    res.json({ message: "Event Automation API", now: row?.now });
  } catch (err) {
    logger.error({ err }, "Database check failed");
    res.status(503).json({ error: "Service unavailable" });
  }
});

app.get("/status", (_req: Request, res: Response) => {
  res.status(200).json({ status: "running", timestamp: new Date().toISOString() });
});

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/notifications", notificationRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

export default app;
