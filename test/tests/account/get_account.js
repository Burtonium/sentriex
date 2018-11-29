const User = require('../../../models/user');
const { chaiRequest, getToken } = require('../../utils');
const { expect } = require('chai');

describe('GET /account', () => {
  let user = {
    username: 'user1',
    email: 'user1@email.com',
    password: 'User1234!',
    active: true,
    type: 'default'
  };

  beforeEach(async () => {
    user = await User.query().insert(user);
  });

  it('Should get account info', async () => {
    const token = getToken(user);
    const res = await chaiRequest('get', '/account', token);
    expect(res.status).to.be.equal(200);
    expect(res.body.username).to.be.equal(user.username);
    expect(res.body.email).to.be.equal(user.email);
    expect(res.body.twofa).to.be.false; // eslint-disable-line
    expect(res.body.createdAt).to.not.be.null; // eslint-disable-line
  });
});
