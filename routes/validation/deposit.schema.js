const { Joi } = require('celebrate');

module.exports = {
  body: {
    currencyCode: Joi.string().min(2).max(10).required(),
    amount: Joi.number().greater(0).required(),
    userId: Joi.number().integer().min(0).required(),
    userAddressId: Joi.number().integer().min(0),
    txId: Joi.string(),
  },
};
