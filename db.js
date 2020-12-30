const dotenv = require('dotenv');
dotenv.config();

const pgp = require('pg-promise')({
  // Init details
});

const cn = process.env.DATABASE_URL;

const db = pgp({
  connectionString: cn,
  ssl: false,
  // ssl: {
  //   rejectUnauthorized: false
  // }
});

module.exports = {
  db
}
