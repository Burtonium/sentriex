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
      }
    };
  }
}

module.exports = User;
