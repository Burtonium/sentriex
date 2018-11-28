const crypto = require('crypto-promise');
const speakeasy = require('speakeasy');
const { Model } = require('../database');

class UserTwofa extends Model {
  async $beforeInsert(context) {
    await super.$beforeInsert(context);
    await this.encryptSecret();
  }

  async $beforeUpdate(context) {
    await super.$beforeUpdate(context);
    await this.encryptSecret();
  }

  async encryptSecret() {
    if (this.twofaSecret) {
      this.twofaSecret = await crypto.cipher('aes-256-cbc', process.env.TWOFA_CIPHER_KEY)(this.twofaSecret);
    }
  }

  async verifyTwofa(token) {
    let ok = false;
    if (this.twofaSecret) {
      const deciphered = await crypto.decipher('aes-256-cbc', process.env.TWOFA_CIPHER_KEY)(this.twofaSecret);

      ok = speakeasy.totp.verify({
        secret: deciphered.toString('utf8'),
        encoding: 'base32',
        token,
      });
    }
    return ok;
  }
}

module.exports = UserTwofa;
