const InvestmentFund = require('../models/investment_fund');
const InvestmentFundShares = require('../models/investment_fund_shares');

const fetchAll = async(req, res) => {
  const investmentFunds = await InvestmentFund.query().eager('[currency,creator]');
  return res.status(200).json({ investmentFunds });
};

const subscribeToFund = async (req, res) => {
  const { id } = req.params;
  const investmentFund = await InvestmentFund.query()
    .eager('[shareBalances,currency]')
    .where({ id })
    .first();

  if (!investmentFund) {
    return res.status(404).json({ success: false, message: 'Investment fund not found' });
  }
  
  let shareBalance = investmentFund.shareBalances && investmentFund.shareBalances.find(sb => sb.userId === req.user.id);
  if (!shareBalance) {
    shareBalance = investmentFund.$relatedQuery('shareBalances').insert({
      userId: req.user.id,
      amount: 0
    });
  }
  
  console.log(shareBalance);
  
  return res.status(200).json({ investmentFund });
};

const redeemFromFund = async (req, res) => {
  
};

const fetchShares = async (req, res) => {
  const investmentFundShares = await InvestmentFundShares.query().where('userId', req.user.id);
  return res.status(200).json({ investmentFundShares });
};

module.exports = {
  fetchAll,
  subscribeToFund,
  redeemFromFund,
  fetchShares,
};
