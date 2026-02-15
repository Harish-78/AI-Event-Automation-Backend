import Joi from "joi";

export const createEventSchema = Joi.object({
  title: Joi.string().required().max(255),
  description: Joi.string().allow("", null),
  college_id: Joi.string().uuid().required(),
  department_id: Joi.string().uuid().allow(null),
  category: Joi.string().required().max(100),
  start_time: Joi.date().iso().required(),
  end_time: Joi.date().iso().min(Joi.ref("start_time")).required(),
  location: Joi.string().allow("", null),
  registration_deadline: Joi.date().iso().max(Joi.ref("start_time")).allow(null),
  max_participants: Joi.number().integer().min(1).allow(null),
  status: Joi.string().valid("draft", "published", "cancelled", "completed").default("draft"),
});

export const updateEventSchema = Joi.object({
  title: Joi.string().max(255),
  description: Joi.string().allow("", null),
  department_id: Joi.string().uuid().allow(null),
  category: Joi.string().max(100),
  start_time: Joi.date().iso(),
  end_time: Joi.date().iso().min(Joi.ref("start_time")),
  location: Joi.string().allow("", null),
  registration_deadline: Joi.date().iso().max(Joi.ref("start_time")).allow(null),
  max_participants: Joi.number().integer().min(1).allow(null),
  status: Joi.string().valid("draft", "published", "cancelled", "completed"),
}).min(1);
