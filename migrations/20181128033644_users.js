exports.up = knex => knex.schema.createTable('users', (table) => {
  table.bigIncrements().primary();
  table.string('email').notNullable().unique();
  table.string('username').notNullable().unique();
  table.string('password').notNullable();
  table.enum('type', ['user', 'fund_manager', 'admin']).defaultTo('user').index().notNullable();
  table.binary('twofa_secret');
  table.string('referral_code').notNullable().unique().defaultTo(knex.raw('encode(gen_random_bytes(6), \'hex\')'));
  table.bigInteger('referred_by').unsigned().references('id').inTable('users').index();
  table.boolean('active').defaultTo(false).index().notNullable();
  table.timestamp('activated_at');
  table.timestamps();
});

exports.down = knex => knex.schema.dropTableIfExists('users');
