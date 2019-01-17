const { daysAgo } = require('../../utils');
exports.seed = async knex => knex('investment_fund_balance_updates').insert([{
  investmentFundId: 1,
  updatedSharePrice: 1.1,
  sharePriceDate: daysAgo(45),
  createdAt: daysAgo(45),
  updatedAt: daysAgo(45),
},{
  investmentFundId: 1,
  updatedSharePrice: 1.3,
  sharePriceDate: daysAgo(40),
  createdAt: daysAgo(40),
  updatedAt: daysAgo(40),
},{
  investmentFundId: 1,
  updatedSharePrice: 1.14,
  sharePriceDate: daysAgo(27),
  createdAt: daysAgo(27),
  updatedAt: daysAgo(27),
},{
  investmentFundId: 1,
  updatedSharePrice: 1.52,
  sharePriceDate: daysAgo(17),
  createdAt: daysAgo(17),
  updatedAt: daysAgo(17),
},{
  investmentFundId: 1,
  updatedSharePrice: 1.72,
  sharePriceDate: daysAgo(15),
  createdAt: daysAgo(17),
  updatedAt: daysAgo(17),
}, {
  investmentFundId: 1,
  updatedSharePrice: 2.11,
  sharePriceDate: daysAgo(2),
  createdAt: daysAgo(2),
  updatedAt: daysAgo(2),
}]);
