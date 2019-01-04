const Balances = require('../models/balance');
const { keyBy } = require('lodash');

const fetchAll = async (req, res) => {
  const balances = await Balances.query()
    .eager('currency')
    .where({ userId: req.user.id });

  res.status(200).json({ balances: keyBy(balances, 'currencyCode'), success: true });
};

module.exports = {
    fetchAll,
};
