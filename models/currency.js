const { BigNumber } = require('bignumber.js');
const { Model } = require('../database/index');

class Currency extends Model {
  static get tableName() {
    return 'currencies';
  }

  static get timestamp() {
    return false;
  }

  static get idColumn() {
    return 'code';
  }

  toFixed(amount) {
    return BigNumber(amount).toFixed(this.precision, BigNumber.ROUND_DOWN);
  }
}

module.exports = Currency;
