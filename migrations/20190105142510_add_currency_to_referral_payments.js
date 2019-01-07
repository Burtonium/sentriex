exports.up = knex => knex.schema.table('referral_payments', (table) => {
  table.string('currency_code', 10)
    .references('code')
    .inTable('currencies')
    .onUpdate('CASCADE')
    .onDelete('CASCADE')
    .index();
});

exports.down = knex => knex.schema.table('referral_payments', (table) => {
  table.dropColumn('currency_code');
});
