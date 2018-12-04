const User = require('../../models/user');

exports.seed = async (knex) => User.query().insert([{
  id: 0,
  email: 'admin@sentriex.com',
  username: 'test_admin',
  type: 'admin',
  password: 'testadmin',
  active: true,
  activatedAt: new Date()
}, {
  id: 1,
  email: 'manager@sentriex.com',
  username: 'test_fund_manager',
  type: 'fund_manager',
  password: 'testmanager',
  active: true,
  activatedAt: new Date()
}, {
  id: 2,
  email: 'user@sentriex.com',
  username: 'test_user',
  type: 'user',
  password: 'testuser',
  active: true,
  activatedAt: new Date()
}]);