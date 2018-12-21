require('dotenv').config();
require('express-async-errors');
const app = require('express')();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const { isCelebrate } = require('celebrate');
const routes = require('./routes');
const http = require('http').createServer(app);
const production = process.env.NODE_ENV === 'production';
const port = 8081// process.env.PORT || 8081;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({
  origin: process.env.SITE_URL,
  credentials: true,
}));
app.use(cookieParser());
app.use(helmet());
app.use(helmet.hidePoweredBy());
app.use('/', routes);

app.use((err, req, res, next) => {
  if (isCelebrate(err)) {
    err = { status: 400, message: err.details[0].message, ...err,  };
  }
  next(err);
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong',
    error: production ? true : err,
    code: err.code,
  });

  next(err);
});

http.listen(port, () => {
  console.log(`Listening on ${port}`); // eslint-disable-line
});

module.exports = http;