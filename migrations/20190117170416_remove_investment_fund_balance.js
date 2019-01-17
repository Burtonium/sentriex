exports.up = knex => knex.schema.table('investment_funds', (table) => {
  table.dropColumn('balance');
});

exports.down = knex => knex.schema.table('investment_funds', (table) => {
  table.decimal('balance', 30, 15).defaultTo(0).notNullable();
});
