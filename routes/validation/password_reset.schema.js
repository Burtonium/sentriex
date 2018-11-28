const { Joi } = require('celebrate');
const passwordRegex = require('./password_regex');

module.exports = {
  body: {
    newPassword: Joi.string().regex(passwordRegex).required(),
    oldPassword: Joi.string().required(),
    email: Joi.string().email().required(),
    resetToken: Joi.string().guid(),
    twofaToken: Joi.number().integer()
  },
};
