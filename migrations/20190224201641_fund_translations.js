exports.up = knex => knex.schema.createTable('investment_fund_translations', (table) => {
  table.bigIncrements().primary();
  table.bigInteger('investment_fund_id')
    .unsigned()
    .references('id')
    .inTable('investment_funds')
    .onDelete('CASCADE')
    .notNullable()
    .index();
  table.string('locale').notNullable().index();
  table.string('name');
  table.string('short_description');
  table.string('detailed_description');
  table.unique(['investment_fund_id', 'locale']);
});

exports.down = knex => knex.schema.dropTableIfExists('investment_fund_translations');
