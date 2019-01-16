const Mailer = require('@sendgrid/mail');
const assert = require('assert');

Mailer.setApiKey(process.env.SENDGRID_API_KEY);

const templates = {
  emailWithButton: 'd-d628ed1bb4ea4011b690103211485757',
};

const sendActivationEmail = async ({ activation, user }) => {
  assert(user && user.username && user.email, 'Invalid user');
  assert(activation && activation.token, 'Invalid token');

  const link =  `${process.env.SITE_URL}/activate/${activation.token}`;
  const msg = {
    from: {
      email: process.env.NOREPLY_EMAIL,
      name: 'Sentriex',
    },
    template_id: templates.emailWithButton,
    personalizations: [{
      to: [{email: user.email}],
      dynamic_template_data: {
        subject: 'Sentriex - User Activation',
        header: 'User Activation',
        title: `Welcome, ${user.username}`,
        content: 'Exciting digital asset investment opportunities are one click away!',
        buttonText: 'ACTIVATE YOUR ACCOUNT',
        buttonLink: link,
      },
    }],
  };

  return Mailer.send(msg);
};

const sendPasswordResetEmail = async ({ user, reset }) => {
  assert(user.id && user.email, 'Invalid user');

  const link = `${process.env.SITE_URL}/reset-password/${reset.token}`;
  const msg = {
    from: {
      email: process.env.NOREPLY_EMAIL,
      name: 'Sentriex',
    },
    template_id: templates.emailWithButton,
    personalizations: [{
      to: [{email: user.email}],
      dynamic_template_data: {
        subject: 'Sentriex - Reset Password',
        header: 'Password Reset Request',
        title: `Hi, ${user.username}`,
        content: `We've received a password reset request from your account.
          To complete the process click the link below.`,
        buttonText: 'RESET PASSWORD',
        buttonLink: link,
      },
    }],
  };

  return Mailer.send(msg);
};

const sendWithdrawalConfirmationEmail = async ({ withdrawal, user, currency }) => {
  const { id, authenticationToken, amount, userId, currencyCode, address } = withdrawal;
  const { email } = user;
  const formattedAmount = currency.format(amount);
  const link = `${process.env.SITE_URL}/withdrawals/${id}/activate/${authenticationToken}`;

  const msg = {
    to: email,
    from: {
      email: process.env.NOREPLY_EMAIL,
      name: 'Sentriex',
    },
    template_id: templates.emailWithButton,
    personalizations: [{
      to: [{email: user.email}],
      dynamic_template_data: {
        subject: 'Sentriex - Withdrawal Confirmation',
        header: 'Confirm Withdrawal',
        title: `Hi, ${user.username}`,
        content: `We've received a withdrawal for ${formattedAmount} to be sent to ${address}.
         If this information is correct please confirm your withdrawal.`,
        buttonText: 'CONFIRM WITHDRAWAL',
        buttonLink: link,
      },
    }],
  };

  return Mailer.send(msg);
};

const sendContactFormEmail = async ({ subject, message, name, email }) => {
  const msg = {
    to: process.env.CONTACT_EMAIL || 'contact@sentriex.com',
    from: {
      email: process.env.NOREPLY_EMAIL,
      name: 'Sentriex',
    },
    replyTo: email,
    subject,
    text: message,
  }

  return Mailer.send(msg);
};

module.exports = {
  sendActivationEmail,
  sendPasswordResetEmail,
  sendWithdrawalConfirmationEmail,
  sendContactFormEmail,
}
