exports.seed = async knex => knex('investment_fund_share_balances').insert([{
  userId: 3,
  amount: 10,
  investmentFundId: 1,
  createdAt: knex.fn.now(),
  updatedAt: knex.fn.now(),
}]);