const { keyBy, pick } = require('lodash');
const Currency = require('../models/currency');
const UserAddress = require('../models/user_address');
const { CurrencyAlreadyExists, NoAvailableAddresses } = require('./errors');

const fetchAll = async (req, res) => {
  const currencies = keyBy(await Currency.query(), 'code');
  res.status(200).json({ currencies });
};

const create = async (req, res) => {
  const currencyData = req.body.currency || req.body;
  const data = pick(currencyData, ['code', 'type', 'precision', 'label', 'icon', 'unicodeSymbol']);

  const currency = await Currency.query().where('code', data.code).first();
  if (currency) {
    throw new CurrencyAlreadyExists();
  }

  await Currency.query().context({ admin: req.user }).insert(data);

  return res.status(201).json({ success: true, message: 'Currency created' });
};

const patch = async (req, res) => {
  const { code } = req.params;
  const currencyData = req.body.currency || req.body;
  const data = pick(currencyData, [
    'code',
    'type',
    'precision',
    'label',
    'icon',
    'unicodeSymbol'
  ]);
  
  const currency = await Currency.query().where('code', code).first();
  if (!currency) {
    return res.status(404).json({ success: false, message: 'Currency not found' });
  }
  
  await currency.$query().update(data);
  
  return res.status(200).json({ success: true, message: 'Currency updated' });
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
  
  await currency.$relatedQuery('userAddresses').insert(addresses.map(a => ({ address: a })));
  
  return res.status(200).json({ success: true });
};

const fetchUserAddresses = async (req, res) => {
  const { code } = req.params;
  const currency = await Currency.query()
    .eager('userAddresses')
    .modifyEager(qb => qb.where('userId', req.user.id))
    .where('code', code)
    .first();
    
  if (!currency) {
    return res.status(404).json({ success: false, message: 'Currency not found' });
  }
  
  let addresses = currency.userAddresses;
  if (addresses.length === 0) {
    const address = await UserAddress.query().where('userId', null).first();
    if (!address) {
      throw new NoAvailableAddresses();
    }
    await address.$query().update({ userId: req.user.id });
    addresses.push(address);
  }
  
  return res.status(200).json({ success: true, addresses });
};

const fetchCurrencyInfo = async (req, res) => {
  
};

module.exports = {
  fetchAll,
  create,
  addAddresses,
  patch,
  fetchUserAddresses,
  fetchCurrencyInfo,
};
