const { pick } = require('lodash');
const InvestmentFund = require('../models/investment_fund');
const InvestmentFundBalanceUpdates = require('../models/investment_fund_balance_update');
const { formatDate } = require('../utils');
const { knex } = require('../database');
const { fork } = require('child_process');


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
  const investmentFund = await InvestmentFund.query()
    .joinEager('balanceUpdates')
    .where({ investmentFundId })
    .orderBy('sharePriceDate', 'asc')
    .first();

  if (!investmentFund) {
    return res.status(404).json({ success: false });
  }
  const { balanceUpdates } = investmentFund;

  const { userRedeemProfitPercent } = await knex('investmentFundSettings').first();
  const updates = balanceUpdates
    .map(bu => {
      return [
        bu.sharePriceDate,
        (((parseFloat(bu.updatedSharePrice) - 1) * 100) * userRedeemProfitPercent).toFixed(2),
      ];
    });

  updates.unshift([formatDate(investmentFund.createdAt), 0]);
  return res.status(200).json({
    success: true,
    investmentFundTrendData: updates,
  });
};

const runAprUpdate = (req, res) => {
  const { id } = req.params;
  const task = fork(`${__dirname}/../scripts/daily_apr_fund_update.js`, [id]);

  task.on('exit', () => {
    res.status(200).json({ success: true });
  });
  task.on('error', () => {
    res.status(500).json({ success: false })
  })

  setTimeout(() => {
    task.kill();
  }, 10000);
};

module.exports = {
  createBalanceUpdate,
  fetchBalanceUpdates,
  patchBalanceUpdate,
  deleteBalanceUpdate,
  fetchTrendData,
  runAprUpdate,
}
