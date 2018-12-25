const BigNumber = require('bignumber.js');

module.exports = (options) => {
  options = Object.assign({
    feeableField: null,
    feesTable: 'fees',
    feeRate: 0,
    calculateFees: async request => {
      let rate = 0;
      if (typeof options.feeRate === 'function') {
        rate = await options.feeRate();
      } else {
        rate = options.feeRate;
      }
      return request[options.feeableField] * rate;
    },
  }, options);

  return (Model) => {
    return class extends Model {
      get feeAmount() {
        const f = this.fees;
        return f && f.reduce((acc, cur) => acc.plus(cur.amount), new BigNumber(0)).toString();
      }
      
      async removeFeeFromAmount(context) {
        if (context.createFees) {
        context._feeAmount = context.feeAmountOverride || await options.calculateFees(this);
        this[options.feeableField] -= context._feeAmount;
        }
      }
      
      async insertFees(context) {
        if (context.createFees) {
          await this.$relatedQuery('fees', context.transaction).insert({
            amount: context._feeAmount
          });
        }
      }
      
      async $beforeInsert(context) {
        await super.$beforeInsert(context);
        await this.removeFeeFromAmount(context);
      }
      
      async $afterInsert(context) {
        await super.$afterInsert(context);
        await this.insertFees(context);
      }

      async $beforeUpdate(queryOptions, context) {
        await super.$beforeUpdate(queryOptions, context);
        
        if (context.refundFees) {
          this.id = queryOptions.old.id;
          const fees = await super.$relatedQuery('fees', context.transaction);
          const feesAmount = fees.reduce((acc, cur) => acc.plus(cur.amount), new BigNumber(0));
          const amount = new BigNumber(queryOptions.old[options.feeableField]);
          this[options.feeableField] = amount.plus(feesAmount).toString();
        } else {
          await this.removeFeeFromAmount(context);
        }
      }
      
      async $afterUpdate(queryOptions, context) {
        await super.$afterUpdate(queryOptions, context);
        this.id = queryOptions.old.id;
        if (context.refundFees) {
          await super.$relatedQuery('fees', context.transaction).del();
        } else {
          await this.insertFees(context);
        }
      }
    };
  };
};
