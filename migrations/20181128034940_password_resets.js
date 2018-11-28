exports.up = knex => knex.schema.createTable('password_resets', (table) => {
  table.bigIncrements().primary();
  table.string('token').notNullable().unique().defaultTo(knex.raw('uuid_generate_v4()'));
  table.bigInteger('user_id')
    .unsigned()
    .references('id')
    .inTable('users')
    .onDelete('CASCADE')
    .index();
  table.boolean('used').defaultTo(false).index();
  table.timestamp('created_at').defaultTo(knex.fn.now()).index();
});

exports.down = knex => knex.schema.dropTableIfExists('password_resets');
