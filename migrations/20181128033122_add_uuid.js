exports.up = knex => knex.raw('create extension if not exists "uuid-ossp"; create extension if not exists pgcrypto;');

exports.down = knex => knex.raw('drop extension if exists "uuid-ossp"; drop extension if exists pgcrypto');
