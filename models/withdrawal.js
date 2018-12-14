const { Model } = require('../database/index');

class Withdrawal extends Model {
  static get tableName() {
    return 'withdrawals';
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
    };
  }
}

module.exports = Withdrawal;
