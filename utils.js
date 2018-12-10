const daysBetween = (date1, date2) => {
  const day = 1000 * 60 * 60 * 24;
  const date1Millis = date1.getTime();
  const date2Millis = date2.getTime();
  const diff = Math.abs(date1Millis - date2Millis);
  return Math.round(diff / day);
};

const hoursBetween = (date1, date2) => {
  const hour = 1000 * 60 * 60;
  const date1Millis = date1.getTime();
  const date2Millis = date2.getTime();
  const diff = Math.abs(date1Millis - date2Millis);
  return Math.round(diff / hour);
};

module.exports = {
  daysBetween,
  hoursBetween,
};
