const { Joi } = require('celebrate');

module.exports = {
  body: Joi.object().keys({
    code: Joi.string().required(),
    label: Joi.string(),
    type: Joi.string().valid(['crypto', 'fiat']).required(),
    icon: Joi.string(),
    precision: Joi.number().integer().required().min(0),
    unicodeSymbol: Joi.string(),
  }).unknown(),
};
