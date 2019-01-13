const assert = require('assert');
const { pick } = require('lodash');
const { transaction } = require('objection');
const validate = require('celebrate').celebrate;
const { knex } = require('../database');
const Currency = require('../models/currency');
const { sendActivationEmail, sendPasswordResetEmail } = require('./emails');
const PasswordReset = require('../models/password_reset');
const Activation = require('../models/activation');
const User = require('../models/user');
const passwordResetSchema = require('./validation/password_reset.schema');
const registrationSchema = require('./validation/registration.schema');

const {
  UsernameTaken,
  UserNotFound,
  InvalidActivation,
  InvalidResetToken,
  InvalidOldPassword,
  InvalidTwofaToken,
} = require('./errors');

const register = async (req, res) => {
  const {
    email, username, password, referralCode,
  } = req.body;

  const response = { success: true, message: 'Activation email sent' };

  const existingUser = await User.query()
    .where(knex.raw('LOWER(users.username)'), '=', username.toLowerCase())
    .orWhere(knex.raw('LOWER(users.email)'), '=', email.toLowerCase())
    .first();

  // avoid letting the client know this email exists to limit potential attacks
  if (existingUser) {
    if (existingUser.username.toLowerCase() === username.toLowerCase()) {
      throw new UsernameTaken();
    }
    return res.status(201).json(response);
  }

  const referred = referralCode
    ? (await User.query().where({ referralCode }).first()) : null;

  const currencies = await Currency.query();

  const user = await User.query().insertGraph({
    email,
    password,
    username,
    referredBy: referred ? referred.id : null,
    balances: currencies.map(c => ({ currencyCode: c.code })),
  }).returning('*');

  const activation = await Activation.query().insertAndFetch({
    userId: user.id,
  });

  sendActivationEmail({ activation, user });
  return res.status(201).json(response);
};

const activate = async (req, res) => {
  const { token } = req.params;

  const activation = await Activation.query()
    .eager('user')
    .whereRaw('user_activations.created_at >= (now() - interval \'1 hour\')')
    .andWhere({ token })
    .first();

  if (!activation || !activation.user || activation.user.active) {
    throw new InvalidActivation();
  }

  await User.query()
    .patch({ active: true, activatedAt: new Date() })
    .where('id', activation.user.id);

  res.status(200).json({ success: true, message: 'User activated' });
};

const resendToken = async (req, res) => {
  const { identifier } = req.body;
  const user = await User.query()
    .where({ email: identifier })
    .orWhere({ username: identifier })
    .first();

  if (!user) {
    throw new UserNotFound();
  }

  const activation = await Activation.query().insertAndFetch({
    userId: user.id,
  });

  if (!user.active) {
    await sendActivationEmail({ user, activation });
  }

  return res.status(200).json({ success: true, message: 'Activation email resent' });
};

const findUser = async (req, res) => {
  const { username } = req.params;
  const user = await User.query().where(knex.raw('LOWER(users.username)'), '=', username.toLowerCase()).first();
  return res.status(200).json({ success: true, available: !user, message: `Username is ${user ? 'un' : ''}available` });
};

const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  const user = await User.query().where({ email }).first();
  if (!user) {
    return res.status(200).json({ success: true, message: 'Password reset request sent' });
  }

  const reset = await PasswordReset.query().insertAndFetch({
    userId: user.id,
  });

  sendPasswordResetEmail({ user, reset });

  return res.status(200).json({ success: true, message: 'Password reset request sent' });
};

const resetPassword = async (req, res) => {
  const { newPassword } = req.body;
  const resetToken  = req.params.resetToken || req.body.resetToken;
  const reset = await PasswordReset.query().eager('user').where({
    token: resetToken,
    used: false
  }).whereRaw('created_at >= (now() - interval \'1 hour\')')
  .first();

  if (!reset) {
    throw new InvalidResetToken();
  }

  await Promise.all([
    reset.$query().update({ used: true }),
    reset.user.$query().update({ password: newPassword })
  ]);

  return res.status(200).json({ success: true, message: 'Password successfully changed' });
};

const formatAccount = async (user) => {
  return {
    ...pick(user, ['username', 'email', 'referralCode', 'createdAt', 'updatedAt']),
    twofa: !!user.twofaSecret,
  };
};

const getAccount = async (req, res) => {
  const user = await User.query().where('id', req.user.id).first();
  assert.ok(user, `getAccount() user ${req.user.id} not found`);
  const formatted = await formatAccount(user);
  res.status(200).json(formatted);
};

module.exports = {
  register: [validate(registrationSchema), register],
  activate,
  resendToken,
  findUser,
  requestPasswordReset,
  resetPassword: [validate(passwordResetSchema), resetPassword],
  formatAccount,
  getAccount,
};
