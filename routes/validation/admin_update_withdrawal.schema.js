const { Joi } = require('celebrate');

module.exports = {
  body: {
    status: Joi.string().valid(['declined', 'approved']),
    txId: Joi.string().allow(null),
  },
};
