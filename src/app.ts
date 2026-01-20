import express, { Request, Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";

import healthRouter from "./routes/health.route";
import { logger } from "./logger/logger";

const app = express();

app.use(cors());
app.use(express.json());

app.use(
  pinoHttp({
    logger,
  }),
);

app.get("/", (req: Request, res: Response) => {
  req.log.info("something");
  res.send("hello world");
});

app.use("/api", healthRouter);

export default app;
