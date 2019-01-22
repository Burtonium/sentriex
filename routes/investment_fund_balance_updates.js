const { pick } = require('lodash');
const InvestmentFund = require('../models/investment_fund');
const InvestmentFundBalanceUpdates = require('../models/investment_fund_balance_update');
const { formatDate } = require('../utils');
const { knex } = require('../database');

const createBalanceUpdate = async (req, res) => {
  const { id } = req.params;
  const { updatedSharePrice, sharePriceDate, reportedAssetsUnderManagement } = req.body;

  const date = req.user.admin && sharePriceDate ? sharePriceDate : formatDate(new Date());

  const investmentFund = await InvestmentFund.query()
    .where('InvestmentFunds.id', id)
    .eager('[shares,balanceUpdates]')
    .modifyEager('balanceUpdates', qb => qb.where('sharePriceDate', date))
    .skipUndefined()
    .where({
      managedBy: req.user.admin ? undefined : req.user.id,
    })
    .first();

  if (!investmentFund) {
    return res.status(404).json({ success: false, message: 'Investment fund not found' });
  }

  if (!investmentFund.shareCount) {
    return res.status(400).json({ success: false, message: 'Initial investment required' });
  }

  if (investmentFund.balanceUpdates.length === 1) {
    const update = investmentFund.balanceUpdates[0];
    await update.$query().update({
      updatedSharePrice,
      reportedAssetsUnderManagement,
    });
  } else {
    await investmentFund.$relatedQuery('balanceUpdates').insert({
      updatedSharePrice,
      sharePriceDate: date,
      reportedAssetsUnderManagement,
    });
  }

  return res.status(200).json({ success: true });
};

const fetchBalanceUpdates = async (req, res) => {
  const { id } = req.params;
  const investmentFund = await InvestmentFund.query()
    .eager('balanceUpdates')
    .modifyEager(qb => qb.orderBy('sharePriceDate', 'asc'))
    .where({
      id,
    }).first();

  if (!investmentFund) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }

  res.status(200).json({
    success: true,
    balanceUpdates: investmentFund.balanceUpdates
  });
};

const patchBalanceUpdate = async (req, res) => {
  const { id } = req.params;
  const balanceUpdate = await InvestmentFundBalanceUpdates.query()
    .where({ id })
    .first();

  await balanceUpdate.$query().update(pick(req.body, [
    'updatedSharePrice',
    'sharePriceDate',
    'reportedAssetsUnderManagement'
  ]));

  return res.status(200).json({ success: true });
}

const deleteBalanceUpdate = async (req, res) => {
  const { id } = req.params;
  await InvestmentFundBalanceUpdates.query().where({ id }).del();
  return res.status(200).json({ success: true });
}


const fetchTrendData = async (req, res) => {
  const investmentFundId = req.params.id;
  const balanceUpdates = await InvestmentFundBalanceUpdates.query()
    .where({ investmentFundId })
    .orderBy('sharePriceDate', 'asc');

  const { userRedeemProfitPercent } = await knex('investmentFundSettings').first();
  const updates = balanceUpdates
    .map(bu => {
      return [
        bu.sharePriceDate,
        (((parseFloat(bu.updatedSharePrice) - 1) * 100) * userRedeemProfitPercent).toFixed(2),
      ];
    });

  return res.status(200).json({
    success: true,
    investmentFundTrendData: updates,
  });
};

module.exports = {
  createBalanceUpdate,
  fetchBalanceUpdates,
  patchBalanceUpdate,
  deleteBalanceUpdate,
  fetchTrendData,
}
