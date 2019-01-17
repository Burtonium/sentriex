exports.up = knex => knex.schema.table('investment_fund_balance_updates', (table) => {
  table.date('sharePriceDate').notNullable().unique();
  table.dropColumn('previous_share_price');
  table.dropColumn('previous_balance');
  table.dropColumn('updated_balance');
});

exports.down = knex => knex.schema.table('investment_fund_balance_updates', (table) => {
  table.decimal('previous_balance', 30, 15).notNullable();
  table.decimal('updated_balance', 30, 15).notNullable();
  table.decimal('previous_share_price', 30, 15).notNullable();
  table.dropColumn('sharePriceDate');
});
