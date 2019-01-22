exports.up = knex => knex.schema.table('investment_fund_balance_updates', (table) => {
  table.dropUnique('sharePriceDate');
  table.unique(['sharePriceDate', 'investmentFundId']);
});

exports.down = knex => knex.schema.table('investment_fund_balance_updates', (table) => {
  table.dropUnique(['sharePriceDate', 'investmentFundId']);
  table.unique('sharePriceDate');
});
