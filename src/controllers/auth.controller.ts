import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { setTokenCookie, clearTokenCookie } from "../config/cookie.config";

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }
    const result = await authService.register(
      email.trim(),
      password,
      (name || "").trim()
    );
    res.status(201).json({
      user: result.user,
      message: result.message,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed";
    const status =
      message === "Email already registered" ? 409 : 400;
    res.status(status).json({ error: message });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    const result = await authService.login(email.trim(), password);
    setTokenCookie(res, result.accessToken);
    res.json({ user: result.user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    res.status(401).json({ error: message });
  }
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  try {
    const token = (req.query.token as string) || req.body?.token;
    if (!token) {
      res.status(400).json({ error: "Verification token is required" });
      return;
    }
    const result = await authService.verifyEmail(token);
    setTokenCookie(res, result.accessToken);
    res.json({ user: result.user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    res.status(400).json({ error: message });
  }
}

export async function resendVerification(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }
    const result = await authService.resendVerificationEmail(email.trim());
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Resend failed";
    res.status(400).json({ error: message });
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ user: req.user });
}

export function googleCallback(req: Request, res: Response): void {
  const user = req.user;
  if (!user) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/login?error=google_failed`);
    return;
  }
  const accessToken = authService.createTokenForUser(user);
  setTokenCookie(res, accessToken);
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  res.redirect(`${frontendUrl}/auth/callback`);
}

export function logout(_req: Request, res: Response): void {
  clearTokenCookie(res);
  res.status(204).send();
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }
    const result = await authService.requestPasswordReset(email.trim());
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Forgot password request failed";
    res.status(400).json({ error: message });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(400).json({ error: "Token and password are required" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }
    const result = await authService.resetPassword(token, password);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Password reset failed";
    res.status(400).json({ error: message });
  }
}
export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Current and new passwords are required" });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: "New password must be at least 8 characters" });
      return;
    }
    const result = await authService.changePassword(userId, currentPassword, newPassword);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Password change failed";
    res.status(400).json({ error: message });
  }
}
