import { Request, Response } from "express";
import * as registrationService from "../services/registration.service";

export async function registerForEvent(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const { eventId } = req.params;
    if (!eventId) {
      res.status(400).json({ error: "Event ID is required" });
      return;
    }
    const id = Array.isArray(eventId) ? eventId[0]! : eventId;
    const registration = await registrationService.registerForEvent(id, req.user.id);
    res.status(201).json({ registration, message: "Registered successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    res.status(400).json({ error: message });
  }
}

export async function cancelRegistration(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const { eventId } = req.params;
    if (!eventId) {
      res.status(400).json({ error: "Event ID is required" });
      return;
    }
    const id = Array.isArray(eventId) ? eventId[0]! : eventId;
    const registration = await registrationService.cancelRegistration(id, req.user.id);
    res.json({ registration, message: "Registration cancelled" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cancel failed";
    res.status(400).json({ error: message });
  }
}

export async function getEventRegistrations(req: Request, res: Response): Promise<void> {
  try {
    const { eventId } = req.params;
    if (!eventId) {
      res.status(400).json({ error: "Event ID is required" });
      return;
    }
    const id = Array.isArray(eventId) ? eventId[0]! : eventId;
    const result = await registrationService.getEventRegistrations(id);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get registrations";
    res.status(500).json({ error: message });
  }
}

export async function getMyRegistrations(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const registrations = await registrationService.getUserRegistrations(req.user.id);
    res.json({ registrations });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get registrations";
    res.status(500).json({ error: message });
  }
}

export async function checkRegistration(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const { eventId } = req.params;
    if (!eventId) {
      res.status(400).json({ error: "Event ID is required" });
      return;
    }
    const id = Array.isArray(eventId) ? eventId[0]! : eventId;
    const registration = await registrationService.checkUserRegistration(id, req.user.id);
    res.json({ registered: !!registration, registration });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Check failed";
    res.status(500).json({ error: message });
  }
}
