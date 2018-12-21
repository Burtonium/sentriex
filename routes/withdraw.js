const { transaction } = require('objection');
const validate = require('celebrate').celebrate;
const Mailer = require('./mailer');
const Withdrawal = require('../models/withdrawal');
const Balance = require('../models/balance');
const User = require('../models/user');
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

const sendWithdrawalAuthenticationEmail = async withdrawal => {
  const { id, authenticationToken, amount, userId, currencyCode } = withdrawal;
  const [user, currency] = await Promise.all([
    withdrawal.user || User.query().where('id', userId).first(),
    withdrawal.currency || Currency.query().where('code', currencyCode).first(),
  ]);
  const { email } = user;
  const formattedAmount = currency.format(amount);
  const url = `${process.env.SITE_URL}/withdrawals/${id}/activate/${authenticationToken}`;
  const msg = {
    to: email,
    from: process.env.NOREPLY_EMAIL,
    subject: 'User Activation',
    text: `Please verify your withdrawal of ${formattedAmount} by clicking
           the following link: ${url}`,
  };

  Mailer.send(msg);
};

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
  
  let withdrawal;
  await transaction(knex, async (trx) => {
    [withdrawal] = await Promise.all([
      Withdrawal.query(trx).context({ createFees: true }).insert({
        currencyCode,
        userId: req.user.id,
        status,
        amount,
        address,
      }).returning('*'),
      balance.remove(amount, trx),
    ]);
  });

  if (status === PENDING_EMAIL_VERIFICATION) {
    sendWithdrawalAuthenticationEmail(withdrawal);
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
      .where({ userId, id })
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
    const result = await withdrawal.$query(trx)
      .context({ refundFees: true })
      .update({ status: Withdrawal.statuses.CANCELED, refunded: true })
      .returning('*');
    await balance.add(result.amount, trx);
  });

  return res.status(200).json({ success: true, message: 'Canceled transfer request' });
};

const patch = async (req, res) => {
  const { id } = req.params;
  const { status, txId } = req.body;
  
  const withdrawal = await Withdrawal.query().where({ id }).first();
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
    
    await Promise.all([
      withdrawal.$query(trx)
        .context({ refundFees: refundUser })
        .skipUndefined().update({ 
          status,
          txId,
          refunded: refundUser || undefined,
        }),
      refundUser && balance.add(withdrawal.amount, trx),
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