exports.seed = async (knex) => knex('investment_funds').insert([{
  creatorId: 1,
  currencyCode: 'BTC',
  balance: 0,
  name: 'Super Investment Fund',
  shortDescription: 'This is a super investment fund guaranteed to triple your money in 1 month',
}, {
  creatorId: 1,
  currencyCode: 'BTC',
  balance: 0,
  name: 'Ok Investment Fund',
  shortDescription: 'Maybe a bit of money, maybe not. Who knows.',
}, {
  creatorId: 1,
  currencyCode: 'BTC',
  balance: 0,
  name: 'Lame Investment Fund',
  shortDescription: 'Investing in this one means you will lose your money',
}, {
  creatorId: 1,
  currencyCode: 'BTC',
  balance: 0,
  name: 'Rainy day fund',
  shortDescription: 'We make money on rainy days for some reason. Join now.',
}, {
  creatorId: 1,
  currencyCode: 'BTC',
  balance: 0,
  name: 'Rapper Fund',
  shortDescription: 'Fund investing in local soundcloud rappers',
}]);