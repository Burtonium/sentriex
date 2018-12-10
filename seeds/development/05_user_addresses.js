exports.seed = async (knex) => knex('user_addresses').insert([{
  currencyCode: 'BTC',
  userId: null,
  address: 'mxRBcUqkmPMT18vwbN6CRJDa93nri7h6S1',
}, {
  currencyCode: 'BTC',
  userId: null,
  address: 'mv4rnyY3Su5gjcDNzbMLKBQkBicCtHUtFB',
}, {
  currencyCode: 'BTC',
  userId: null, 
  address: '2NCD3vvmuEtNGxRrfUPch4q3vrrpJkUsvvT',
}]);