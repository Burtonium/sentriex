exports.up = knex => knex.schema.table('investment_fund_balance_updates', (table) => {
  table.decimal('reported_assets_under_management', 30, 15);
});

exports.down = knex => knex.schema.table('investment_fund_balance_updates', (table) => {
  table.dropColumn('reported_assets_under_management');
});
