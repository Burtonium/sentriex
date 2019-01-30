const { flatten } = require('lodash');

const users = [{
  userId: 1,
}, {
  userId: 2,
}, {
  userId: 3,
}, {
  userId: 4,
}];

const currencies = ['BTC', 'LTC', 'ETH', 'XRP', 'CAD'];

const balances = flatten(currencies.map(c => users.map(b => ({
  ...b,
  currencyCode: c,
  amount: 40
}))));

exports.seed = async (knex) => knex('balances').insert(balances);
