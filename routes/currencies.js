const { keyBy, pick } = require('lodash');
const Currency = require('../models/currency');
const { knex } = require('../database');
const { transaction } = require('objection');
const { CurrencyAlreadyExists } = require('./errors');

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
  
  await transaction(knex, async (trx) => {
    const currency = await Currency.query(trx).insert(data);
    await trx.raw(`
      INSERT INTO balances (user_id, currency_code) 
        SELECT id, '${currency.code}' FROM users
      `);
  });

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

const fetchCurrencyInfo = async (req, res) => {
  
};

module.exports = {
  fetchAll,
  create,
  patch,
  fetchCurrencyInfo,
};
