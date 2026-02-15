import { Request, Response } from "express";
import * as eventService from "../services/event.service";

export async function createEvent(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
<<<<<<< HEAD
    const data = { ...req.body, created_by: req.user.id };
    // Admin: force their own college_id
    if (req.user.role === "admin" && req.user.college_id) {
      data.college_id = req.user.college_id;
    }
    // SuperAdmin: must provide college_id in body
    if (!data.college_id) {
      res.status(400).json({ error: "college_id is required. Please select a college." });
      return;
    }
    const event = await eventService.createEvent(data);
=======
    const event = await eventService.createEvent({
      ...req.body,
      created_by: req.user.id
    });
>>>>>>> origin/main
    res.status(201).json({ event, message: "Event created successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create event";
    res.status(400).json({ error: message });
  }
}

export async function getAllEvents(req: Request, res: Response): Promise<void> {
  try {
    const { college_id, department_id, category, status, search, limit, offset } = req.query;
<<<<<<< HEAD
    
    // Admin can only see events from their college
    let filterCollegeId = college_id as string;
    if (req.user && req.user.role === "admin" && req.user.college_id) {
      filterCollegeId = req.user.college_id;
    }
    
    const result = await eventService.getAllEvents({
      college_id: filterCollegeId,
=======
    const result = await eventService.getAllEvents({
      college_id: college_id as string,
>>>>>>> origin/main
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
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "Event ID is required" });
      return;
    }
    const eventId = Array.isArray(id) ? id[0] : id;
    const event = await eventService.getEventById(eventId!);
    if (!event) {
      res.status(404).json({ error: "Event not found" });
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
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "Event ID is required" });
      return;
    }
    const eventId = Array.isArray(id) ? id[0] : id;
<<<<<<< HEAD
    
    // Admin can only update events in their college
    if (req.user && req.user.role === "admin" && req.user.college_id) {
      const existing = await eventService.getEventById(eventId!);
      if (existing && existing.college_id !== req.user.college_id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
    }
    
=======
>>>>>>> origin/main
    const event = await eventService.updateEvent(eventId!, req.body);
    if (!event) {
      res.status(404).json({ error: "Event not found or no updates provided" });
      return;
    }
    res.json({ event, message: "Event updated successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update event";
    res.status(400).json({ error: message });
  }
}

export async function deleteEvent(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "Event ID is required" });
      return;
    }
    const eventId = Array.isArray(id) ? id[0] : id;
<<<<<<< HEAD
    
    // Admin can only delete events in their college
    if (req.user && req.user.role === "admin" && req.user.college_id) {
      const existing = await eventService.getEventById(eventId!);
      if (existing && existing.college_id !== req.user.college_id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
    }
    
=======
>>>>>>> origin/main
    const deleted = await eventService.deleteEvent(eventId!);
    if (!deleted) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete event";
    res.status(500).json({ error: message });
  }
}
