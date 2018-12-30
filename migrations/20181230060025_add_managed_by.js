exports.up = knex => knex.schema.table('investment_funds', (table) => {
  table.bigInteger('managed_by')
    .unsigned()
    .references('id')
    .inTable('users')
    .onDelete('CASCADE')
    .after('currency_code')
    .index();
});

exports.down = knex => knex.schema.table('investment_funds', (table) => {
  table.dropColumn('managed_by');
});
