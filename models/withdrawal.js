const { Model, knex } = require('../database/index');
const BigNumber = require('bignumber.js');

class Withdrawal extends Model {
  static get tableName() {
    return 'withdrawals';
  }

  static get virtualAttributes() {
    return ['feeAmount'];
  }

  static get timestamp() {
    return true;
  }

  static get statuses() {
    return {
      PENDING: 'pending',
      PENDING_EMAIL_VERIFICATION: 'pending_email_verification',
      APPROVED: 'approved',
      DECLINED: 'declined',
      CANCELED: 'canceled',
    };
  }

  static get cancelableStatuses() {
    return [this.statuses.PENDING, this.statuses.PENDING_EMAIL_VERIFICATION];
  }

  get feeAmount() {
    if (!this.fees) {
      return null;
    }
    const feeAmount = this.fees.reduce((acc, cur) => acc.plus(cur.amount), new BigNumber(0));
    return feeAmount.toString();
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/user`,
        join: {
          from: 'withdrawals.userId',
          to: 'users.id',
        },
      },
      currency: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/currency`,
        join: {
          from: 'withdrawals.currencyCode',
          to: 'currencies.code',
        },
      },
      fees: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/fees`,
        join: {
          from: 'fees.withdrawal_id',
          to: 'withdrawals.id',
        },
      },
    };
  }
}

module.exports = Withdrawal;
