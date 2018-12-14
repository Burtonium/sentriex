const { Joi } = require('celebrate');

module.exports = {
  body: {
    address: Joi.string().required(),
    currencyCode: Joi.string().min(2).max(10).required(),
    amount: Joi.number().greater(0).required(),
    twofaToken: Joi.string().regex(/^\d{6}$/).allow(null),
  },
};
