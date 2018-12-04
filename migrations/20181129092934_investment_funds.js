exports.up = knex => knex.schema.createTable('investment_funds', (table) => {
  table.bigIncrements().primary();
  table.bigInteger('creator_id')
    .unsigned()
    .references('id')
    .inTable('users')
    .onDelete('CASCADE')
    .index();
  table.string('name').notNullable();
  table.enum('risk_level', ['high', 'medium', 'low']).notNullable().defaultTo('high').index();
  table.string('short_description');
  table.string('detailed_description');
    table.string('currency_code', 10)
    .references('code')
    .inTable('currencies')
    .onUpdate('CASCADE')
    .onDelete('CASCADE')
    .index();
  table.decimal('balance', 30, 15).notNullable();
  table.timestamps();
});

exports.down = knex => knex.schema.dropTableIfExists('investment_funds');
