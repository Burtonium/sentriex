const BigNumber = require('bignumber.js');
const InvestmentFund = require('../models/investment_fund');
const InvestmentFundBalanceUpdates = require('../models/investment_fund_balance_update');
const { formatDate, daysBetween, addDays } = require('../utils');
const now = new Date();
const today = new Date(formatDate(now));
const investmentFundId = process.argv[2];

(async () => {
  const fundsToUpdate = await InvestmentFund.query()
    .joinEager('[currency,manager,shares,balanceUpdates]')
    .modifyEager('balanceUpdates', qb => qb.orderBy('sharePriceDate', 'desc'))
    .where({ balanceUpdateStrategy: 'apr' })
    .skipUndefined()
    .where('investmentFunds.id', investmentFundId);

  const balanceUpdatesToInsert = [];

  fundsToUpdate.forEach(fund => {
    const { balanceUpdates, annualPercentageRate } = fund;
    const trueDailyApr = new BigNumber(annualPercentageRate).dividedBy(100).dividedBy(365.25);
    const initialBalance = {
      updatedSharePrice: 1,
      sharePriceDate: formatDate(fund.createdAt),
      reportedAssetsUnderManagement: 0,
    };

    const lastUpdate = balanceUpdates[0] || initialBalance;
    const lastUpdateDate = new Date(lastUpdate.sharePriceDate);
    const daysSinceLastUpdate = daysBetween(lastUpdateDate, today);
    for (let i = 1; i <= daysSinceLastUpdate; i++) {
      const updatedSharePrice = trueDailyApr.times(i).plus(1)
        .times(lastUpdate.updatedSharePrice);
      const aum = updatedSharePrice.times(fund.shareCount);

      balanceUpdatesToInsert.push({
        investmentFundId: fund.id,
        updatedSharePrice: updatedSharePrice.toString(),
        sharePriceDate: formatDate(addDays(lastUpdateDate, i)),
        reportedAssetsUnderManagement: aum.isNaN() ? null : aum.toString(),
      });
    }
  });

  return InvestmentFundBalanceUpdates.query().insert(balanceUpdatesToInsert);
})()
.catch((e) => {
  console.error(e);
  process.exitCode = 1;
})
.finally(() => process.exit());
