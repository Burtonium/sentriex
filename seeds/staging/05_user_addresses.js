// derived from account 0 of
// tprv8ZgxMBicQKsPdAhq2TAaHzzNUfPc4NpWSn4AdmYnwSJwaepYpUM5vRvisVZSCkHXKfspCGzBZsj6HznHk6XoX2kYYNywcdwJ3u3sCQ9fwFo

const addresses = [
  'n2v7PHpQ4XiyofpaETcn4cfPUJGi1xMq1t',
  'mz4Dufb2mib742UDbgHatyfX39CwTvqFrN',
  'mrvjgncZUfUrUa3rXr8iEgGDe966LdYA2D',
  'mvgkuUJjVjPsKF2VLULRRs1NbeGxmsNzvP',
  'mi9Y6XhyyTJEWbKyu3S7C1Snxw7yzDMojw',
  'mrGq1Tcbmq8jVAtRdLFtFoG6UuUMcxwNYD',
  'n1Fn6Azzr9gKCCqHMz3PHjS6zts4vtwbNi',
  'mhDNgA6aLBdELw7uHKcPtfyVmG5yJJhjJh',
  'muuC6BUqdnVF4zGJM6VQFQqW2KFrgu7qcM',
  'myyX9cW45XZuRcViTdWCWeUfm8wKJwJ4q3',
  'mw8giWrasLMNVq4i2JQ3Tz37xrT8YkF8hr',
  'mhVoxnuorZNeRgd2j4Ds4rBHCjXqGK23MG',
  'mr8HrTFYC6tb9FkRAidHTySMvFZtTmvuNb',
  'mpmf1LGdnHASwHBvR4Nn1YNvqxeV6CPpqr',
  'mpTEjT2Eodqe5wAo7bDs1UCAejunNDqP7B',
  'mwSSQvZhFgmSVvuKjvU395AHeYm9E5bS91',
  'mmLokAqv1QKu5Fya1z4apKnPDBtMXLTDCU',
  'my9LaMRf4eJ3qnt4ip2o2fERnCUPmSCNBN',
  'mnjhED1GhjPAcMA9D8ecL4JV1XkpqYLH3r',
  'mr41X1EpQ59bRbHpUSBjrbhieRaNPMvtRj',
  'mq3eWm8EnrnXPNFjyHMc3XrpkKNd8t3yEJ',
  'mjRjVLTKHnGw4S3R1MJ9pk21YgTaqecrMe',
  'myy3aq3wr9HMVnXpJ7ZtCwHziHASZB6qY8',
  'n3ojgQLcdRzfxhxh86r359aDcxt7e7ExUf',
  'mzfzyVCrWgPi5jjm4WBoZk7UdAAkqixQut',
  'mv8uZoCWhqHtGAJw6o3hRKK4HP3CXJ3HjU',
  'mzV2mTpPbHzB2swMbkoFK3ZSUmNFVVnZJ5',
  'ms2yM5LQ7mv7rNjqctxANg3qhAwuoorQzi',
  'mqf78Gtkc8khg7vCsxvZawAtMYXJEHRyHG',
  'n3Ut75hosi8Ss7GiecMqZRtexwn9N6C3i3',
  'mq9G6sgJSMWFJa47t2ZL53jiGL6dXVFfKv',
  'mroLbWCsub5Nb99VeDmiemXh6kNLXL9tC1',
  'mprc2NZYsN5cZwibKUV6e7uURem7V2opWP',
  'mjRj9E67Myy18gKaC4vTMCgnYkGYRigBna',
  'mjKXD67UBtL8kA5FdSsiFXxFscJxV5PZwM',
  'n1anPaB7BAKkfNWop6qcS17N2jwbH5GqVM',
  'muE7CT2JfLmiHJ2sNPbWbDrJFzJD1jC2M7',
  'n3aCyk3vf5gdJHia8DihcmhuAvvMuKwMAk',
  'mo27vyZjxC2EELer4jj45jBGqUNhVoSvaB',
  'mhFGrrMeGMUc2bjRDkNS64wSoDJkVxN6rN'
];

exports.seed = async knex => knex('user_addresses')
  .insert(addresses.map(address => ({ address, currencyCode: 'BTC', userId: null })));
