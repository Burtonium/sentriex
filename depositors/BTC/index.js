const Client = require('bitcoin-core');
const network = 'testnet';
const port = 18332;

const client = new Client({
  network,
  username: 'btc',
  password: 'btc',
  port,
});

const { uniq } = require('lodash');
const Deposit = require('../models/deposit');
const confirmations = process.env.BTC_CONFIRMATIONS || 2;

const processAll = async (userId) => {
  const response = await client.listReceivedByAddress(confirmations, false, true);

  console.log(response);
}

processReceivedByUser();
