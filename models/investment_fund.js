const { Model } = require('../database/index');
const BigNumber = require('bignumber.js');
const assert = require('assert');
const { daysBetween } = require('../utils');

class InvestmentFund extends Model {
  static get tableName() {
    return 'investment_funds';
  }

  static get timestamp() {
    return true;
  }
  
  static get virtualAttributes() {
    return ['sharePrice', 'shareCount', 'monthlyPerformance'];
  }
  
  get sharePrice() {
    let price = null;
    if (!this.shares) {
      return price;
    }
    if (parseFloat(this.balance) === 0 || this.shareCount === null || this.shareCount.isEqualTo(0)) {
      return 1;
    }
    return new BigNumber(this.balance).dividedBy(this.shareCount).toString();
  }
  
  get shareCount() {
    const s = this.shares;
    return s ? s.reduce((acc, cur) => acc.plus(cur.amount), new BigNumber(0)) : null;
  }
  
  get monthlyPerformance() {
    const b = this.balanceUpdates;
    if (!b) {
      return null;
    }
    
    const updates = b.filter(u => daysBetween(u.createdAt, new Date()) < 30);

    let performance = 0;
    if (updates.length) { 
      const firstPrice = parseFloat(updates[0].previousSharePrice);
      const lastPrice = parseFloat(updates[updates.length - 1].updatedSharePrice);
      performance = ((lastPrice - firstPrice) / firstPrice * 100).toFixed(2);
    }
    return performance;
  }
  
  async add(amount, trx) {
    assert.ok(this.currency, 'Balance.add() requires currency precision');
    this.balance = this.currency.toFixed(BigNumber(this.balance).plus(amount));
    return this.$query(trx).forUpdate().update({ balance: this.balance });
  }

  async remove(amount, trx) {
    assert.ok(this.currency, 'Balance.add() requires currency precision');
    assert.ok(BigNumber(amount).isLessThanOrEqualTo(this.balance), `Trying to remove ${amount} from ${this.balance} of investmentFund:${this.id}`);
    this.balance = this.currency.toFixed(BigNumber(this.balance).minus(amount));
    return this.$query(trx).forUpdate().update({ balance: this.balance });
  }

  static get relationMappings() {
    return {
      creator: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/user`,
        join: {
          from: 'investment_funds.creatorId',
          to: 'users.id',
        },
      },
      currency: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/currency`,
        join: {
          from: 'investment_funds.currencyCode',
          to: 'currencies.code',
        },
      },
      shares: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/investment_fund_shares`,
        join: {
          from: 'investment_funds.id',
          to: 'investment_fund_share_balances.investmentFundId',
        },
      },
      balanceUpdates: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/investment_fund_balance_update`,
        join: {
          from: 'investment_funds.id',
          to: 'investment_fund_balance_updates.investmentFundId',
        },
      },
    };
  }
}

module.exports = InvestmentFund;
