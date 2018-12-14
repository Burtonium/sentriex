const Mailer = require('@sendgrid/mail');
Mailer.setApiKey(process.env.SENDGRID_API_KEY);
module.exports = Mailer;