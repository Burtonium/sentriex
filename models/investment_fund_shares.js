const { Model } = require('../database/index');

class InvestmentFundShares extends Model {
  static get tableName() {
    return 'investment_fund_share_balances';
  }

  static get timestamp() {
    return true;
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
