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
  table.enum('status', ['pending', 'approved', 'declined', 'canceled', 'pending_email_verification'])
    .defaultTo('pending_email_verification').index();
  table.decimal('amount', 30, 15).notNullable();
  table.string('address').notNullable().index();
  table.string('tx_id').index();
  table.uuid('authentication_token').unique().defaultTo(knex.raw('uuid_generate_v4()'));
  table.boolean('refunded').defaultTo(false).notNullable().index();
  table.timestamps();
  table.index('created_at');
  table.index('updated_at');
});

exports.down = knex => knex.schema.dropTableIfExists('withdrawals');
