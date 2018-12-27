const jwt = require('jsonwebtoken');
const { URL } = require('url');
const request = require('request-promise');
const QRCode = require('qrcode');
const speakeasy = require('speakeasy');
const assert = require('assert');
const uuid = require('uuid/v4');
const { knex } = require('../database');
const User = require('../models/user');

const cookieKeys = {
  csrf: 'CSRF-TOKEN',
  auth: 'JWT-COOKIE'
};

const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || 60 * 60;
  
const CSRFOptions = {
  expire: (new Date() + TOKEN_EXPIRY * 1000),
  httpOnly: true,
  sameSite: true,
  secure: true,
};

const {
  RecaptchaFailed,
  UserNotActive,
  AuthenticationFailed,
  InvalidUserToken,
  Unauthorized,
  InvalidTwofaToken,
  TwofaAlreadyEnabled,
  TwofaNotEnabled,
  InvalidCSRFToken,
} = require('./errors');

const validateRecaptcha = async (req, res, next) => {
  const response = req.body.recaptcha;
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  const remoteip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  const options = {
    method: 'POST',
    uri: 'https://www.google.com/recaptcha/api/siteverify',
    formData: {
      secret,
      response,
      remoteip,
    },
    json: true,
  };
  
  const recaptchaResponse = await request(options);

  if (!recaptchaResponse.success) {
    throw new RecaptchaFailed();
  } else {
    next();
  }
};

const verifyToken = (req, res, next) => {
  const token = req.cookies[cookieKeys.auth]; // eslint-disable-line
  const headerCSRFToken = req.headers['x-csrf-token'];
  const cookieCSRFToken = req.cookies[cookieKeys.csrf]; // eslint-disable-line

  if (!headerCSRFToken || (headerCSRFToken !== cookieCSRFToken)) {
    throw new InvalidCSRFToken();
  }

  if (!token) {
    throw new InvalidUserToken('No token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.decoded = decoded;
    req.user = decoded.user;
    next();
  } catch (err) {
    throw new InvalidUserToken();
  }
};

const verifyAdmin = (req, res, next) => {
  if (!req.user || !req.user.admin) {
    throw new Unauthorized();
  }
  req.admin = req.user;
  next();
};

const verifyManager = (req, res, next) => {
  if (!req.user.manager) {
    throw new Unauthorized();
  }
  next();
};

const verify2fa = async (req, res, next) => {
  assert.ok(req.user, 'check2fa missing req.user');
  if (req.user.twofa) {
    const token = req.body.twofaToken || req.query.twofaToken;
    const user = await User.query().select('twofaSecret').where('id', req.user.id).first();
    const verified = await user.verifyTwofa(token);

    if (!verified) {
      throw new InvalidTwofaToken();
    }
    req.twofaIsVerified = true;
  }
  next();
};

const generateToken = (user) => {
  return jwt.sign({
    user: user.toTokenDetails(),
  }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

const authenticate = async (req, res) => {
  const identifier = req.body.identifier.toLowerCase();
  const { password, twofaToken } = req.body;
  const user = await User.query()
    .where(knex.raw('LOWER(email)'), '=', identifier)
    .orWhere(knex.raw('LOWER(username)'), '=', identifier)
    .first();

  if (!user || !(await user.verifyPassword(password))) {
    throw new AuthenticationFailed();
  }

  if (user && !user.active) {
    throw new UserNotActive();
  }

  if (user.twofaSecret) {
    const verified = await user.verifyTwofa(twofaToken);
    if (!verified) {
      throw new InvalidTwofaToken();
    }
  }
  
  const CSRFToken = uuid();
  const encoded = generateToken(user);

  return res.status(200)
    .cookie(cookieKeys.csrf, CSRFToken, CSRFOptions)
    .cookie(cookieKeys.auth, encoded, CSRFOptions)
    .json({
      success: true,
      message: 'Authentication successful',
      user: user.toTokenDetails(),
      CSRFToken
    });
};

const generate2faSecret = async (req, res) => {
  const secret = speakeasy.generateSecret({
    length: 32,
    name: `sentriex (${req.user.email})`,
  });

  const url = await QRCode.toDataURL(secret.otpauth_url);

  res.status(200).send({ url, secret: secret.base32 });
};

const enable2fa = async (req, res) => {
  const { id } = req.user;
  const { twofaToken, twofaSecret } = req.body;

  const user = await User.query().where({ id }).first();

  if (user.twofaIsEnabled) {
    throw new TwofaAlreadyEnabled();
  }

  const verified = speakeasy.totp.verify({
    secret: twofaSecret,
    encoding: 'base32',
    token: twofaToken,
  });

  if (!verified) {
    throw new InvalidTwofaToken();
  }

  await user.$query().update({ twofaSecret });

  
  res.status(200)
    .cookie(cookieKeys.auth, generateToken(user), CSRFOptions) // refresh JWT state
    .json({ success: true, message: 'Two factor authentication enabled' });
};

const disable2fa = async (req, res) => {
  const { id } = req.user;
  const { twofaToken } = req.body;

  const user = await User.query().where({ id }).first();

  if (!user.twofaSecret) {
    throw new TwofaNotEnabled();
  }

  const verified = await user.verifyTwofa(twofaToken);
  if (!verified) {
    throw new InvalidTwofaToken();
  }

  await user.$query().update({ twofaSecret: null });
  
  const encoded = generateToken(user);

  res.status(200)
    .cookie(cookieKeys.auth, encoded, CSRFOptions) // refresh JWT state
    .json({ success: true, message: 'Two factor authentication disabled' });
};

module.exports = {
  validateRecaptcha,
  verifyToken,
  authenticate,
  enable2fa,
  generate2faSecret,
  disable2fa,
  verifyAdmin: [verifyToken, verifyAdmin],
  verify2fa,
  cookieKeys,
  verifyManager: [verifyToken, verifyManager],
};
