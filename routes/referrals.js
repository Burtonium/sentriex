const ReferralPayments = require('../models/referral_payments');

const fetchPayments = async (req, res) => {
  const referralPayments =  await ReferralPayments.query()
    .joinEager('payer')
    .where('payeeId', req.user.id)
    .orderBy('createdAt', 'desc');

  return res.status(200).json({ success: true, referralPayments });
};

module.exports = {
  fetchPayments,
};
