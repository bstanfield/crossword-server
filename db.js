const dotenv = require('dotenv');
dotenv.config();

const pgp = require('pg-promise')({
  // Init details
});

const cn = process.env.DATABASE_URL;
const testing = process.env.TESTING;

const db = pgp({
  connectionString: cn,
  ssl: testing
    ? false
    : {
      rejectUnauthorized: false
    },
});

// Queries
const updateGuesses = (room, guesses) => {
  const stringifiedGuesses = JSON.stringify(guesses);

  db.query('UPDATE rooms SET guesses = ${guesses} WHERE room_name = ${room} AND created_at in (select max(created_at) from rooms WHERE room_name = ${room})', {
    room,
    guesses: stringifiedGuesses,
  });
}

const getPuzzle = async (room) => db.query('SELECT * FROM rooms WHERE room_name = ${room} AND created_at in (select max(created_at) from rooms WHERE room_name = ${room})', {
  room,
});

const insertPuzzle = (room, board, guesses) => {
  const stringifiedGuesses = JSON.stringify(guesses);

  db.query('INSERT INTO rooms(room_name, board, created_at, guesses) VALUES(${room}, ${board}, ${created_at}, ${guesses})', {
    room,
    board: board,
    created_at: new Date(),
    guesses: stringifiedGuesses,
  });
}


module.exports = {
  db,
  updateGuesses,
  getPuzzle,
  insertPuzzle,
}
