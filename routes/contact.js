const { sendContactFormEmail } = require('./emails');

const receive = async (req, res) => {
  const { subject, name, email, message } = req.body;

  await sendContactFormEmail({
    subject,
    name,
    email,
    message,
  });

  return res.status(200).json({ success: true });
}

module.exports = {
  receive,
};
