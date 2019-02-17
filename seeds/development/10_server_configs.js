exports.seed = async knex => {
  return knex('crypto_servers').insert({
    id: 1,
    currencyCode: 'BTC',
    config: {
      client: {
        network: 'testnet',
        port: 18332,
        username: 'btc',
        password: 'btc',
      },
      confirmations: 2,
      transactionBatchSize: 1000,
      lastTransactionIndex: 0,
    }
  });
};
