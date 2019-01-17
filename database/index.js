const configureKnex = require('knex');
const objection = require('objection');
const objectionTimestamp = require('objection-timestamp');
const config = require('../knexfile.js');
const knex = configureKnex(config);

objectionTimestamp.register(objection, {
  create: 'created_at',
  update: 'updated_at',
});

objection.Model.knex(knex);

class CustomModel extends objection.Model {
  async eagerLoadIfMissing(relation) {
    let data = this[relation];
    if ((typeof (data) !== 'object') && !Array.isArray(data)) {
      data = await this.$relatedQuery(relation);
    }
    return data;
  }
}

module.exports = {
  knex,
  Model: CustomModel,
};
