exports.up = knex => knex.schema.createTable('investment_fund_transactions', (table) => {
  table.bigIncrements().primary();
  table.bigInteger('investment_fund_id')
    .unsigned()
    .references('id')
    .inTable('investment_funds')
    .onDelete('CASCADE')
    .index();
  table.bigInteger('user_id')
    .unsigned()
    .references('id')
    .inTable('users')
    .onDelete('CASCADE')
    .index();
  table.enum('type', ['redemption', 'subscription']).notNullable().index();
  table.boolean('approved').defaultTo(false).notNullable().index();
  table.decimal('shares', 30, 15).notNullable();
  table.decimal('share_price', 30, 15).notNullable();
  table.timestamps();
});

exports.down = knex => knex.schema.dropTableIfExists('investment_fund_transactions');
