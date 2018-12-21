exports.up = async (knex) => {
  await knex.schema.createTable('investment_fund_settings', (table) => {
    table.increments().primary();
    table.decimal('fund_manager_redeem_profit_percent', 5, 2).notNullable();
    table.decimal('site_redeem_profit_percent', 5, 2).notNullable();
    table.decimal('user_redeem_profit_percent', 5, 2).notNullable();
    knex.raw('CHECK fund_manager_redeem_profit_percent + site_redeem_profit_percent + user_redeem_profit_percent = 1');
  });

  await knex.raw('ALTER TABLE investment_fund_settings ADD CONSTRAINT one_row CHECK (id=1)');

  await knex('investment_fund_settings').insert({
    fundManagerRedeemProfitPercent: 0.3,
    siteRedeemProfitPercent: 0.1,
    userRedeemProfitPercent: 0.6,
  });
};

exports.down = knex => knex.schema.dropTableIfExists('investment_fund_settings');
