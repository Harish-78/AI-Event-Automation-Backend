import { Request, Response } from "express";
import * as registrationService from "../services/registration.service";
import { AuthRequest } from "../middleware/auth.middleware";

export async function registerForEvent(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;
    const { event_id } = req.body;

    if (!event_id) {
      res.status(400).json({ error: "Event ID is required" });
      return;
    }

    const registration = await registrationService.createRegistration({ event_id, user_id: userId });
    res.status(201).json({ registration, message: "Successfully registered for event" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to register for event";
    if (message.includes("unique constraint")) {
      res.status(400).json({ error: "You are already registered for this event" });
      return;
    }
    res.status(500).json({ error: message });
  }
}

export async function getMyRegistrations(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;
    const registrations = await registrationService.getUserRegistrations(userId);
    res.json({ registrations });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retrieve registrations";
    res.status(500).json({ error: message });
  }
}

export async function getEventRegistrations(req: Request, res: Response): Promise<void> {
  try {
    const { event_id: rawId } = req.params;
    const event_id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!event_id) {
      res.status(400).json({ error: "Event ID is required" });
      return;
    }

    const registrations = await registrationService.getEventRegistrations(event_id);
    res.json({ registrations });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retrieve event registrations";
    res.status(500).json({ error: message });
  }
}

export async function cancelMyRegistration(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;
    const { id: rawId } = req.params;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      res.status(400).json({ error: "Registration ID is required" });
      return;
    }

    const cancelled = await registrationService.cancelRegistration(id, userId);
    if (!cancelled) {
      res.status(404).json({ error: "Registration not found or already cancelled" });
      return;
    }
    res.json({ message: "Registration cancelled successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to cancel registration";
    res.status(500).json({ error: message });
  }
}
