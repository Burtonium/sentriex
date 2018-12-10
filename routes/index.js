const throttle = require('express-throttle');
const auth = require('./authentication');
const account = require('./account');
const balances = require('./balances');
const currencies = require('./currencies');
const investmentFunds = require('./investment_funds');
const routes = require('express').Router();

routes.post('/authenticate', throttle({ rate: '5/s' }), auth.authenticate);
routes.post('/register', throttle({ rate: '5/s' }), auth.validateRecaptcha, account.register);
routes.post('/activate/:token', throttle({ rate: '5/s' }), account.activate);
routes.post('/resend', throttle({ rate: '5/s' }), account.resendToken);
routes.get('/availability/:username', account.findUser);
routes.post('/reset', account.requestPasswordReset);
routes.post('/reset-password/:resetToken?', account.resetPassword);
routes.get('/account', auth.verifyToken, account.getAccount);

routes.get('/2fa/secret', auth.generate2faSecret);
routes.post('/2fa/enable', auth.verifyToken, auth.enable2fa);
routes.post('/2fa/disable', auth.verifyToken, auth.disable2fa);

routes.get('/currencies', currencies.fetchAll);
routes.get('/balances', auth.verifyToken, balances.fetchAll);

routes.get('/investment-funds', auth.verifyToken, investmentFunds.fetchAll);
routes.get('/investment-fund-shares', auth.verifyToken, investmentFunds.fetchShares);
routes.post('/investment-funds/:id/subscribe', auth.verifyToken, investmentFunds.subscribeToFund);
routes.post('/investment-funds/:id/redeem', auth.verifyToken, investmentFunds.redeemFromFund);

// fund manager routes
routes.post('/investment-funds/:id/balance-updates', auth.verifyManager, investmentFunds.updateBalance);
routes.patch('/investment-funds/:id', auth.verifyManager, investmentFunds.updateInvestmentFund);
routes.post('/investment-funds', auth.verifyManager, investmentFunds.createInvestmentFund);
routes.get('/investment-funds/:id/balance-updates', auth.verifyManager, investmentFunds.fetchBalanceUpdates);

// admin routes
routes.post('/currencies', auth.verifyAdmin, currencies.create);
routes.patch('/currencies/:code', auth.verifyAdmin, currencies.patch);
routes.post('/currencies/:code/addresses', auth.verifyAdmin, currencies.addAddresses);
routes.get('/currencies/:code', auth.verifyAdmin, currencies.fetchCurrencyInfo);

module.exports = routes;