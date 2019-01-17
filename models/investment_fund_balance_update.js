const { Model } = require('../database/index');
const { formatDate } = require('../utils');

class InvestmentFundBalanceUpdate extends Model {
  static get tableName() {
    return 'investment_fund_balance_updates';
  }

  static get timestamp() {
    return true;
  }

  $parseDatabaseJson(json) {
    // Remember to call the super class's implementation.
    json = super.$parseDatabaseJson(json);
    if (json.sharePriceDate) {
      json.sharePriceDate = formatDate(json.sharePriceDate);
    }
    return json;
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
