const { Model } = require('../database');
const User = require('./user');

class PasswordReset extends Model {
  static get tableName() {
    return 'password_resets';
  }

  static get timestamp() {
    return {
      create: true,
    };
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'password_resets.userId',
          to: 'users.id',
        },
      },
    };
  }
}

module.exports = PasswordReset;
