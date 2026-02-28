import Joi from "joi";

export const createTemplateSchema = Joi.object({
    name: Joi.string().required(),
    subject: Joi.string().allow(null, ""),
    mjml_content: Joi.string().required(),
});

export const updateTemplateSchema = Joi.object({
    name: Joi.string(),
    subject: Joi.string().allow(null, ""),
    mjml_content: Joi.string(),
});
