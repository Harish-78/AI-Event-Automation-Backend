import type { Request, Response } from "express";

export const healthCheck = (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "API is healthy ✅",
  });
};
