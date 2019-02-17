const User = require('../../models/user');

const users = [{
  id: 1,
  email: 'admin@staging.sentriex.com',
  username: 'test_admin',
  type: 'admin',
  password: 'testadmin',
  active: true,
  activatedAt: new Date()
}, {
  id: 2,
  email: 'manager@staging.sentriex.com',
  username: 'test_fund_manager',
  type: 'fund_manager',
  password: 'testmanager',
  active: true,
  referredBy: 1,
  activatedAt: new Date()
}, {
  id: 3,
  email: 'user@staging.sentriex.com',
  username: 'test_user',
  type: 'user',
  password: 'testuser',
  active: true,
  referredBy:1,
  activatedAt: new Date(),
}, {
  id: 4,
  email: 'referral@staging.sentriex.com',
  username: 'test_referral',
  type: 'user',
  password: 'testreferral',
  active: true,
  activatedAt: new Date(),
  referredBy: 1,
}];

for (let i = 5; i <= 20; i++) {
  users.push({
    id: i,
    email: `user_${i}@staging.sentriex.com`,
    username: `user_${i}`,
    type: 'user',
    password: 'testuser',
    active: true,
    activatedAt: new Date(),
    referredBy: 1,
  })
}

exports.seed = async (knex) => User.query().insert(users).then(() => knex.raw('select setval(\'users_id_seq\', max(id)) from users'));
