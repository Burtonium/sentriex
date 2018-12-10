const BigNumber = require('bignumber.js');
const assert = require('assert');
const { transaction } = require('objection');
const { knex } = require('../database');
const InvestmentFund = require('../models/investment_fund');
const InvestmentFundShares = require('../models/investment_fund_shares');
const User = require('../models/user');
const { InsufficientFunds } = require('./errors');
const validate = require('celebrate').celebrate;
const { pick } = require('lodash');
const subscriptionSchema = require('./validation/subscription.schema');

const fetchAll = async(req, res) => {
  const investmentFunds = await InvestmentFund.query()
    .eager('[currency,creator,shares,balanceUpdates]');
  return res.status(200).json({ investmentFunds });
};

const subscribeToFund = async (req, res) => {
  const { id } = req.params;
  const investmentFund = await InvestmentFund.query()
    .eager('[shares,currency]')
    .where({ id })
    .first();

  if (!investmentFund) {
    return res.status(404).json({ success: false, message: 'Investment fund not found' });
  }
  
  let shareBalance = investmentFund.shares && investmentFund.shares.find(sb => sb.userId === req.user.id);
  if (!shareBalance) {
    shareBalance = await investmentFund.$relatedQuery('shares').insert({
      userId: req.user.id,
      amount: 0
    });
  }
  
  const { amount } = req.body;
  const user = await User.query().eager('balances.currency').where({ id: req.user.id }).first();
  const balance = user.balances.find(b => b.currencyCode === investmentFund.currencyCode);

  if (!balance || (new BigNumber(balance.amount)).isLessThan(amount)) {
    throw new InsufficientFunds();
  }

  const shareAmount = (new BigNumber(amount)).dividedBy(investmentFund.sharePrice);

  assert.ok(shareAmount.isGreaterThan(0), 'Invalid amount of shares bought');
  
  await transaction(knex, async (trx) => {
    await balance.remove(amount, trx);
    await shareBalance.add(shareAmount.toString(), trx);
    await investmentFund.add(amount, trx);
  });
  
  return res.status(200).json({ success: true });
};

const redeemFromFund = async (req, res) => {
  const { id } = req.params;
  const investmentFund = await InvestmentFund.query()
    .eager('[shares,currency]')
    .where({ id })
    .first();

  if (!investmentFund) {
    return res.status(404).json({ success: false, message: 'Investment fund not found' });
  }
  
  let shareBalance = investmentFund.shares && investmentFund.shares.find(sb => sb.userId === req.user.id);
  if (!shareBalance) {
    throw new InsufficientFunds();
  }
  
  const { amount } = req.body;
  const user = await User.query().eager('balances.currency').where({ id: req.user.id }).first();
  let balance = user.balances.find(b => b.currencyCode === investmentFund.currencyCode);
  if (!balance) {
    balance = await user.$relatedQuery('balances').insert({
      currencyCode: investmentFund.currencyCode,
      amount: 0,
    });
  }
  
  const shareAmount = (new BigNumber(amount)).dividedBy(investmentFund.sharePrice);
  assert.ok(shareAmount.isGreaterThan(0), 'Invalid amount of shares sold');
  
  await transaction(knex, async (trx) => {
    await balance.add(amount, trx);
    await shareBalance.remove(shareAmount.toString(), trx);
    await investmentFund.remove(amount, trx);
  });
  
  return res.status(200).json({ success: true });
};

const updateBalance = async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  
  const investmentFund = await InvestmentFund.query()
    .where({ id })
    .eager('shares')
    .first();
  
  if (!investmentFund) {
    return res.status(404).json({ success: false, message: 'Investment fund not found' });
  }
  
  await transaction(knex, async (trx) => {
    const previousSharePrice = investmentFund.sharePrice;
    const previousBalance = investmentFund.balance;
    investmentFund.balance = amount;
    const updatedSharePrice = investmentFund.sharePrice;
    await investmentFund.$relatedQuery('balanceUpdates').insert({
      previousSharePrice,
      updatedSharePrice,
      previousBalance,
      updatedBalance: amount,
    });
    await investmentFund.$query().update({ balance: amount });
  });
  
  return res.status(200).json({ success: true });
};

const updateInvestmentFund = async (req, res) => {
  const { id } = req.params;
  const args = pick(req.body, [
    'name',
    'currencyCode',
    'shortDescription',
    'detailedDescription',
    'riskLevel'
  ]);
  
  const investmentFund = await InvestmentFund.query()
    .where({ id })
    .first();
  
  if (!investmentFund) {
    return res.status(404).json({ success: false, message: 'Investment fund not found' });
  }
  
  await investmentFund.$query().update(args);
  
  return res.status(200).json({ success: true });
};

const createInvestmentFund = async (req, res) => {
  const args = pick(req.body, [
    'name',
    'currencyCode',
    'shortDescription',
    'detailedDescription',
    'riskLevel',
  ]);
  
  const investmentFund = await InvestmentFund.query().insert({
    creatorId: req.user.id,
    ...args,
  });
  
  return res.status(200).json({ success: true, investmentFund });
};

const fetchShares = async (req, res) => {
  const investmentFundShares = await InvestmentFundShares.query().where('userId', req.user.id);
  return res.status(200).json({ success: true, investmentFundShares });
};

const fetchBalanceUpdates = async (req, res) => {
  const { id } = req.params;
  const investmentFund = await InvestmentFund.query()
    .eager('balanceUpdates')
    .where({
      id,
      creatorId: req.user.id,
    }).first();
  
  res.status(200).json({
    success: true,
    balanceUpdates: investmentFund.balanceUpdates
  });
};

module.exports = {
  fetchAll,
  subscribeToFund: [validate(subscriptionSchema), subscribeToFund],
  redeemFromFund,
  fetchShares,
  updateBalance,
  updateInvestmentFund,
  createInvestmentFund,
  fetchBalanceUpdates,
};
