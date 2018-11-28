const { Model } = require('../database/index');

class Activation extends Model {
  static get tableName() {
    return 'user_activations';
  }

  static get timestamp() {
    return {
      create: true,
    };
  }

  static get idColumn() {
    return 'id';
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/user`,
        join: {
          from: 'user_activations.userId',
          to: 'users.id',
        },
      },
    };
  }
}

module.exports = Activation;
