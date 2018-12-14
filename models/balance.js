const assert = require('assert');
const BigNumber = require('bignumber.js');
const { Model } = require('../database/index');

class Balance extends Model {
  static get tableName() {
    return 'balances';
  }

  async add(amount, trx) {
    assert.ok(this.currency, 'Balance.add() requires currency precision');
    this.amount = this.currency.toFixed(BigNumber(this.amount).plus(amount));
    return Balance.query(trx).forUpdate().where('id', this.id).update({ amount: this.amount });
  }

  async remove(amount, trx) {
    assert.ok(this.currency, 'Balance.add() requires currency precision');
    assert.ok(BigNumber(amount).isLessThanOrEqualTo(this.amount), `Trying to remove ${amount} from ${this.amount} of ${this.currencyCode}`);
    this.amount = this.currency.toFixed(BigNumber(this.amount).minus(amount));
    return Balance.query(trx).forUpdate().where('id', this.id).update({ amount: this.amount });
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/user`,
        join: {
          from: 'balances.userId',
          to: 'users.id',
        },
      },
      currency: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/currency`,
        join: {
          from: 'balances.currencyCode',
          to: 'currencies.code',
        },
      },
    };
  }
}

module.exports = Balance;
