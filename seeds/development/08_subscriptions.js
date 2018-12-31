const { daysAgo } = require('../../utils');

exports.seed = async knex => knex('investment_fund_requests').insert([{
  userId: 3,
  investmentFundId: 1,
  type:'subscription',
  status: 'approved',
  amount: 5,
  shares: 4.54545454545,
  sharePrice: 1.1,
  createdAt: daysAgo(42),
  updatedAt: daysAgo(42),
}, {
  userId: 3,
  investmentFundId: 1,
  type:'subscription',
  status: 'approved',
  amount: 5,
  shares: 2.90697674419,
  sharePrice: 1.72,
  createdAt: daysAgo(5),
  updatedAt: daysAgo(5),
}]);
