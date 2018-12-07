const { Model } = require('../database/index');
const BigNumber = require('bignumber.js');
const assert = require('assert');

class InvestmentFundShares extends Model {
  static get tableName() {
    return 'investment_fund_share_balances';
  }

  static get timestamp() {
    return true;
  }
  
  async add(amount, trx) {
    this.amount = BigNumber(this.amount).plus(amount).toString();
    return this.$query(trx).update({ amount: this.amount });
  }

  async remove(amount, trx) {
    assert.ok(BigNumber(amount).isLessThanOrEqualTo(this.amount), `Trying to remove ${amount} from ${this.amount} of shares`);
    this.amount = BigNumber(this.amount).minus(amount).toString();
    return this.$query(trx).update({ amount: this.amount });
  }
  
  static get relationMappings() {
    return {
      investmentFund: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/investment_fund`,
        join: {
          from: 'investment_funds.id',
          to: 'investment_fund_share_balances.investmentFundId',
        },
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/user`,
        join: {
          from: 'users.id',
          to: 'investment_fund_share_balances.userId',
        },
      },
    };
  }
}

module.exports = InvestmentFundShares;
