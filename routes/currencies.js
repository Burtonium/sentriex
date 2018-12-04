const { keyBy } = require('lodash');
const Currency = require('../models/currency');

const fetchAll = async (req, res) => {
  const currencies = keyBy(await Currency.query(), 'code');
  res.status(200).json({ currencies });
};

module.exports = {
  fetchAll,
};
