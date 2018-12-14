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
  
  format(amount) {
    const symbol = this.unicodeSymbol;
    return `${symbol || ''}${this.toFixed(amount)} ${this.code || ''}`;
  }
  
  static get relationMappings() {
    return {
      userAddresses: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/user_address`,
        join: {
          from: 'currencies.code',
          to: 'user_addresses.currencyCode',
        },
      },
    };
  }
}

module.exports = Currency;
