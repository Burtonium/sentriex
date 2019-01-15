const { keyBy } = require('lodash');
const { transaction } = require('objection');
const validate = require('celebrate').celebrate;
const depositSchema = require('./validation/deposit.schema');
const { knex } = require('../database');
const UserAddress = require('../models/user_address');
const Currency = require('../models/currency');
const Balance = require('../models/balance');
const Deposit = require('../models/deposit');
const { BadRequest } = require('./errors');

class DepositAlreadyExists extends BadRequest {
  get message() {
    return 'Deposit already exist';
  }

  get code() {
    return 47;
  }
}

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
    await Balance.query(trx)
      .forUpdate()
      .update({ amount: knex.raw(`amount + ?`, amount) })
      .where({ currencyCode, userId });
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
  fetchMyDeposits,
  fetchDeposits,
  createDeposit: [validate(depositSchema), createDeposit],
  findAddress,
};
