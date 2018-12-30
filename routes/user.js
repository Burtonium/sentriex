const User = require('../models/user');

const fetchAll = async (req, res) => {
  let { type } = req.query;
  if (type === 'user') {
    type = undefined;
  }
  let userQuery =  User.query().skipUndefined().where({ type });
  if (type === 'fund_manager') {
    userQuery = userQuery.orWhere({ type: 'admin' });
  }
  const users = await userQuery;
  return res.status(200).json({ success: true, users });
};

module.exports = {
  fetchAll,
};