import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../logger/logger";
import { getUserById } from "../services/auth.service";
import type { JwtPayload } from "../types/auth.types";
import type { User } from "../types/auth.types";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

export interface AuthRequest extends Request {
  user?: User;
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token =
    req.cookies?.token ??
    (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user = await getUserById(decoded.sub);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    (req as AuthRequest).user = user;
    next();
  } catch (err) {
    logger.debug({ err }, "JWT verification failed");
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (roles.length > 0 && !roles.includes(authReq.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}
