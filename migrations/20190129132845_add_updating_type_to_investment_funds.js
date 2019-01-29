exports.up = knex => knex.schema.table('investment_funds', (table) => {
  table.enum('balance_update_strategy', ['manual', 'apr'])
    .defaultTo('manual').notNullable().index();
  table.decimal('annual_percentage_rate', 5, 2);
});

exports.down = knex => knex.schema.table('investment_funds', (table) => {
  table.dropColumn('balance_update_strategy');
  table.dropColumn('annual_percentage_rate');
});
