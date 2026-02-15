import Joi from "joi";

export const createDepartmentSchema = Joi.object({
  college_id: Joi.string().uuid().required(),
  name: Joi.string().required().max(255),
  short_name: Joi.string().allow("", null).max(100),
  contact_email: Joi.string().email().allow("", null).max(255),
  contact_phone: Joi.string().allow("", null).max(50),
});

export const updateDepartmentSchema = Joi.object({
  name: Joi.string().max(255),
  short_name: Joi.string().allow("", null).max(100),
  contact_email: Joi.string().email().allow("", null).max(255),
  contact_phone: Joi.string().allow("", null).max(50),
}).min(1);
