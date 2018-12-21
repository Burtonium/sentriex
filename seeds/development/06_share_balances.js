exports.seed = async knex => knex('investment_fund_share_balances').insert([{
  userId: 2,
  amount: 10,
  investmentFundId: 0,
  createdAt: knex.fn.now(),
  updatedAt: knex.fn.now(),
}]);