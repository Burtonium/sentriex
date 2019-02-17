const { knex } = require('../database');
const { transaction } = require('objection');
const { Model } = require('../database/index');
const Balance = require('./balance');

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

  async createDeposit({ txId, amount, data }) {
    return transaction(knex, async (trx) => {
      await this.$relatedQuery('deposits', trx).insert({
        currencyCode: this.currencyCode,
        txId,
        userId: this.userId,
        amount,
        data
      });

      const balance = await Balance.query(trx).joinEager('currency').where({
        userId: this.userId,
        currencyCode: this.currencyCode
      }).first();
      await balance.add(amount, trx);
    });
  }

  static get relationMappings() {
    return {
      deposits: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/deposit`,
        join: {
          from: 'user_addresses.id',
          to: 'deposits.userAddressId',
        },
      },
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
