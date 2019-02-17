exports.up = knex => knex.schema.createTable('crypto_servers', (table) => {
  table.bigIncrements().primary();
  table.string('currency_code', 10)
    .notNullable()
    .references('code')
    .inTable('currencies')
    .onUpdate('CASCADE')
    .onDelete('CASCADE')
    .unique();
  table.json('config');
  table.timestamps();
});

exports.down = knex => knex.schema.dropTableIfExists('crypto_servers');
