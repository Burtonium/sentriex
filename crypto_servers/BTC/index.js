const Client = require('bitcoin-core');
const { uniq } = require('lodash');
const UserAddress = require('../../models/user_address');
const { knex } = require('../../database');

let client = null;
let config = null;

const connect = async () => {
  const server = await knex('crypto_servers').where('currencyCode', 'BTC').first();
  if (!server) {
    throw new Error('No configuration found for BTC server');
  }
  config = server.config;
  client = new Client(config.client);
};

const checkClient = (req, res, next) => {
  if (client === null) {
    return res.send(503).json({ success: false, message: 'Server offline'});
  }
  next();
}

const connectServer = async (req, res) => {
  let err = null;
  try {
    await connect();
  } catch (error) {
    err = error;
  }
  return err ? res.status(503).json({ success: false, message: err.message }) :
    res.status(200).json({ success: true, message: 'BTC server connected' });
};


const importUserAddress = ({ user, address }) => {
  if (!client) {
    throw new Error('BTC Server not initialized');
  }
  return client.importAddress(address, `${user.username} (${user.email})`, false, false);
}

const checkReceivedTransactions = async () => {
  if (!client || !config) {
    throw new Error('BTC Server not initialized');
  }
  const server = await knex('crypto_servers').where('currencyCode', 'BTC').first();
  const lastIndex = server.config.lastTransactionIndex || 0;
  const transactionBatchSize = server.config.transactionBatchSize || 1000;

  const confs = config.confirmations;
  const transactions = await client.listTransactions('*', transactionBatchSize, lastIndex, true);
  const confirmedTxs = transactions.filter(t => t.confirmations >= confs && t.category === 'receive');

  confirmedTxs.forEach(async (tx) => {
    const { txid, address, amount } = tx;
    const addr = await UserAddress.query().joinEager('[deposits,user]').where({ address }).first();
    if (!addr) {
      console.error(`Watched address ${address} not found`);
      return false;
    }
    if (!addr.user) {
      console.error(`Address received bitcoin without a user`);
      return false;
    }

    if (!addr.imported) {
      await importUserAddress({ user: addr.user, address });
      await addr.$query().update({ imported: true });
    }

    await addr.createDeposit({ txId: txid, amount, data:  tx }).catch((e) => {
      const found = e.message.match(/duplicate/g);
      if (found) {
        console.error('Tried to enter duplicate deposit');
      } else {
        throw e;
      }
    });
  });

  server.config.lastTransactionIndex = lastIndex + transactions.length;
  await knex('crypto_servers').update({ config: server.config });
}


const importAllAddresses = async () => {

};

const updateClientConfig = async (req, res) => {
  const { config } = req.body;

  client = new Client(config.client);
  await knex('crypto_servers')
    .update({ config })
    .where('currencyCode', 'BTC');

  return res.status(200).json({ success: true, config });
}

setTimeout(async () => {
  await connect().catch((e) => { console.error(e)});
  await checkReceivedTransactions();
}, 100);

module.exports = {
  importUserAddress,
}
