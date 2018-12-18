const { Joi } = require('celebrate');

module.exports = {
  params: {
    authenticationToken: Joi.string().uuid(),
  },
};
