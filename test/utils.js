const dotenv = require('dotenv');
const uuid = require('uuid/v4');
const assert = require('assert');
const fs = require('fs');
const chai = require('chai');
const jwt = require('jsonwebtoken');
const { pick } = require('lodash');
const { cookieKeys } = require('../routes/authentication');
const app = require('../index');
const { knex } = require('../database');

const envConfig = dotenv.parse(fs.readFileSync('.env.test'));
Object.keys(envConfig).forEach((k) => {
  process.env[k] = envConfig[k];
});

const validMethods = ['post', 'patch', 'put', 'get', 'delete'];
const assertMethod = (method) => {
  assert.ok(validMethods.includes(method), `Invalid chai method: '${method}'`);
};

chai.use(require('chai-http'));
chai.use(require('chai-uuid'));
chai.should();

const chaiRequest = (method, route, token) => {
  assertMethod(method);
  const CSRFToken = uuid();
  
  const cookies = {
    [cookieKeys.csrf]: CSRFToken,
  };
  
  if (token) {
    cookies[cookieKeys.auth] = token;
  }
  
  const cookieString = Object.keys(cookies).map((key) => {
    return `${key}=${cookies[key]}`;
  }).join(';');

  let req = chai.request(app)[method](route)
    .set('Cookie', cookieString)
    .set('x-csrf-token', CSRFToken);

  return req;
};

const getToken = user => jwt.sign({
  user: pick(user, ['email', 'id', 'username', 'active', 'type']),
}, process.env.JWT_SECRET, { expiresIn: 60 * 60 * 24 });

module.exports = {
    chaiRequest,
    getToken,
    knex,
    expect: chai.expect
};