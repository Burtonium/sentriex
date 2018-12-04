const { Joi } = require('celebrate');
const passwordRegex = require('./password_regex');

module.exports = {
  body: {
    newPassword: Joi.string().regex(passwordRegex).required(),
    email: Joi.string().email(),
    resetToken: Joi.string().guid(), // TODO require this or old pass and twofa
    oldPassword: Joi.string(),
    twofaToken: Joi.number().integer()
  },
};
