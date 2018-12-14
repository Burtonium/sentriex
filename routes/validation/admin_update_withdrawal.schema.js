const { Joi } = require('celebrate');

module.exports = {
  body: {
    txId: Joi.string().allow(null),
    status: Joi.string().valid(['canceled', 'declined', 'approved']),
  },
};
