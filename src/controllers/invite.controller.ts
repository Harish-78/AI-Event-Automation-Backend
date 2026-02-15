import { Request, Response } from "express";
import * as inviteService from "../services/invite.service";

export async function createInvite(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const { role, college_id } = req.body;
    if (!role) {
      res.status(400).json({ error: "Role is required" });
      return;
    }
    const result = await inviteService.createInviteToken(
      req.user.id,
      role,
      college_id
    );
    res.status(201).json({
      invite: result.invite,
      inviteUrl: result.inviteUrl,
      message: "Invite created successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create invite";
    res.status(400).json({ error: message });
  }
}

export async function validateInvite(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.params;
    if (!token) {
      res.status(400).json({ error: "Token is required" });
      return;
    }
    const tokenStr = Array.isArray(token) ? token[0]! : token;
    const result = await inviteService.validateInviteToken(tokenStr);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid invite";
    res.status(400).json({ error: message });
  }
}

export async function getInvites(req: Request, res: Response): Promise<void> {
  try {
    const invites = await inviteService.getInviteTokens();
    res.json({ invites });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get invites";
    res.status(500).json({ error: message });
  }
}

export async function deleteInvite(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "Invite ID is required" });
      return;
    }
    const inviteId = Array.isArray(id) ? id[0]! : id;
    const deleted = await inviteService.deleteInviteToken(inviteId);
    if (!deleted) {
      res.status(404).json({ error: "Invite not found or already used" });
      return;
    }
    res.json({ message: "Invite deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete invite";
    res.status(500).json({ error: message });
  }
}
