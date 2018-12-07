exports.up = knex => knex.schema.createTable('investment_fund_balance_updates', (table) => {
  table.bigIncrements().primary();
  table.bigInteger('investment_fund_id')
    .unsigned()
    .references('id')
    .inTable('investment_funds')
    .onDelete('CASCADE')
    .index();
  
  table.decimal('previous_balance', 30, 15).notNullable();
  table.decimal('updated_balance', 30, 15).notNullable();
  table.timestamps();
});

exports.down = knex => knex.schema.dropTableIfExists('investment_fund_balance_updates');