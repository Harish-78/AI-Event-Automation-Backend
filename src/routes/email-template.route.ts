import { Router } from "express";
import * as templateController from "../controllers/email-template.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createTemplateSchema, updateTemplateSchema } from "../validations/email-template.validation";

const templateRouter = Router();

templateRouter.post("/", authenticate, authorize("admin", "superadmin"), validate(createTemplateSchema), templateController.createTemplate);
templateRouter.get("/", authenticate, templateController.getAllTemplates);
templateRouter.get("/:id", authenticate, templateController.getTemplateById);
templateRouter.put("/:id", authenticate, authorize("admin", "superadmin"), validate(updateTemplateSchema), templateController.updateTemplate);
templateRouter.delete("/:id", authenticate, authorize("admin", "superadmin"), templateController.deleteTemplate);

export default templateRouter;
