const UserAddress = require('../models/user_address');
(async () => {
  const addresses = await UserAddress.query().where({ currencyCode: 'BTC' });
  console.log('#!/bin/bash');
  addresses.forEach(({ address }) => console.log(`bitcoin-cli importaddress ${address} '' false`));
})().finally(() => process.exit());
