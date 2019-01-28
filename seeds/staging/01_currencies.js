exports.seed = async (knex) =>
  knex('currencies').insert([{
    "code":"BTC",
    "type":"crypto",
    "precision":8,
    "label":"Bitcoin",
    "icon":"BTC.svg"
  }, {
    "code":"LTC",
    "type":"crypto",
    "precision":8,
    "label":"Litecoin",
    "icon":"LTC.svg"
  }, {
    "code":"XRP",
    "type":"crypto",
    "precision":6,
    "label":"Ripple",
    "icon":"XRP.svg"
  }, {
    "code":"ETH",
    "type":"crypto",
    "precision":8,
    "label":"Ethereum",
    "icon":"ETH.svg"
  }, {
    "code":"CAD",
    "type":"fiat",
    "precision":2,
    "label":"Canadian Dollar",
    "icon":"CAD.svg"
  }]);
