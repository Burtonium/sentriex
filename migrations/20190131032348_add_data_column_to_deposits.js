exports.up = knex => knex.schema.table('deposits', (table) => {
  table.jsonb('data');
});

exports.down = knex => knex.schema.table('deposits', (table) => {
  table.dropColumn('data');
});
