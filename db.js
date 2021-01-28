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

const getValidKeys = async () => db.query('SELECT * FROM room_keys')

// Queries
const updateGame = (room, guesses, scores) => {
  const stringifiedGuesses = JSON.stringify(guesses);
  const stringifiedScores = JSON.stringify(scores);

  db.query('UPDATE rooms SET guesses = ${guesses}, scores = ${scores} WHERE room_name = ${room} AND created_at in (select max(created_at) from rooms WHERE room_name = ${room})', {
    room,
    guesses: stringifiedGuesses,
    scores: stringifiedScores,
  });
}

const getPuzzle = async (room) => db.query('SELECT * FROM rooms WHERE room_name = ${room} AND created_at in (select max(created_at) from rooms WHERE room_name = ${room})', {
  room,
});

const insertPuzzle = (room, board, guesses, scores) => {
  const stringifiedGuesses = JSON.stringify(guesses);
  const stringifiedScores = JSON.stringify(scores);

  db.query('INSERT INTO rooms(room_name, board, created_at, guesses, scores) VALUES(${room}, ${board}, ${created_at}, ${guesses}, ${scores})', {
    room,
    board: board,
    created_at: new Date(),
    guesses: stringifiedGuesses,
    scores: stringifiedScores,
  });
}


module.exports = {
  db,
  getValidKeys,
  updateGame,
  getPuzzle,
  insertPuzzle,
}
