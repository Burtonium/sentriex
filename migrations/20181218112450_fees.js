/*
Note: Using multiple columns to record a polymorphic relation is optimized in postgres.

"In PostgreSQL, null values are almost free.
A nullable field has a 1-bit per row overhead rounded up to the nearest byte
(e.g. 30 nullable fields have 4 bytes of overhead).
Combine that with partial indexes ignoring null values and the performance is not an issue."

"With PostgreSQL, this (adding a new null column) is not a problem.
Nullable fields can be added quickly regardless of table size.
The updated check constraint can also be added without blocking concurrent usage."
*/

exports.up = async knex => {
  await knex.schema.createTable('fees', (table) => {
    table.bigIncrements().primary();

    table.bigInteger('withdrawal_id').unsigned().references('id').inTable('withdrawals')
      .onDelete('CASCADE').index();
      
    table.bigInteger('investment_fund_request_id')
      .unsigned()
      .references('id')
      .inTable('investment_fund_requests')
      .onDelete('CASCADE').index();
    
    table.decimal('amount', 30, 15).notNullable();
    table.timestamps();
    table.index('created_at');
    table.index('updated_at');
  });

  await knex.schema.raw(`ALTER TABLE fees ADD CONSTRAINT one_reference
    CHECK(
      (withdrawal_id IS NOT NULL)::integer
      + (investment_fund_request_id IS NOT NULL)::integer
      = 1)`);
};

exports.down = knex => knex.schema.dropTableIfExists('fees');
