const { keyBy } = require('lodash');
const { transaction } = require('objection');
const validate = require('celebrate').celebrate;
const depositSchema = require('./validation/deposit.schema');
const { knex } = require('../database');
const UserAddress = require('../models/user_address');
const Currency = require('../models/currency');
const Balance = require('../models/balance');
const Deposit = require('../models/deposit');
const { NoAvailableAddresses, BadRequest } = require('./errors');

class DepositAlreadyExists extends BadRequest {
  get message() {
    return 'Deposit already exist';
  }

  get code() {
    return 47;
  }
}

const fetchDepositAddresses = async (req, res) => {
  const result = await UserAddress.query()
    .orderBy('createdAt', 'desc')
    .where('userId', req.user.id);
  const depositAddresses = keyBy(result, a => a.currencyCode);
  return res.status(200).json({ success: true, depositAddresses });
};

const generateDepositAddress = async (req, res) => {
  const { currencyCode } = req.params;
  const address = await UserAddress.query()
    .where({ userId: null, currencyCode })
    .orderBy('createdAt', 'asc')
    .first();

  if (!address) {
    throw new NoAvailableAddresses();
  }
  
  await address.$query().update({ userId: req.user.id });
  return res.status(201).json({ success: true, address });
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

const fetchMyDeposits = async (req, res) => {
  const { currencyCode } = req.query;
  const deposits = await Deposit.query()
    .where('userId', req.user.id)
    .skipUndefined()
    .andWhere('currencyCode', currencyCode)
    .orderBy('createdAt', 'desc')
    .limit(10);
  return res.status(200).json({ success: true, deposits });
};

const fetchDeposits = async (req, res) => {
  const { currencyCode } = req.query;

  const deposits = await Deposit.query()
    .skipUndefined()
    .where('currencyCode', currencyCode)
    .orderBy('createdAt', 'desc')
    .limit(20);
    
  return res.status(200).json({ success: true, deposits });
};

const createDeposit = async (req, res) => {
  const { 
    currencyCode,
    txId, userId,
    amount,
    userAddressId,
  } = req.body.deposit || req.body;

  const existingDeposit = await Deposit.query().where({ txId }).first();
  if (existingDeposit) {
    throw new DepositAlreadyExists();
  }
  
  await transaction(knex, async (trx) => {
    await Deposit.query(trx).insert({ currencyCode, txId, userId, amount, userAddressId });
    const balance = await Balance.query(trx).where({ userId, currencyCode }).first();
    if (!balance) {
      await Balance.query(trx).insert({ currencyCode, amount, userId });
    } else {
      await Balance.query(trx)
        .forUpdate()
        .update({ amount: knex.raw(`amount + ?`, amount) })
        .where({ currencyCode, userId });
    }
  });
  
  return res.status(200).json({ success: true, message: 'Deposit created.'});
};

const findAddress = async (req, res) => {
  const { depositAddress } = req.params;
  const { currencyCode } = req.query;

  const address = await UserAddress.query()
    .eager('user')
    .where('address', depositAddress)
    .skipUndefined()
    .andWhere('currencyCode', currencyCode)
    .first();
  
  if (!address) {
    return res.status(404).json({ success: false, message: 'Address not found' });
  }
  
  return res.status(200).json({ success: true, address });
};

module.exports = {
  fetchDepositAddresses,
  generateDepositAddress,
  addAddresses,
  fetchMyDeposits,
  fetchDeposits,
  createDeposit: [validate(depositSchema), createDeposit],
  findAddress,
};