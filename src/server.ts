import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { logger } from "./logger/logger";

const PORT = Number(process.env.PORT) || 5001;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
