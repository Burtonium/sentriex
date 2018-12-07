const { Joi } = require('celebrate');

module.exports = {
  body: {
    amount: Joi.number().greater(0).required(),
  },
};
