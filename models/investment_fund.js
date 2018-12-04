const { Model } = require('../database/index');
const BigNumber = require('bignumber.js');
const assert = require('assert');

class InvestmentFund extends Model {
  static get tableName() {
    return 'investment_funds';
  }

  static get timestamp() {
    return true;
  }
  
  async getSharePrice() {
    assert.ok(this.shareBalances && this.currency, 'Currency and share balances have to be eager loaded');
    const shares = this.shareBalances.reduce((acc, cur) => acc.plus(cur.amount), new BigNumber(0));
    return shares.dividedBy(this.balance).toFixed(this.currency.precision);
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
      shareBalances: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/investment_fund_shares`,
        join: {
          from: 'investment_funds.id',
          to: 'investment_fund_share_balances.investmentFundId',
        },
      },
    };
  }
}

module.exports = InvestmentFund;
