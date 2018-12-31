const fs = require('fs');
module.exports = (app) => {
  const { NODE_ENV, SELF_SIGN_SSL, SSL_KEY_PATH, SSL_CERT_PATH } = process.env;
  let server;
  if (NODE_ENV !== 'production' && SELF_SIGN_SSL) {
    const options = {
      key: fs.readFileSync(SSL_KEY_PATH || 'server.key'),
      cert: fs.readFileSync(SSL_CERT_PATH || 'server.cert'),
    }
    server = require('https').createServer(options, app);
  } else {
    server = require('http').createServer(app);
  }
  return server;
}
