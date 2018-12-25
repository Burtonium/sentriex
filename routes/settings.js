const { knex } = require('../database');
const fetchSettings = async (req, res) => {
  const settings = await knex('investmentFundSettings').first();
  return res.status(200).json({ success: true, settings });
};

const patchSettings = async (req, res) => {
  const settings = await knex('investmentFundSettings').update(req.body).returning('*');
  return res.status(200).json({ success: true, settings });
};

module.exports = {
    fetchSettings,
    patchSettings
}