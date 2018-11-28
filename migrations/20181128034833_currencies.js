exports.up = knex => knex.schema.createTable('currencies', (table) => {
  table.string('code', 10).primary();
  table.enum('type', ['crypto', 'fiat']).notNullable();
  table.integer('precision').notNullable();
  table.string('label');
  table.string('icon');
  table.string('unicode_symbol');
});

exports.down = knex => knex.schema.dropTableIfExists('currencies');
