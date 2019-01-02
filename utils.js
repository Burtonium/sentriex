const BigNumber = require('bignumber.js');
const daysBetween = (date1, date2) => {
  const day = 1000 * 60 * 60 * 24;
  const date1Millis = date1.getTime();
  const date2Millis = date2.getTime();
  const diff = Math.abs(date1Millis - date2Millis);
  return Math.round(diff / day);
}

const hoursBetween = (date1, date2) => {
  const hour = 1000 * 60 * 60;
  const date1Millis = date1.getTime();
  const date2Millis = date2.getTime();
  const diff = Math.abs(date1Millis - date2Millis);
  return Math.round(diff / hour);
};

const percentDifference = (a, b) => {
  const first = new BigNumber(a);
  const second = new BigNumber(b);
  return second.minus(first).dividedBy(first);
};

const oneDay = 1000 * 60 * 60 * 24;

const daysAgo = days => new Date(new Date() - (days * oneDay));

module.exports = {
  daysBetween,
  hoursBetween,
  percentDifference,
  daysAgo,
};
