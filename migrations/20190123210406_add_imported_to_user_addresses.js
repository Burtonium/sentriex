exports.up = knex => knex.schema.table('user_addresses', (table) => {
  table.boolean('imported').defaultTo(false);
});

exports.down = knex => knex.schema.table('user_addresses', (table) => {
  table.dropColumn('imported');
});
