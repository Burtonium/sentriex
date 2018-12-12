exports.up = knex => knex.schema.createTable('deposits', (table) => {
  table.bigIncrements().primary();
  table.bigInteger('user_id')
    .unsigned()
    .references('id')
    .inTable('users')
    .notNullable()
    .onDelete('CASCADE');
  table.bigInteger('user_address_id')
    .unsigned()
    .references('id')
    .inTable('user_addresses')
    .onDelete('CASCADE');
  table.string('currency_code', 10)
    .notNullable()
    .references('code')
    .inTable('currencies')
    .onUpdate('CASCADE')
    .onDelete('CASCADE')
    .index();
    
  table.decimal('amount', 30, 15).notNullable();
  table.string('tx_id').unique();
  table.timestamps();
});

exports.down = knex => knex.schema.dropTableIfExists('deposits');
