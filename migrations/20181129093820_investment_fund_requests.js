exports.up = knex => knex.schema.createTable('investment_fund_requests', (table) => {
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
  table.enum('status', ['pending', 'pending_email_verification', 'approved', 'declined', 'canceled']).notNullable().defaultTo('pending_email_verification').index();
  table.boolean('refunded').defaultTo(false).index();
  table.decimal('request_amount', 30, 15);
  table.decimal('request_percent', 5, 2);
  table.decimal('shares', 30, 15);
  table.decimal('share_price', 30, 15);
  table.uuid('authentication_token').unique().defaultTo(knex.raw('uuid_generate_v4()'));
  table.timestamps();
});

exports.down = knex => knex.schema.dropTableIfExists('investment_fund_requests');
