import Joi from "joi";

export const createCampaignSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(null, ""),
    template_id: Joi.string().uuid().allow(null),
    status: Joi.string().valid('draft', 'scheduled', 'sending', 'sent', 'failed'),
    scheduled_at: Joi.date().iso().allow(null),
});

export const updateCampaignSchema = Joi.object({
    name: Joi.string(),
    description: Joi.string().allow(null, ""),
    template_id: Joi.string().uuid().allow(null),
    status: Joi.string().valid('draft', 'scheduled', 'sending', 'sent', 'failed'),
    scheduled_at: Joi.date().iso().allow(null),
});
