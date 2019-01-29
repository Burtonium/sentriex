const BigNumber = require('bignumber.js');
const InvestmentFund = require('../models/investment_fund');
const InvestmentFundBalanceUpdates = require('../models/investment_fund_balance_update');
const { formatDate, daysBetween, addDays } = require('../utils');
const now = new Date();
const today = new Date(formatDate(now));

(async () => {
  const fundsToUpdate = await InvestmentFund.query()
    .joinEager('[currency,manager,shares,balanceUpdates]')
    .modifyEager('balanceUpdates', qb => qb.orderBy('sharePriceDate', 'desc'))
    .where({ balanceUpdateStrategy: 'apr' });

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

      balanceUpdatesToInsert.push({
        investmentFundId: fund.id,
        updatedSharePrice: updatedSharePrice.toString(),
        sharePriceDate: formatDate(addDays(lastUpdateDate, i)),
      });
    }
  });

  return InvestmentFundBalanceUpdates.query().insert(balanceUpdatesToInsert);
})()
.catch((e) => console.error(e))
.finally(() => process.exit(0));
