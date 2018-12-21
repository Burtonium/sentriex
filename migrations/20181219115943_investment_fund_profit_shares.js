exports.up = knex => knex.schema.createTable('investment_fund_profit_shares', (table) => {
  table.bigIncrements().primary();
  table.bigInteger('user_id')
    .unsigned()
    .references('id')
    .inTable('users')
    .onDelete('CASCADE')
    .notNullable()
    .index();
  table.bigInteger('investment_fund_request_id')
    .unsigned()
    .references('id')
    .inTable('investment_fund_requests')
    .onDelete('CASCADE')
    .notNullable()
    .index();
    
  table.bigInteger('investment_fund_id')
    .unsigned()
    .references('id')
    .inTable('investment_funds')
    .onDelete('CASCADE')
    .notNullable()
    .index();
  
  table.decimal('amount', 30, 15).notNullable();
  table.timestamps();
});

exports.down = knex => knex.schema.dropTableIfExists('investment_fund_profit_shares');