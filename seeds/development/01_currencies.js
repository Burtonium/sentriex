exports.seed = async (knex) => 
    knex('currencies').insert({
      "code":"BTC",
      "type":"crypto",
      "precision":8,
      "label":"Bitcoin",
      "icon":"BTC.svg"
    });