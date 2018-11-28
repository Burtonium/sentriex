const throttle = require('express-throttle');
const auth = require('./authentication');
const account = require('./account');
const routes = require('express').Router();

routes.post('/authenticate', throttle({ rate: '5/s' }), auth.authenticate);
routes.post('/register', throttle({ rate: '5/s' }), auth.validateRecaptcha, account.register);
routes.post('/activate/:token', throttle({ rate: '5/s' }), account.activate);
routes.post('/resend', throttle({ rate: '5/s' }), account.resendToken);
routes.get('/availability/:username', account.findUser);
routes.post('/reset', account.requestPasswordReset);
routes.post('/reset-password/:token?', account.resetPassword);
routes.get('/account', auth.verifyToken, account.getAccount);

routes.get('/2fa/secret', auth.generate2faSecret);
routes.post('/2fa/enable', auth.verifyToken, auth.enable2fa);
routes.post('/2fa/disable', auth.verifyToken, auth.disable2fa);

module.exports = routes;