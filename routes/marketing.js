const { subscribeToMailer } = require('./emails');

const subscribe = async (req, res) => {
  const { email } = req.body;
  await subscribeToMailer([email]);
  res.status(200).json({ success: true });
}

module.exports = {
  subscribe,
}
