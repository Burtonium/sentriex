const { Joi } = require('celebrate');
const passwordRegex = require('./password_regex');

module.exports = {
  body: Joi.object().keys({
    username: Joi.string().token().required(),
    email: Joi.string().email().required(),
    password: Joi.string().regex(passwordRegex).required(),
    referralCode: Joi.string().allow(''),
  }).unknown(),
};
