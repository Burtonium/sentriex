require('dotenv').config();
require('express-async-errors');
const app = require('express')();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const { isCelebrate } = require('celebrate');
const { CronJob } = require('cron');
const { fork } = require('child_process');
const routes = require('./routes');
const server = require('./server')(app);
const env = process.env.NODE_ENV || 'development';
const production = env === 'production';
const port = process.env.PORT || 8081;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({
  origin: process.env.SITE_URL,
  credentials: true,
}));

app.use(cookieParser());
app.use(helmet());
app.use(helmet.hidePoweredBy());
app.get('/', (req, res) => res.send('Welcome to Sentriex API V1'));
app.use('/v1', routes);

app.use((err, _req, _res, next) => {
  if (isCelebrate(err)) {
    err = { status: 400, message: err.details[0].message };
  }
  next(err);
});

app.use((err, _req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong',
    error: production ? true : err,
    code: err.code,
  });

  next(err);
});

const connectionType = process.env.SELF_SIGN_SSL ? 'https' : 'http';
server.listen(port, () => {
  console.log(`Listening on ${port} in ${env} mode with ${connectionType}`); // eslint-disable-line
});

// DAILY CRON JOBS
new CronJob('00 00 20 * * *', () => { // eslint-disable-line
  const task = fork(`${__dirname}/scripts/daily_apr_fund_update.js`);
}, null, true, 'America/Toronto');

module.exports = server;
