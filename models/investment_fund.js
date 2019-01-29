const { Model } = require('../database/index');
const BigNumber = require('bignumber.js');
const assert = require('assert');
const { daysBetween, percentDifference } = require('../utils');
const { transaction } = require('objection');
const { knex } = require('../database');
const InvestmentFundRequest = require('./investment_fund_request');
const Balance = require('./balance');
const User = require('./user');

class InvestmentFund extends Model {
  static get tableName() {
    return 'investment_funds';
  }

  static get timestamp() {
    return true;
  }

  static get virtualAttributes() {
    return ['sharePrice', 'shareCount', 'monthlyPerformance', 'performance', 'balance'];
  }

  get sharePrice() {
    const bu = this.balanceUpdates;
    if (!bu || bu.length === 0) {
      return 1;
    }
    bu.sort((a, b) => new Date(a.sharePriceDate) - new Date(b.sharePriceDate));
    return bu[bu.length - 1].updatedSharePrice;
  }

  get shareCount() {
    const s = this.shares;
    if (!s || s.length === 0) {
      return 0;
    }
    return s ? s.reduce((acc, cur) => acc.plus(cur.amount), new BigNumber(0)) : null;
  }

  get balance() {
    return new BigNumber(this.sharePrice).times(this.shareCount).toString();
  }

  get performance() {
    const b = this.balanceUpdates;
    if (!b) {
      return null;
    }

    const updates = b;

    let performance = new BigNumber(0);
    if (updates.length) {
      const firstPrice = parseFloat(0);
      const lastPrice = parseFloat(updates[updates.length - 1].updatedSharePrice);
      performance = percentDifference(firstPrice, lastPrice);
    }
    return performance.times(100).toFixed(2);
  }

  get monthlyPerformance() {
    const b = this.balanceUpdates;
    if (!b) {
      return null;
    }

    const updates = b.filter(u => daysBetween(new Date(u.sharePriceDate), new Date()) <= 30);

    let performance = new BigNumber(0);
    if (updates.length) {
      const firstPrice = parseFloat(0);
      const lastPrice = parseFloat(updates[updates.length - 1].updatedSharePrice);
      performance = percentDifference(firstPrice, lastPrice);
    }
    return performance.times(100).toFixed(2);
  }

  async approveSubscription(investmentFundRequest) {
    assert.ok(this.shares, 'Shares must be eager loaded');
    const { userId } = investmentFundRequest;
    const amount = investmentFundRequest.amount;

    let shareBalance = this.shares && this.shares.find(sb => sb.userId === userId);
    if (!shareBalance) {
      shareBalance = await this.$relatedQuery('shares').insert({
        userId,
        amount: 0
      });
    }

    const shareAmount = (new BigNumber(amount)).dividedBy(this.sharePrice);

    assert.ok(shareAmount.isGreaterThan(0), 'Invalid amount of shares bought');

    const { APPROVED } = InvestmentFundRequest.statuses;
    return transaction(knex, async (trx) => {
      return Promise.all([
        investmentFundRequest.$query(trx).update({
          status: APPROVED,
          shares: shareAmount.toString(),
          sharePrice: this.sharePrice,
        }),
        shareBalance.add(shareAmount.toString(), trx),
      ]);
    });
  }

  async declineSubscription(investmentFundRequest) {
    assert.ok(investmentFundRequest &&
      investmentFundRequest.user &&
      investmentFundRequest.user.balances, 'User balances required');
    const balance = investmentFundRequest.user.balances.find(b => b.currencyCode === this.currencyCode);
    assert.ok(balance, 'User balance not found');

    const { DECLINED } = InvestmentFundRequest.statuses;
    const amount = investmentFundRequest.amount;
    return transaction(knex, async (trx) => {
      return Promise.all([
        balance.add(amount, trx),
        investmentFundRequest.$query(trx).update({ status: DECLINED, refunded: true })
      ]);
    });
  }

  async calculateTotalProfitAmount(userId) {
    const userShareBalance = this.shares.find(s => s.userId === userId);

    const userSubscriptions = await this.$relatedQuery('requests').where({
      type: InvestmentFundRequest.types.SUBSCRIPTION,
      status: InvestmentFundRequest.statuses.APPROVED,
      refunded: false,
      userId,
    });

    let remainingShares = new BigNumber(userShareBalance.amount);
    let sharesInitialValue = new BigNumber(0);

    assert.ok(userSubscriptions.length > 0, 'User must have subbed to redeem');
    assert.ok(userShareBalance, 'User has no shares to redeem');

    userSubscriptions.every(s => {
      assert(s.shares, 'Subscriptions need to have shares recorded');
      const sharesToRedeem = remainingShares.isGreaterThan(s.shares) ? new BigNumber(s.shares) : remainingShares;
      sharesInitialValue = sharesInitialValue.plus(sharesToRedeem.times(s.sharePrice));
      remainingShares = remainingShares.minus(s.shares);
      return remainingShares.isGreaterThan(0);
    });

    const sharesCurrentValue = new BigNumber(userShareBalance.amount).times(this.sharePrice);
    return percentDifference(sharesInitialValue, sharesCurrentValue).times(sharesInitialValue);
  }

  async approveRedemption(investmentFundRequest) {
    assert.ok(this.shares, 'Shares must be eager loaded');
    let amount = investmentFundRequest.amount;
    const sharePrice = new BigNumber(this.sharePrice);
    let shareAmount = (new BigNumber(amount)).dividedBy(sharePrice);
    const userShareBalance = this.shares.find(s => s.userId === investmentFundRequest.userId);
    assert.ok(userShareBalance, 'User has no shares to redeem');
    if (!amount) {
      const percent = investmentFundRequest.requestPercent;
      assert.ok(percent, 'Both requestPercent and amount not found on request.');
      shareAmount = (new BigNumber(percent)).dividedBy(100).times(userShareBalance.amount);
      amount = shareAmount.times(sharePrice);
    } else {
      amount = new BigNumber(amount);
    }

    assert.ok(investmentFundRequest &&
      investmentFundRequest.user &&
      investmentFundRequest.user.balances, 'User balances required');

    const balance = investmentFundRequest.user.balances.find(b => b.currencyCode === this.currencyCode);
    assert.ok(balance, 'User balance not found');

    const totalProfitAmount = await this.calculateTotalProfitAmount(investmentFundRequest.user.id);
    assert.ok(!totalProfitAmount.isNaN(), 'Total profit calculated invalid');

    let redeemProfitAmount = totalProfitAmount.isGreaterThan(0) ?
      totalProfitAmount.times(amount).dividedBy(sharePrice.times(userShareBalance.amount)) :
      new BigNumber(0);

    return transaction(knex, async (trx) => {
      const settings = await knex('investment_fund_settings').select().first();
      const sitesCutPercent = settings.siteRedeemProfitPercent;
      const fundManagerCutPercent = settings.fundManagerRedeemProfitPercent;
      let referralCut = 0;
      // Calculate and pay out referral cut
      const { referredBy } = investmentFundRequest.user;
      if (referredBy) {
        const referralCutPercent = settings.referralRedeemProfitPercent;
        const referringUser = await User.query(trx)
          .where('id', referredBy)
          .eager('balances.currency')
          .first();

        if (referringUser) {
          referralCut = redeemProfitAmount.times(referralCutPercent).toString();
          await knex('referral_payments').transacting(trx).insert({
            payeeId: referringUser.id,
            referralId: investmentFundRequest.userId,
            redemptionId: investmentFundRequest.id,
            amount: referralCut,
            currencyCode: this.currencyCode,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          const balance = referringUser.balances.find(b => b.currencyCode === this.currencyCode);
          await balance.add(referralCut, trx);
        }
      }

      const sitesCut = redeemProfitAmount.times(sitesCutPercent).minus(referralCut).toString();
      const managersCut = redeemProfitAmount.times(fundManagerCutPercent).toString();
      const amountMinusFees = amount.minus(managersCut).minus(sitesCut).minus(referralCut).toString();

      const calculationCheck = new BigNumber(amountMinusFees)
        .plus(managersCut)
        .plus(sitesCut)
        .plus(referralCut)
        .isEqualTo(amount);

      assert.ok(calculationCheck, `All the cuts taken from profit dont equal original amount`);

      const managersBalance = await Balance.query().eager('currency').where({
          userId: this.creatorId,
          currencyCode: this.currencyCode,
        }).first();

      return Promise.all([
        investmentFundRequest.$query(trx)
          .update({ amount: amountMinusFees, status: InvestmentFundRequest.statuses.APPROVED }),
        investmentFundRequest.$relatedQuery('fees', trx).insert({ amount: sitesCut }),
        this.$relatedQuery('profitShares', trx).insert({
          amount: managersCut,
          userId: investmentFundRequest.userId,
          investmentFundRequestId: investmentFundRequest.id,
        }),
        managersBalance.add(managersCut, trx),
        userShareBalance.remove(shareAmount.toString(), trx),
        balance.add(amountMinusFees.toString(), trx),
      ]);
    });
  }

  declineRedemption(investmentFundRequest) {
    const { DECLINED } = InvestmentFundRequest.statuses;
    return investmentFundRequest.$query().update({ status: DECLINED });
  }

  static get relationMappings() {
    return {
      manager: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/user`,
        join: {
          from: 'investment_funds.managedBy',
          to: 'users.id',
        },
      },
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
      requests: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/investment_fund_request`,
        join: {
          from: 'investment_funds.id',
          to: 'investment_fund_requests.investmentFundId',
        },
      },
      profitShares: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/investment_fund_profit_share`,
        join: {
          from: 'investment_funds.id',
          to: 'investment_fund_profit_shares.investmentFundId',
        },
      }
    };
  }
}

module.exports = InvestmentFund;
