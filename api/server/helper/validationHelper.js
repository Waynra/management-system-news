import Joi from "joi";

export const newsPayloadValidation = (payload) => {
  const newsSchema = Joi.object({
    title: Joi.string().trim().min(5).required(),
    content: Joi.string().trim().min(10).required(),
    author: Joi.string().trim().min(2).required(),
    source: Joi.string().trim().min(2).required(),
  });
  const { error } = newsSchema.validate(payload);
  if (error) throw error;
};

export const newsQueryValidation = (query) => {
  const querySchema = Joi.object({
    query: Joi.string().min(3).required(),
  });
  const { error } = querySchema.validate(query);
  if (error) throw error;
};

export const newsFilterValidation = (query) => {
  const filterSchema = Joi.object({
    page: Joi.number().optional().allow(""),
    limit: Joi.number().optional().allow(""),
  });
  const { error } = filterSchema.validate(query);
  if (error) throw error;
};
