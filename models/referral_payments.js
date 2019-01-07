const { Model } = require('../database/index');

class ReferralPayment extends Model {
  static get tableName() {
    return 'referral_payments';
  }

  static get timestamp() {
    return {
      create: true,
    };
  }

  static get relationMappings() {
    return {
      payee: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/user`,
        join: {
          from: 'referral_payments.payeeId',
          to: 'users.id',
        },
      },
      payer: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/user`,
        join: {
          from: 'referral_payments.referralId',
          to: 'users.id',
        }
      },
      currency: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/currency`,
        join: {
          from: 'referral_payments.currencyCode',
          to: 'currencies.code',
        },
      },
    };
  }
}

module.exports = ReferralPayment;
