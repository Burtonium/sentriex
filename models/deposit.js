const { Model } = require('../database/index');

class Deposit extends Model {
  static get tableName() {
    return 'deposits';
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
          from: 'deposits.userId',
          to: 'users.id',
        },
      },
      currency: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/currency`,
        join: {
          from: 'deposits.currencyCode',
          to: 'currencies.code',
        },
      },
    };
  }
}

module.exports = Deposit;
