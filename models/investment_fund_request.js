const { Model } = require('../database/index');

class InvestmentFundRequest extends Model {
  static get tableName() {
    return 'investment_fund_requests';
  }

  static get virtualAttributes() {
    return ['isCancelable'];
  }

  static get timestamp() {
    return true;
  }

  static get types() {
    return {
      SUBSCRIPTION: 'subscription',
      REDEMPTION: 'redemption',
    };
  }

  static get statuses() {
    return {
      PENDING: 'pending',
      PENDING_EMAIL_VERIFICATION: 'pending_email_verification',
      APPROVED: 'approved',
      DECLINED: 'declined',
      CANCELED: 'canceled',
    };
  }

  static get cancelableStatuses() {
    return [this.statuses.PENDING, this.statuses.PENDING_EMAIL_VERIFICATION];
  }

  get isCancelable() {
    return InvestmentFundRequest.cancelableStatuses.includes(this.status);
  }

  get isLocked() {
    const { APPROVED, DECLINED, CANCELED } = InvestmentFundRequest.statuses;
    return [APPROVED, DECLINED, CANCELED].includes(this.status);
  }

  get refundable() {
    return !this.refunded && this.type === InvestmentFundRequest.types.SUBSCRIPTION;
  }

  static get relationMappings() {
    return {
      investmentFund: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/investment_fund`,
        join: {
          from: 'investment_funds.id',
          to: 'investment_fund_requests.investmentFundId',
        },
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/user`,
        join: {
          from: 'users.id',
          to: 'investment_fund_requests.userId',
        },
      },
    };
  }
}

module.exports = InvestmentFundRequest;
