const { Model } = require('../database/index');
const BigNumber = require('bignumber.js');
const { daysFromNow } = require('../utils');

class InvestmentFundRequest extends Model {
  static get tableName() {
    return 'investment_fund_requests';
  }

  static get virtualAttributes() {
    return ['isCancelable', 'isLocked', 'feeAmount', 'siteFees', 'profitShare', 'daysToWait'];
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
    return this.refunded || [APPROVED, DECLINED, CANCELED].includes(this.status);
  }

  get refundable() {
    return !this.refunded && this.type === InvestmentFundRequest.types.SUBSCRIPTION;
  }

  get daysToWait() {
    if (!this.investmentFund || !this.investmentFund.redemptionWaitTime) {
      return null;
    }

    const waitSeconds = this.investmentFund.redemptionWaitTime;
    const { REDEMPTION } = InvestmentFundRequest.types;
    const { PENDING } = InvestmentFundRequest.statuses;
    const daysToWait = waitSeconds / (24 * 60 * 60);
    return this.type === REDEMPTION &&
           this.status === PENDING &&
           Math.max(daysToWait - daysFromNow(this.createdAt), 0);
  }

  get feeAmount() {
    if (!this.fees || !this.profitShares) {
      return null;
    }
    const feeAmount = this.fees.reduce((acc, cur) => acc.plus(cur.amount), new BigNumber(0));
    const profitSharesTaken = this.profitShares.reduce((acc, cur) => acc.plus(cur.amount), new BigNumber(0));
    return feeAmount.plus(profitSharesTaken).toString();
  }

  get siteFees() {
    if (!this.fees) {
      return null;
    }
    const feeAmount = this.fees.reduce((acc, cur) => acc.plus(cur.amount), new BigNumber(0));
    return feeAmount.toString();
  }

  get profitShare() {
    if (!this.profitShares) {
      return null;
    }
    const profitSharesTaken = this.profitShares.reduce((acc, cur) => acc.plus(cur.amount), new BigNumber(0));
    return profitSharesTaken.toString();
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
      fees: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/fees`,
        join: {
          from: 'investment_fund_requests.id',
          to: 'fees.investment_fund_request_id',
        },
      },
      profitShares: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/investment_fund_profit_share`,
        join: {
          from: 'investment_fund_requests.id',
          to: 'investment_fund_profit_shares.investment_fund_request_id',
        },
      }
    };
  }
}

module.exports = InvestmentFundRequest;
