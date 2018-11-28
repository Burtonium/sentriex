exports.up = knex => knex.schema.createTable('balances', (table) => {
  table.bigIncrements().primary();
  table.bigInteger('user_id').unsigned().references('id').inTable('users')
    .onDelete('CASCADE');
  table.string('currency_code', 10).references('code').inTable('currencies').onUpdate('CASCADE')
    .onDelete('CASCADE')
    .index();
  table.decimal('amount', 30, 15).notNullable();
  table.unique(['userId', 'currency_code']);
});

exports.down = knex => knex.schema.dropTableIfExists('balances');
