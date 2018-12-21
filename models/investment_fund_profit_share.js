const { Model } = require('../database/index');

class InvestmentFundProfitShare extends Model {
  static get tableName() {
    return 'investment_fund_profit_shares';
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
          to: 'investment_fund_profit_shares.investmentFundId',
        },
      },
    };
  }
}

module.exports = InvestmentFundProfitShare;
