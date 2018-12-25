const { Joi } = require('celebrate');

module.exports = {
  body: {
    fundManagerRedeemProfitPercent: Joi.number().max(1).min(0).required(),
    siteRedeemProfitPercent: Joi.number().max(1).min(0).required(),
    userRedeemProfitPercent: Joi.number().max(1).min(0).required(),
    withdrawalFeeRate: Joi.number().max(1).min(0).required(),
  },
};
