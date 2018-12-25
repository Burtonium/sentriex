exports.seed = async knex => {
  return knex('investment_fund_settings').insert({
    id: 1,
    fundManagerRedeemProfitPercent: 0.3,
    siteRedeemProfitPercent: 0.1,
    userRedeemProfitPercent: 0.6,
    referralRedeemProfitPercent: 0.01,
    withdrawalFeeRate: 0.01,
  });
};