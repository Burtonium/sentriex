exports.seed = async (knex) => knex('investment_funds').insert([{
  id: 1,
  creatorId: 1,
  managedBy: 2,
  currencyCode: 'BTC',
  name: 'Super Investment Fund',
  shortDescription: 'This is a super investment fund guaranteed to triple your money in 1 month',
}, {
  id: 2,
  creatorId: 1,
  managedBy: 2,
  currencyCode: 'BTC',
  name: 'Ok Investment Fund',
  shortDescription: 'Maybe a bit of money, maybe not. Who knows.',
}, {
  id: 3,
  creatorId: 1,
  managedBy: 2,
  currencyCode: 'BTC',
  name: 'Lame Investment Fund',
  shortDescription: 'Investing in this one means you will lose your money',
}, {
  id: 4,
  creatorId: 1,
  currencyCode: 'BTC',
  name: 'Rainy day fund',
  shortDescription: 'We make money on rainy days for some reason. Join now.',
}, {
  id: 5,
  creatorId: 1,
  currencyCode: 'BTC',
  name: 'Rapper Fund',
  shortDescription: 'Fund investing in local soundcloud rappers',
}]).then(() => knex.raw('select setval(\'investment_funds_id_seq\', max(id)) from investment_funds'));
