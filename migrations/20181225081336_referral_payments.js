exports.up = knex => knex.schema.createTable('referral_payments', (table) => {
  table.bigIncrements().primary();
  table.bigInteger('payee_id')
    .unsigned()
    .references('id')
    .inTable('users')
    .onDelete('CASCADE')
    .notNullable()
    .index();
    
  table.bigInteger('referral_id')
    .unsigned()
    .references('id')
    .inTable('users')
    .onDelete('CASCADE')
    .notNullable()
    .index();
    
  table.bigInteger('redemption_id')
    .unsigned()
    .references('id')
    .inTable('investment_fund_requests')
    .onDelete('CASCADE')
    .index();
  
  table.decimal('amount', 30, 15).notNullable();
  table.timestamps();
});

exports.down = knex => knex.schema.dropTableIfExists('referral_payments');