const { Model } = require('../database/index');

class Withdrawal extends Model {
  static get tableName() {
    return 'withdrawals';
  }

  static get timestamp() {
    return true;
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
