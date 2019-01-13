const { transaction } = require('objection');
const validate = require('celebrate').celebrate;
const BigNumber = require('bignumber.js');
const { sendWithdrawalConfirmationEmail } = require('./emails');
const Withdrawal = require('../models/withdrawal');
const Balance = require('../models/balance');
const User = require('../models/user');
const Fees = require('../models/fees');
const Currency = require('../models/currency');
const { knex } = require('../database');
const withdrawalSchema = require('./validation/withdraw.schema');
const withdrawalUpdateSchema = require('./validation/admin_update_withdrawal.schema');
const assert = require('assert');
const { BadRequest } = require('./errors');

class CannotCancelWithdrawal extends BadRequest {
  get code() {
    return 48;
  }

  get message() {
    return 'Withdrawal is not cancelable';
  }
}

class InvalidAuthenticationToken extends BadRequest {
  get code() {
    return 49;
  }

  get message() {
    return 'Invalid authentication token';
  }
}

const fetchMyWithdrawals = async (req, res) => {
  const { currencyCode } = req.query;
  const withdrawals = await Withdrawal.query()
    .joinEager('[fees]')
    .where('userId', req.user.id)
    .skipUndefined()
    .andWhere('currencyCode', currencyCode);

  return res.status(200).json({ success: true, withdrawals });
};

const fetchWithdrawals = async (req, res) => {
  const { currencyCode } = req.query;
  const withdrawals = await Withdrawal.query()
    .joinEager('[fees,user]')
    .skipUndefined()
    .where({ currencyCode })
    .orderBy('createdAt', 'desc')
    .limit(20);

  return res.status(200).json({ success: true, withdrawals });
};

const create = async (req, res) => {
  const { currencyCode, address, amount } = req.body;
  const twofaEnabledAndVerified = req.user.twofa && req.twofaIsVerified;
  const { PENDING, PENDING_EMAIL_VERIFICATION } = Withdrawal.statuses;
  const status = twofaEnabledAndVerified ? PENDING : PENDING_EMAIL_VERIFICATION;
  const balance = await Balance.query()
    .eager('currency')
    .where({
      currencyCode,
      userId: req.user.id,
    }).first();
  assert(balance, 'Balance required');
  const { withdrawalFeeRate } = await knex('investmentFundSettings').select('withdrawalFeeRate').first();
  const amountWithFees = new BigNumber(amount);
  const feeAmount = amountWithFees.times(withdrawalFeeRate);
  const amountMinusFees = amountWithFees.minus(feeAmount);
  let withdrawal;
  await transaction(knex, async (trx) => {
    [withdrawal] = await Promise.all([
      Withdrawal.query(trx).insert({
        currencyCode,
        userId: req.user.id,
        status,
        amount: amountMinusFees.toString(),
        address,
      }).returning('*'),
      balance.remove(amount, trx),
    ]);
    await withdrawal.$relatedQuery('fees', trx).insert({ amount: feeAmount.toString() });
  });

  if (status === PENDING_EMAIL_VERIFICATION) {
    const [ user, currency ] = await Promise.all([
      withdrawal.$relatedQuery('user'),
      withdrawal.$relatedQuery('currency'),
    ]);
    sendWithdrawalConfirmationEmail({ withdrawal, user, currency });
  }

  return res.status(200).json({ success: true, withdrawal });
};

const verifyEmail = async (req, res) => {
  const { id, authenticationToken } = req.params;
  const withdrawal = await Withdrawal.query().where({
    status: Withdrawal.statuses.PENDING_EMAIL_VERIFICATION,
    authenticationToken,
    id,
  });

  if (!withdrawal) {
    throw new InvalidAuthenticationToken();
  }
  return res.status(200).json({ success: true });
};

const cancel = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  let withdrawal;
  await transaction(knex, async (trx) => {
    withdrawal = await Withdrawal.query(trx)
      .joinEager('fees')
      .where({ userId, withdrawalId: id })
      .first()
      .forUpdate();

    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    if (!Withdrawal.cancelableStatuses.includes(withdrawal.status)) {
      throw new CannotCancelWithdrawal();
    }

    const { currencyCode } = withdrawal;
    const balance = await Balance.query(trx)
      .eager('currency')
      .where({ userId, currencyCode })
      .first();

    assert(balance, 'Balance not found');

    const amountWithFees = BigNumber(withdrawal.amount).plus(withdrawal.feeAmount).toString();
    const result = await Promise.all([
      withdrawal.$query(trx)
        .update({ amount: amountWithFees, status: Withdrawal.statuses.CANCELED, refunded: true })
        .returning('*'),
      withdrawal.$relatedQuery('fees', trx).del(),
    ]);
    await balance.add(amountWithFees, trx);
  });

  return res.status(200).json({ success: true, message: 'Canceled transfer request' });
};

const patch = async (req, res) => {
  const { id } = req.params;
  const { status, txId } = req.body;

  const withdrawal = await Withdrawal.query().joinEager('fees').where({ withdrawalId: id }).first();
  if (!withdrawal) {
    return res.status(404).json({ success: false, message: 'Withdrawal not found' });
  }

  await transaction(knex, async (trx) => {
    const { CANCELED, DECLINED } = Withdrawal.statuses;
    const refundUser = !withdrawal.refunded && (status === CANCELED || status === DECLINED);

    const { currencyCode } = withdrawal;
    const balance = refundUser && await Balance.query(trx)
      .eager('currency')
      .where({ userId: withdrawal.userId, currencyCode })
      .first();

    if (refundUser) {
      assert(balance, 'Balance required for refund');
    }

    const amountWithFees = BigNumber(withdrawal.amount).plus(withdrawal.feeAmount).toString();

    await Promise.all([
      withdrawal.$query(trx)
        .skipUndefined()
        .update({
          amount: refundUser ? amountWithFees : undefined,
          status,
          txId,
          refunded: refundUser || undefined,
        }),
      withdrawal.$relatedQuery('fees', trx).del(),
      refundUser && balance.add(amountWithFees, trx),
    ]);
  });

  return res.status(200).json({ success: true });
};

module.exports = {
  fetchMyWithdrawals,
  fetchWithdrawals,
  verifyEmail,
  create: [validate(withdrawalSchema), create],
  patch: [validate(withdrawalUpdateSchema), patch],
  cancel,
};
