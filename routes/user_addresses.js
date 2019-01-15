const { keyBy } = require('lodash');
const UserAddress = require('../models/user_address');
const Currency = require('../models/currency');
const { NotImplemented } = require('./errors');

class NoAvailableAddresses extends NotImplemented {
  get message() {
    return 'No address available';
  }

  get code() {
    return 46;
  }
}

const generateDepositAddress = async (req, res) => {
  const { currencyCode } = req.params;
  const address = await UserAddress.query()
    .where({ userId: null, currencyCode })
    .orderBy('id', 'asc')
    .first();

  if (!address) {
    throw new NoAvailableAddresses();
  }

  await address.$query().update({ userId: req.user.id });
  return res.status(201).json({ success: true, address });
};

const fetchDepositAddresses = async (req, res) => {
  const result = await UserAddress.query()
    .orderBy('createdAt', 'desc')
    .where('userId', req.user.id);
  const depositAddresses = keyBy(result, a => a.currencyCode);
  return res.status(200).json({ success: true, depositAddresses });
};

const addAddresses = async (req, res) => {
  const { code } = req.params;
  const { addresses } = req.body;

  const currency = await Currency.query()
    .where('code', code)
    .first();

  if (!currency) {
    return res.status(404).json({ success: false, message: 'Currency not found' });
  }

  await currency.$relatedQuery('userAddresses').insert(addresses.map(a => ({ address: a.trim() })));

  return res.status(200).json({ success: true });
};

module.exports = {
  generateDepositAddress,
  fetchDepositAddresses,
  addAddresses,
}
