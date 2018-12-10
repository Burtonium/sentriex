const { Model } = require('../database/index');

class UserAddress extends Model {
  static get tableName() {
    return 'user_addresses';
  }

  static get timestamp() {
    return {
      create: true,
    };
  }

  static get idColumn() {
    return 'id';
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/user`,
        join: {
          from: 'user_addresses.userId',
          to: 'users.id',
        },
      },
      currency: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/currency`,
        join: {
          from: 'user_addresses.currencyCode',
          to: 'currencies.code',
        }
      }
    };
  }
}

module.exports = UserAddress;
