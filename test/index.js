const knexCleaner = require('knex-cleaner');
const fse = require('fs-extra');
const mock = require('mock-require');
const nock = require('nock');
const { knex } = require('../database');
const Mailer = require('./fixtures/mailer');

mock('@sendgrid/mail', Mailer);
nock('https://www.google.com:443')
  .persist()
  .get(/^\/recaptcha\/api\/siteverify/)
  .reply(200, {
    success: true,
  });

const capitalizeWords = text => text.replace(/_/g, ' ')
  .split(' ')
  .map(word => word[0].toUpperCase() + word.substr(1))
  .join(' ');

const doTests = (directory) => {
  const files = fse.readdirSync(directory);
  files.forEach((file) => {
    const path = [directory, file].join('/');
    if (fse.statSync(path).isDirectory()) {
      describe(capitalizeWords(file), () => {
        doTests(path);
      });
    } else {
      require(path);// eslint-disable-line
    }
  });
};

const setup = async () => {
  await knex.migrate.rollback();
  await knex.migrate.latest();
};

const inBetween = async () => {
  await knexCleaner.clean(knex, {
    mode: 'truncate',
    ignoreTables: ['knex_migrations', 'knex_migrations_lock'],
  });
  // await knex.seed.run();
  Mailer.clearAllLogs();
};

const cleanup = async () => {
  await knex.migrate.rollback();
};

describe('App', () => {
  before(setup);
  beforeEach(inBetween);
  after(cleanup);
  doTests(`${__dirname}/tests`);
});

process.on('exit', () => {
  cleanup();
});
