const { Joi } = require('celebrate');

module.exports = {
  body: {
    code: Joi.string().required(),
    label: Joi.string(),
    type: Joi.string().valid(['crypto', 'fiat']),
    icon: Joi.string(),
    precision: Joi.number().integer().required().min(0),
    unicodeSymbol: Joi.string(),
  },
};
