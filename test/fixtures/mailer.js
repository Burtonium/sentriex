module.exports = {
  logs: {},
  debug: true,

  send(message) {
    this.debugPrint('Mailer sent: ', message);
    this.log(message.to, message);
  },

  setApiKey(key) {
    this.debugPrint('Set api key to: ', key);
  },

  log(receiver, message) {
    if (!this.logs[receiver]) {
      this.logs[receiver] = [];
    }
    this.logs[receiver].push(message);
  },

  clearAllLogs() {
    this.logs = {};
  },

  clearLog(receiver) {
    this.logs[receiver] = [];
  },

  getEmails(receiver) {
    return this.logs[receiver] || [];
  },

  numEmails(receiver) {
    return this.logs[receiver] ? this.logs[receiver].length : 0;
  },

  setDebug(bool = true) {
    this.debug = bool;
  },

  debugPrint(message) {
    if (this.debug) {
      console.log(message); // eslint-disable-line
    }
  },
};
