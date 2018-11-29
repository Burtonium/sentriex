const { keyBy } = require('lodash');
const {
  chaiRequest, expect
} = require('../../utils.js');
const User = require('../../../models/user');
const Activation = require('../../../models/activation');

describe('POST /activate/:token', () => {
  let inserted;
  const users = [{
    email: 'doug@email.com',
    username: 'doug',
    password: 'dougPassword',
    active: false,
    activationTokens: [{}]
  }, {
    email: 'greg@email.com',
    username: 'greg',
    password: 'gregPassword',
    active: true,
    activationTokens: [{}]
  }];

  beforeEach(async () => {
    inserted = keyBy(await User.query().insertGraph(users), 'username');
  });

  it('Should fail if token does not exist', async () => {
    const res = await chaiRequest('post', '/activate/invalidToken');

    res.body.should.be.a('Object');
    expect(res.status).to.be.equal(400);
    expect(res.body.message).to.be.equal('Invalid activation token');
  });

  it('Should fail if user is already active', async () => {
    const activation = await Activation.query().where({ userId: inserted.greg.id }).first();
    const res = await chaiRequest('post', `/activate/${activation.token}`);

    res.body.should.be.a('Object');
    expect(res.status).to.be.equal(400);
    expect(res.body.message).to.be.equal('Invalid activation token');
  });

  it('Should activate user', async () => {
    const activation = await Activation.query().where({ userId: inserted.doug.id }).first();
    const res = await chaiRequest('post', `/activate/${activation.token}`);

    res.body.should.be.a('Object');
    expect(res.status).to.be.equal(200);
    expect(res.body.success).to.be.equal(true);
    expect(res.body.message).to.be.equal('User activated');
  });
});
