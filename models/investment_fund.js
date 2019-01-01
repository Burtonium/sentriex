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
    return ['sharePrice', 'shareCount', 'monthlyPerformance'];
  }

  get sharePrice() {
    let price = null;
    if (!this.shares) {
      return price;
    }
    if (parseFloat(this.balance) === 0 || this.shareCount === null || this.shareCount.isEqualTo(0)) {
      return 1;
    }
    return new BigNumber(this.balance).dividedBy(this.shareCount).toString();
  }

  get shareCount() {
    const s = this.shares;
    return s ? s.reduce((acc, cur) => acc.plus(cur.amount), new BigNumber(0)) : null;
  }

  get monthlyPerformance() {
    const b = this.balanceUpdates;
    if (!b) {
      return null;
    }

    const updates = b.filter(u => daysBetween(u.createdAt, new Date()) < 30);

    let performance = 0;
    if (updates.length) {
      const firstPrice = parseFloat(updates[0].previousSharePrice);
      const lastPrice = parseFloat(updates[updates.length - 1].updatedSharePrice);
      performance = percentDifference(firstPrice, lastPrice);
    }
    return performance;
  }

  async add(amount, trx) {
    assert.ok(this.currency, 'Balance.add() requires currency precision');
    this.balance = this.currency.toFixed(BigNumber(this.balance).plus(amount));
    return this.$query(trx).forUpdate().update({ balance: this.balance });
  }

  async remove(amount, trx) {
    assert.ok(this.currency, 'Balance.add() requires currency precision');
    assert.ok(BigNumber(amount).isLessThanOrEqualTo(this.balance), `Trying to remove ${amount} from ${this.balance} of investmentFund:${this.id}`);
    this.balance = this.currency.toFixed(BigNumber(this.balance).minus(amount));
    return this.$query(trx).forUpdate().update({ balance: this.balance });
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
        this.add(amount, trx),
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

  async approveRedemption(investmentFundRequest) {
    assert.ok(this.shares, 'Shares must be eager loaded');
    let amount = investmentFundRequest.amount;
    const sharePrice = this.sharePrice;
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

    const { APPROVED } = InvestmentFundRequest.statuses;
    const { SUBSCRIPTION } = InvestmentFundRequest.types;

    // calculate profit
    const userId = investmentFundRequest.user.id;
    const userSubscriptions = await InvestmentFundRequest.query().where({
      type: SUBSCRIPTION,
      status: APPROVED,
      refunded: false,
      userId,
    }).orderBy('createdAt', 'desc');

    let remaining = new BigNumber(userShareBalance.amount);
    let sharesProfit = new BigNumber(0);
    userSubscriptions.every(s => {
      assert(s.shares, 'Subscriptions need to have shares recorded');
      const unredeemedShares = remaining.isGreaterThan(s.shares) ? remaining.minus(s.shares) : new BigNumber(s.shares);
      const profitPercent = percentDifference(s.sharePrice, sharePrice);
      sharesProfit = sharesProfit.plus(unredeemedShares.times(profitPercent / 100));
      remaining = remaining.minus(s.shares);
      return remaining.isGreaterThan(0);
    });

    const totalProfitPercent = sharesProfit.dividedBy(userShareBalance.amount);
    let redeemProfitAmount = totalProfitPercent.times(amount);
    if (redeemProfitAmount.isLessThan(0)) {
      redeemProfitAmount = new BigNumber(0);
    }

    return transaction(knex, async (trx) => {
      const settings = await knex('investment_fund_settings').select().first();
      let sitesCutPercent = settings.siteRedeemProfitPercent;

      // Calculate and pay out referral cut
      const { referredBy } = investmentFundRequest.user;
      let referralCut = 0;
      if (referredBy) {
        const referralCutPercent = settings.referralRedeemProfitPercent;
        sitesCutPercent -= settings.referralRedeemProfitPercent;
        const referringUser = await User.query(trx)
          .where('id', referredBy)
          .eager('balances.currency')
          .first();

        if (referringUser) {
          referralCut = redeemProfitAmount.times(referralCutPercent).toString();
          await knex('referral_payments').transacting(trx).insert({
            payeeId: referringUser.id,
            referralId: userId,
            redemptionId: investmentFundRequest.id,
            amount: referralCut,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          const balance = referringUser.balances.find(b => b.currencyCode === this.currencyCode);
          await balance.add(referralCut, trx);
        }
      }
      const sitesCut = redeemProfitAmount.times(sitesCutPercent).toString();
      const managersCut = redeemProfitAmount.times(settings.fundManagerRedeemProfitPercent).toString();
      const amountMinusFees = amount.minus(managersCut).minus(sitesCut).minus(referralCut).toString();

      await investmentFundRequest.$query(trx)
        .context({
          createFees: true,
          feeAmountOverride: sitesCut.toString(),
        })
        .update({ amount: amountMinusFees, status: APPROVED });

      const managersBalance = await Balance.query().eager('currency').where({
          userId: this.creatorId,
          currencyCode: this.currencyCode,
        }).first();

      return Promise.all([
        this.$relatedQuery('profitShares', trx).insert({
          amount: managersCut,
          userId: investmentFundRequest.userId,
          investmentFundRequestId: investmentFundRequest.id,
        }),
        managersBalance.add(managersCut, trx),
        userShareBalance.remove(shareAmount.toString(), trx),
        balance.add(amountMinusFees.toString(), trx),
        this.remove(amount.toString(), trx),
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
