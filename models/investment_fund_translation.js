const { Model } = require('../database/index');

class InvestmentFundTranslation extends Model {
  static get tableName() {
    return 'investment_fund_translations';
  }

  static get timestamp() {
    return false;
  }
  
  static get relationMappings() {
    return {
      investmentFund: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/investment_fund`,
        join: {
          from: 'investment_funds.id',
          to: 'investment_fund_translations.investmentFundId',
        },
      },
    };
  }
}

module.exports = InvestmentFundTranslation;
