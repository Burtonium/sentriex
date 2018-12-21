const { Model } = require('../database/index');

class Fees extends Model {
  static get tableName() {
    return 'fees';
  }

  static get timestamp() {
    return true;
  }
  
  static get relationMappings() {
    return {
      withdrawal: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/withdrawal`,
        join: {
          from: 'withdrawals.id',
          to: 'fees.withdrawal_id',
        },
      },
      investmentFundRequest: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/investment_fund_request`,
        join: {
          from: 'investment_fund_requests.id',
          to: 'fees.investment_fund_request_id',
        },
      }
    };
  }
}

module.exports = Fees;
