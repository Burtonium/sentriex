const { Model } = require('../database/index');

class InvestmentFundBalanceUpdate extends Model {
  static get tableName() {
    return 'investment_fund_balance_updates';
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
          to: 'investment_fund_balance_updates.investmentFundId',
        },
      },
    };
  }
}

module.exports = InvestmentFundBalanceUpdate;
