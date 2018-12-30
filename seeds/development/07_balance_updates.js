exports.seed = async knex => knex('investment_fund_balance_updates').insert([{
  investmentFundId: 1,
  previousBalance: 10,
  updatedBalance: 11,
  previousSharePrice: 1,
  updatedSharePrice: 1.1,
  createdAt: knex.fn.now(),
  updatedAt: knex.fn.now(),
}, {
  investmentFundId: 1,
  previousBalance: 11,
  updatedBalance: 12,
  previousSharePrice: 1.1,
  updatedSharePrice: 1.2,
  createdAt: knex.fn.now(),
  updatedAt: knex.fn.now(),
}]);