import express, { Request, Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import dotenv from "dotenv";

dotenv.config();
import healthRouter from "./routes/health.route";
import { logger } from "./logger/logger";
import pool from "./config/db.config";

const app = express();

app.use(cors());
app.use(express.json()); 

 
// connect DB

app.get("/", async (req: Request, res: Response) => {
  const result = await pool.query("WHERE ");
  logger.info(`Database time: ${result.rows[0].now}`);
  res.send("hello world");
});

app.use("/api", healthRouter);

export default app;
