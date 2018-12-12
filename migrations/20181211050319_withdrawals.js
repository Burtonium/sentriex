exports.up = knex => knex.schema.createTable('withdrawals', (table) => {
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
  table.enum('status', ['pending', 'approved', 'declined', 'canceled', 'pending_authentication'])
    .defaultTo('pending_authentication').index();
  table.decimal('amount', 30, 15).notNullable();
  table.string('tx_id').index();
  table.timestamps();
});

exports.down = knex => knex.schema.dropTableIfExists('withdrawals');
