exports.up = knex => knex.schema.createTable('users', (table) => {
  table.bigIncrements().primary();
  table.string('email').notNullable().unique();
  table.string('username').notNullable().unique();
  table.string('password').notNullable();
  table.enum('type', ['user', 'fund_manager', 'admin']).defaultTo('default').index().notNullable();
  table.binary('twofa_secret');
  table.uuid('referral_code').notNullable().unique().defaultTo(knex.raw('uuid_generate_v4()'));
  table.bigInteger('referred_by').unsigned().references('id').inTable('users');
  table.boolean('active').defaultTo(false).index().notNullable();
  table.timestamp('activated_at');
  table.timestamps();
});

exports.down = knex => knex.schema.dropTableIfExists('users');
