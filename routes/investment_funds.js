const assert = require('assert');
const { transaction } = require('objection');
const Mailer = require('./mailer');
const { knex } = require('../database');
const InvestmentFund = require('../models/investment_fund');
const InvestmentFundShares = require('../models/investment_fund_shares');
const InvestmentFundRequest = require('../models/investment_fund_request');
const Balance = require('../models/balance');
const User = require('../models/user');
const Currency = require('../models/currency');
const { BadRequest } = require('./errors');
const validate = require('celebrate').celebrate;
const { pick } = require('lodash');
const subscriptionSchema = require('./validation/subscription.schema');
const patchInvestmentFundRequestSchema = require('./validation/admin_update_withdrawal.schema');
const authenticateResource = validate(require('./validation/authenticate_resource.schema'));

class CannotCancelRequest extends BadRequest {
  get code() {
    return 48;
  }

  get message() {
    return 'Investment fund request is not cancelable';
  }
}

class CannotPatchRequest extends BadRequest {
  get code() {
    return 52;
  }

  get message() {
    return 'Investment fund request status is locked';
  }
}

const sendRequestAuthenticationEmail = async investmentFundRequest => {
  const {
    authenticationToken,
    requestAmount,
    userId,
    type,
    investmentFundId
  } = investmentFundRequest;

  const investmentFund = investmentFundRequest.investmentFund || await InvestmentFund.query().where('id', investmentFundId).first();
  const [user, currency] = await Promise.all([
    investmentFundRequest.user || User.query().where('id', userId).first(),
    investmentFundRequest.currency || Currency.query().where('code', investmentFund.currencyCode).first(),
  ]);

  const { name } = investmentFund;
  const { email } = user;
  const formattedAmount = currency.format(requestAmount);
  const url = `${process.env.SITE_URL}/investment-fund-requests/activate/${authenticationToken}`;
  const msg = {
    to: email,
    from: process.env.NOREPLY_EMAIL,
    subject: 'Request Authentication',
    text: `Please verify your ${type} of ${formattedAmount} to the fund: "${name}" by clicking
           the following link:
           ${url}`,
  };

  Mailer.send(msg);
};

const fetchAll = async(req, res) => {
  const investmentFunds = await InvestmentFund.query()
    .eager('[currency,creator,shares,balanceUpdates]');
  return res.status(200).json({ investmentFunds });
};

const subscribeToFund = async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  const userId = req.user.id;

  const investmentFund = await InvestmentFund.query()
    .eager('[shares,currency]')
    .where({ id })
    .first();

  if (!investmentFund) {
    return res.status(404).json({ success: false, message: 'Investment fund not found' });
  }

  const balance = await Balance.query()
    .eager('currency')
    .where({
      userId,
      currencyCode: investmentFund.currencyCode
    }).first();
  assert(balance, 'Balance not found');

  const twofaEnabledAndVerified = req.user.twofa && req.twofaIsVerified;
  const { PENDING, PENDING_EMAIL_VERIFICATION } = InvestmentFundRequest.statuses;
  const status = twofaEnabledAndVerified ? PENDING : PENDING_EMAIL_VERIFICATION;

  let request;
  await transaction(knex, async (trx) => {
    [request] = await Promise.all([
      investmentFund.$relatedQuery('requests', trx).insert({
        userId,
        type: 'subscription',
        requestAmount: amount,
        status,
      }).returning('*'),
      balance.remove(amount, trx),
    ]);
  });

  if (request.status === PENDING_EMAIL_VERIFICATION) {
    sendRequestAuthenticationEmail(request);
  }

  return res.status(200).json({ success: true, request });
};

const redeemFromFund = async (req, res) => {
  const { id } = req.params;
  const { amount, percent } = req.body;

  assert(amount || percent, 'Need amount or percent for a redemption request');
  const userId = req.user.id;

  const investmentFund = await InvestmentFund.query()
    .eager('[shares,currency]')
    .where({ id })
    .first();

  if (!investmentFund) {
    return res.status(404).json({ success: false, message: 'Investment fund not found' });
  }

  const twofaEnabledAndVerified = req.user.twofa && req.twofaIsVerified;
  const { PENDING, PENDING_EMAIL_VERIFICATION } = InvestmentFundRequest.statuses;
  const status = twofaEnabledAndVerified ? PENDING : PENDING_EMAIL_VERIFICATION;

  const request = await investmentFund.$relatedQuery('requests').insert({
    userId,
    type: 'redemption',
    requestAmount: amount,
    requestPercent: percent,
    status,
  }).returning('*');

  if (request.status === PENDING_EMAIL_VERIFICATION) {
    sendRequestAuthenticationEmail(request);
  }

  res.status(200).json({ success: true, request });
};

const cancelRequest = async (req, res) => {
  const { id } = req.params;

  await transaction(knex, async (trx) => {
    const request = await InvestmentFundRequest.query(trx)
      .eager('investmentFund')
      .where({ id, userId: req.user.id })
      .forUpdate()
      .first();

    const { userId } = request;
    if (!request) {
      return res.status(404).json({ success: false, message: 'Investment fund request not found' });
    }

    if (!request.isCancelable) {
      throw new CannotCancelRequest();
    }

    const { currencyCode } = request.investmentFund;
    const balance = await Balance.query(trx)
      .eager('currency')
      .where({ userId, currencyCode })
      .first();

    assert(balance, 'Balance not found');
    const { CANCELED } = InvestmentFundRequest.statuses;
    return Promise.all([
      request.refundable && balance.add(request.requestAmount, trx),
      request.$query(trx).update({ status: CANCELED, refunded: request.refundable }),
    ]);
  });

  return res.status(200).json({ success: true });
};

const patchInvestmentFundRequest = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const investmentFund = await InvestmentFund
    .query()
    .joinRelation('requests')
    .where('requests.id', id)
    .where({ creatorId: req.user.id })
    .eager('[requests.user.balances.currency,shares,currency]')
    .modifyEager('requests', qb => qb.where('id', id))
    .first();

  if (!investmentFund || investmentFund.requests.length === 0) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }

  const [fundRequest] = investmentFund.requests.filter(r => r.id === id);
  if (fundRequest.isLocked) {
    throw new CannotPatchRequest();
  }

  const { APPROVED, DECLINED } = InvestmentFundRequest.statuses;
  if (fundRequest.type === 'subscription' && status === APPROVED) {
    await investmentFund.approveSubscription(fundRequest);
  } else if (fundRequest.type === 'subscription' && status === DECLINED) {
    await investmentFund.declineSubscription(fundRequest);
  } else if (fundRequest.type === 'redemption' && status === APPROVED) {
    await investmentFund.approveRedemption(fundRequest);
  } else if (fundRequest.type === 'redemption' && status === DECLINED) {
    await investmentFund.declineRedemption(fundRequest);
  } else {
    throw new Error('Unknown investment fund request operation');
  }

  return res.status(200).json({ success: true });
};

const activateRequest = async (req, res) => {
  const { authenticationToken } = req.params;
  const { PENDING_EMAIL_VERIFICATION, PENDING } = InvestmentFundRequest.statuses;
  const request = await InvestmentFundRequest.query().where({
    userId: req.user.id,
    authenticationToken,
    status: PENDING_EMAIL_VERIFICATION,
  });
  
  if (!request) {
    return res.status(404).json({ success: false, message: 'Request not found' });
  }
  
  await request.$query().update({ status: PENDING });
  
  return res.status(200).json({ success: true });
};

const fetchRequests = async (req, res) => {
  const { investmentFundId } = req.query;
  const requests = await InvestmentFundRequest.query()
    .eager('investmentFund')
    .where('userId', req.user.id)
    .skipUndefined()
    .where({ investmentFundId })
    .orderBy('createdAt', 'desc');

  return res.status(200).json({ success: true, requests });
};

const fetchAllRequests = async (req, res) => {
  const { investmentFundId } = req.query;
  const requests = await InvestmentFundRequest.query()
    .skipUndefined()
    .where({ investmentFundId })
    .eager('[investmentFund, user]')
    .orderBy('createdAt', 'desc');

  return res.status(200).json({ success: true, requests });
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
  fetchRequests,
  fetchAllRequests,
  patchInvestmentFundRequest: [validate(patchInvestmentFundRequestSchema), patchInvestmentFundRequest],
  updateInvestmentFund,
  createInvestmentFund,
  fetchBalanceUpdates,
  cancelRequest,
  activateRequest: [authenticateResource, activateRequest],
};
