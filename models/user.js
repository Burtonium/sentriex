const Password = require('objection-password-argon2')({ allowEmptyPassword: true });
const Model = require('./twofa_cipher_model');

class User extends Password(Model) {
  static get tableName() {
    return 'users';
  }

  static get timestamp() {
    return true;
  }
  
  get twofaIsEnabled() {
    return !!this.twofaSecret;
  }
  
  toTokenDetails() {
    return {
      email: this.email,
      id: this.id,
      username: this.username,
      active: this.active,
      admin: this.type === 'admin',
      manager: this.type === 'admin' || this.type === 'fund_manager',
      twofa: this.twofaIsEnabled,
    };
  }

  static get relationMappings() {
    return {
      activationTokens: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/activation`,
        join: {
          from: 'users.id',
          to: 'user_activations.userId',
        },
      },
      referred: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/user`,
        join: {
          from: 'users.referredBy',
          to: 'users.id',
        },
      },
      referrals: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/user`,
        join: {
          from: 'users.id',
          to: 'users.referredBy',
        },
      },
      balances: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/balance`,
        join: {
          from: 'users.id',
          to: 'balances.userId',
        },
      },
      investmentFundShares: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/investment_fund_shares`,
        join: {
          from: 'users.id',
          to: 'investment_fund_share_balances.userId',
        },
      },
    };
  }
}

module.exports = User;
