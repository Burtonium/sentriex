exports.up = knex => knex.schema.createTable('user_addresses', (table) => {
  table.bigIncrements().primary();
  table.bigInteger('user_id').unsigned().references('id').inTable('users')
    .onDelete('CASCADE');
  table.string('currency_code', 10)
    .notNullable()
    .references('code')
    .inTable('currencies')
    .onUpdate('CASCADE')
    .onDelete('CASCADE')
    .index();
  table.string('address').notNullable().index();
  table.unique(['currency_code', 'address']);
  table.jsonb('data');
  table.timestamp('created_at').defaultTo(knex.fn.now()).index();
});

exports.down = knex => knex.schema.dropTableIfExists('user_addresses');
