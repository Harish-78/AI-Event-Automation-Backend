import Joi from "joi";

export const createRegistrationSchema = Joi.object({
  event_id: Joi.string().uuid().required(),
});
