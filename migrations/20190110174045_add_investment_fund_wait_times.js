exports.up = knex => knex.schema.table('investment_funds', (table) => {
  table.bigInteger('redemption_wait_time');
});

exports.down = knex => knex.schema.table('investment_funds', (table) => {
  table.dropColumn('redemption_wait_time');
});
