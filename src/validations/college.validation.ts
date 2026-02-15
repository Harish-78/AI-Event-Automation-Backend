import Joi from "joi";

export const createCollegeSchema = Joi.object({
  name: Joi.string().required().max(255),
  city: Joi.string().allow("", null).max(100),
  taluka: Joi.string().allow("", null).max(100),
  district: Joi.string().allow("", null).max(100),
  state: Joi.string().allow("", null).max(100),
  zip_code: Joi.string().allow("", null).max(20),
  country: Joi.string().allow("", null).max(100),
  short_name: Joi.string().allow("", null).max(100),
  contact_email: Joi.string().email().allow("", null).max(255),
  contact_phone: Joi.string().allow("", null).max(50),
  website_url: Joi.string().uri().allow("", null),
  registration_number: Joi.string().allow("", null).max(100),
  logo_url: Joi.string().uri().allow("", null),
});

export const updateCollegeSchema = Joi.object({
  name: Joi.string().max(255),
  city: Joi.string().allow("", null).max(100),
  taluka: Joi.string().allow("", null).max(100),
  district: Joi.string().allow("", null).max(100),
  state: Joi.string().allow("", null).max(100),
  zip_code: Joi.string().allow("", null).max(20),
  country: Joi.string().allow("", null).max(100),
  short_name: Joi.string().allow("", null).max(100),
  contact_email: Joi.string().email().allow("", null).max(255),
  contact_phone: Joi.string().allow("", null).max(50),
  website_url: Joi.string().uri().allow("", null),
  registration_number: Joi.string().allow("", null).max(100),
  logo_url: Joi.string().uri().allow("", null),
}).min(1);
