import { Router } from "express";
import * as campaignController from "../controllers/campaign.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createCampaignSchema, updateCampaignSchema } from "../validations/campaign.validation";

const campaignRouter = Router();

campaignRouter.post("/", authenticate, authorize("admin", "superadmin"), validate(createCampaignSchema), campaignController.createCampaign);
campaignRouter.get("/", authenticate, campaignController.getAllCampaigns);
campaignRouter.get("/:id", authenticate, campaignController.getCampaignById);
campaignRouter.put("/:id", authenticate, authorize("admin", "superadmin"), validate(updateCampaignSchema), campaignController.updateCampaign);
campaignRouter.delete("/:id", authenticate, authorize("admin", "superadmin"), campaignController.deleteCampaign);

export default campaignRouter;
