import { Request, Response } from "express";
import * as campaignService from "../services/campaign.service";
import { AuthRequest } from "../middleware/auth.middleware";

export async function createCampaign(req: Request, res: Response): Promise<void> {
    try {
        const authReq = req as AuthRequest;
        const { id: userId } = authReq.user!;

        const campaign = await campaignService.createCampaign({
            ...req.body,
            created_by: userId,
            college_id: authReq.user!.college_id!,
        });
        res.status(201).json({ campaign, message: "Campaign created successfully" });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create campaign";
        res.status(400).json({ error: message });
    }
}

export async function getAllCampaigns(req: Request, res: Response): Promise<void> {
    try {
        const authReq = req as AuthRequest;
        const { id: userId, role } = authReq.user!;

        let { status, search, limit, offset } = req.query;

        const createdByFilter = role === "superadmin" ? undefined : userId;

        const result = await campaignService.getAllCampaigns({
            ...(createdByFilter ? { created_by: createdByFilter } : {}),
            college_id: authReq.user!.college_id || undefined,
            status: status as string,
            search: search as string,
            limit: limit ? parseInt(limit as string, 10) : 10,
            offset: offset ? parseInt(offset as string, 10) : 0,
        });
        res.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to retrieve campaigns";
        res.status(500).json({ error: message });
    }
}

export async function getCampaignById(req: Request, res: Response): Promise<void> {
    try {
        const authReq = req as AuthRequest;
        const { id: userId, role } = authReq.user!;
        const { id } = req.params;
        const campaignId = id as string;
        const campaign = await campaignService.getCampaignById(campaignId);
        if (!campaign) {
            res.status(404).json({ error: "Campaign not found" });
            return;
        }

        if (role !== "superadmin" && campaign.created_by !== userId) {
            res.status(403).json({ error: "Forbidden: Access denied" });
            return;
        }

        res.json({ campaign });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to retrieve campaign";
        res.status(500).json({ error: message });
    }
}

export async function updateCampaign(req: Request, res: Response): Promise<void> {
    try {
        const authReq = req as AuthRequest;
        const { id: userId, role } = authReq.user!;
        const { id } = req.params;
        const campaignId = id as string;
        const campaign = await campaignService.updateCampaign(campaignId, req.body);
        res.json({ campaign, message: "Campaign updated successfully" });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update campaign";
        res.status(400).json({ error: message });
    }
}

export async function deleteCampaign(req: Request, res: Response): Promise<void> {
    try {
        const authReq = req as AuthRequest;
        const { id: userId, role } = authReq.user!;
        const { id } = req.params;
        const campaignId = id as string;
        await campaignService.deleteCampaign(campaignId);
        res.json({ message: "Campaign deleted successfully" });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete campaign";
        res.status(500).json({ error: message });
    }
}

export async function triggerCampaign(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const { targetEmails } = req.body;

        const campaignId = id as string;
        const success = await campaignService.triggerCampaign(campaignId, { targetEmails });

        if (success) {
            res.json({ message: "Campaign triggered successfully" });
        } else {
            res.status(500).json({ error: "Failed to trigger campaign via message queue" });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to trigger campaign";
        res.status(400).json({ error: message });
    }
}

