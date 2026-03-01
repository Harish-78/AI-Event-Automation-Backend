import { Request, Response } from "express";
import * as templateService from "../services/email-template.service";
import { AuthRequest } from "../middleware/auth.middleware";

export async function createTemplate(req: Request, res: Response): Promise<void> {
    try {
        const authReq = req as AuthRequest;
        const { id: userId } = authReq.user!;

        const template = await templateService.createTemplate({
            ...req.body,
            created_by: userId,
            college_id: authReq.user!.college_id!,
        });
        res.status(201).json({ template, message: "Email template created successfully" });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create template";
        res.status(400).json({ error: message });
    }
}

export async function getAllTemplates(req: Request, res: Response): Promise<void> {
    try {
        const authReq = req as AuthRequest;
        const { id: userId, role } = authReq.user!;

        let { search, limit, offset } = req.query;

        // Users can only see their own templates unless they are superadmin
        const createdByFilter = role === "superadmin" ? undefined : userId;

        const result = await templateService.getAllTemplates({
            ...(createdByFilter ? { created_by: createdByFilter } : {}),
            college_id: authReq.user!.college_id || undefined,
            search: search as string,
            limit: limit ? parseInt(limit as string, 10) : 10,
            offset: offset ? parseInt(offset as string, 10) : 0,
        });
        res.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to retrieve templates";
        res.status(500).json({ error: message });
    }
}

export async function getTemplateById(req: Request, res: Response): Promise<void> {
    try {
        const authReq = req as AuthRequest;
        const { id: userId, role } = authReq.user!;
        const { id } = req.params;
        const templateId = id as string;
        const template = await templateService.getTemplateById(templateId);
        if (!template) {
            res.status(404).json({ error: "Template not found" });
            return;
        }

        if (role !== "superadmin" && template.created_by !== userId) {
            res.status(403).json({ error: "Forbidden: Access denied" });
            return;
        }

        res.json({ template });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to retrieve template";
        res.status(500).json({ error: message });
    }
}

export async function updateTemplate(req: Request, res: Response): Promise<void> {
    try {
        const authReq = req as AuthRequest;
        const { id: userId, role } = authReq.user!;
        const { id } = req.params;
        const templateId = id as string;
        const template = await templateService.updateTemplate(templateId, req.body);
        res.json({ template, message: "Template updated successfully" });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update template";
        res.status(400).json({ error: message });
    }
}

export async function deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
        const authReq = req as AuthRequest;
        const { id: userId, role } = authReq.user!;
        const { id } = req.params;
        const templateId = id as string;
        await templateService.deleteTemplate(templateId);
        res.json({ message: "Template deleted successfully" });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete template";
        res.status(500).json({ error: message });
    }
}
