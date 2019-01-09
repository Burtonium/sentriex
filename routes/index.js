const throttle = require('express-throttle');
const auth = require('./authentication');
const account = require('./account');
const balances = require('./balances');
const currencies = require('./currencies');
const investmentFunds = require('./investment_funds');
const deposit = require('./deposit');
const withdrawal = require('./withdraw');
const settings = require('./settings');
const user = require('./user');
const referrals = require('./referrals');
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

routes.post('/generate-address/:currencyCode', auth.verifyToken, deposit.generateDepositAddress);
routes.get('/deposit-addresses', auth.verifyToken, deposit.fetchDepositAddresses);
routes.get('/deposits', auth.verifyToken, deposit.fetchMyDeposits);

routes.get('/withdrawals', auth.verifyToken, withdrawal.fetchMyWithdrawals);
routes.post('/withdrawals', auth.verifyToken, auth.verify2fa, withdrawal.create);
routes.post('/withdrawals/:id/cancel', auth.verifyToken, withdrawal.cancel);
routes.post('/withdrawals/:id/activate/:authenticationToken', auth.verifyToken, withdrawal.verifyEmail);

routes.get('/investment-funds', investmentFunds.fetchAll);
routes.get('/investment-funds/performance', auth.verifyToken, investmentFunds.fetchPerformance);
routes.get('/investment-fund-shares', auth.verifyToken, investmentFunds.fetchShares);
routes.get('/investment-fund-requests', auth.verifyToken, investmentFunds.fetchRequests);
routes.post('/investment-fund-requests/:id/cancel', auth.verifyToken, investmentFunds.cancelRequest);
routes.get('/investment-funds/:id/trend-data', investmentFunds.fetchTrendData);
routes.post('/investment-funds/:id/subscribe', auth.verifyToken, auth.verify2fa, investmentFunds.subscribeToFund);
routes.post('/investment-funds/:id/redeem', auth.verifyToken, auth.verify2fa, investmentFunds.redeemFromFund);
routes.post('/investment-fund-requests/activate/:authenticationToken', auth.verifyToken, investmentFunds.activateRequest);

routes.get('/referral-payments', auth.verifyToken, referrals.fetchPayments);

// fund manager routes
routes.get('/manager/investment-funds/:id/balance-updates', auth.verifyManager, investmentFunds.fetchBalanceUpdates);
routes.post('/manager/investment-funds/:id/balance-updates', auth.verifyManager, investmentFunds.updateBalance);

// admin routes
routes.get('/admin/investment-fund-requests', auth.verifyAdmin, investmentFunds.fetchAllRequests);
routes.patch('/admin/investment-fund-requests/:id', auth.verifyAdmin, investmentFunds.patchInvestmentFundRequest);
routes.patch('/admin/investment-funds/:id', auth.verifyAdmin, investmentFunds.updateInvestmentFund);
routes.post('/admin/investment-funds', auth.verifyAdmin, investmentFunds.createInvestmentFund);
routes.delete('/admin/investment-funds/:id', auth.verifyAdmin, investmentFunds.deleteFund);

routes.post('/admin/currencies', auth.verifyAdmin, currencies.create);
routes.patch('/admin/currencies/:code', auth.verifyAdmin, currencies.patch);
routes.post('/admin/currencies/:code/addresses', auth.verifyAdmin, deposit.addAddresses);
routes.get('/admin/currencies/:code', auth.verifyAdmin, currencies.fetchCurrencyInfo);

routes.get('/admin/deposit-addresses/:depositAddress', auth.verifyAdmin, deposit.findAddress);
routes.post('/admin/deposits', auth.verifyAdmin, deposit.createDeposit);
routes.get('/admin/deposits', auth.verifyAdmin, deposit.fetchDeposits);
routes.patch('/admin/withdrawals/:id', auth.verifyAdmin, withdrawal.patch);
routes.get('/admin/withdrawals', auth.verifyAdmin, withdrawal.fetchWithdrawals);

routes.get('/admin/settings', auth.verifyAdmin, settings.fetchSettings);
routes.patch('/admin/settings', auth.verifyAdmin, settings.patchSettings);

routes.get('/admin/users', auth.verifyAdmin, user.fetchAll);


module.exports = routes;
