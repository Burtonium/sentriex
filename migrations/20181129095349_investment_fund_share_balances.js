exports.up = knex => knex.schema.createTable('investment_fund_share_balances', (table) => {
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
  
  table.decimal('amount', 30, 15).notNullable();
  table.timestamps();
});

exports.down = knex => knex.schema.dropTableIfExists('investment_fund_share_balances');