import { Request, Response } from "express";
import * as eventService from "../services/event.service";
import { AuthRequest } from "../middleware/auth.middleware";

export async function createEvent(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const { id: userId, role, college_id: userCollegeId } = authReq.user!;

    // If admin, force their own college_id
    if (role === "admin") {
      req.body.college_id = userCollegeId;
    }

    const event = await eventService.createEvent({
      ...req.body,
      created_by: userId
    });
    res.status(201).json({ event, message: "Event created successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create event";
    res.status(400).json({ error: message });
  }
}

export async function getAllEvents(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user;
    
    let { college_id, department_id, category, status, search, limit, offset } = req.query;

    // If admin, strictly filter by their own college_id
    if (user?.role === "admin") {
      college_id = user.college_id as string;
    }

    const result = await eventService.getAllEvents({
      college_id: college_id as string,
      department_id: department_id as string,
      category: category as string,
      status: status as string,
      search: search as string,
      limit: limit ? parseInt(limit as string, 10) : 10,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retrieve events";
    res.status(500).json({ error: message });
  }
}

export async function getEventById(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user;
    const { id: rawId } = req.params;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      res.status(400).json({ error: "Event ID is required" });
      return;
    }

    const event = await eventService.getEventById(id);
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    // Role check: admin can only see their own college's events
    if (user?.role === "admin" && event.college_id !== user.college_id) {
      res.status(403).json({ error: "Forbidden: Event belongs to another college" });
      return;
    }

    res.json({ event });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retrieve event";
    res.status(500).json({ error: message });
  }
}

export async function updateEvent(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const { role, college_id: userCollegeId } = authReq.user!;
    const { id: rawId } = req.params;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      res.status(400).json({ error: "Event ID is required" });
      return;
    }

    const existing = await eventService.getEventById(id);
    if (!existing) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    if (role === "admin" && existing.college_id !== userCollegeId) {
      res.status(403).json({ error: "Forbidden: Event belongs to another college" });
      return;
    }

    // Admins cannot change the college_id
    if (role === "admin") {
      delete req.body.college_id;
    }

    const event = await eventService.updateEvent(id, req.body);
    res.json({ event, message: "Event updated successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update event";
    res.status(400).json({ error: message });
  }
}

export async function deleteEvent(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const { role, college_id: userCollegeId } = authReq.user!;
    const { id: rawId } = req.params;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      res.status(400).json({ error: "Event ID is required" });
      return;
    }

    const existing = await eventService.getEventById(id);
    if (!existing) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    if (role === "admin" && existing.college_id !== userCollegeId) {
      res.status(403).json({ error: "Forbidden: Event belongs to another college" });
      return;
    }

    await eventService.deleteEvent(id);
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete event";
    res.status(500).json({ error: message });
  }
}
