const dotenv = require('dotenv');
dotenv.config();

const pgp = require('pg-promise')({
  // Init details
});

// TEMP
const {
  findNewPuzzle,
  createDownAndAcrossWordGroupings,
  checkIfLetterAddsToScore
} = require('./data');

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

const insertCompletionTimestamp = (room, completed_at) => {
  db.query('UPDATE rooms SET completed_at = ${completed_at} WHERE room_name = ${room} AND created_at in (select max(created_at) from rooms WHERE room_name = ${room})', {
    room,
    completed_at,
  });
}

const getPuzzle = async (room) => db.query('SELECT * FROM rooms WHERE room_name = ${room} AND created_at in (select max(created_at) from rooms WHERE room_name = ${room})', {
  room,
});

const insertPuzzle = (created_at, completed_at, room, board, mappings, guesses, scores) => {
  console.log('inserting room: ', room)
  const stringifiedGuesses = JSON.stringify(guesses);
  const stringifiedScores = JSON.stringify(scores);

  db.query('INSERT INTO rooms(room_name, board, mappings, created_at, completed_at, guesses, scores) VALUES(${room}, ${board}, ${mappings}, ${created_at}, ${completed_at}, ${guesses}, ${scores})', {
    room,
    board,
    mappings,
    created_at,
    completed_at,
    guesses: stringifiedGuesses,
    scores: stringifiedScores,
  });
}

// New queries for new tables schema
// TEMP
const instantiateGuesses = (grid) => grid.map(item => {
  if (item === '.') {
    return false
  } else {
    return ''
  }
})

const loadPuzzle = async (givenPuzzle) => {
  const board = givenPuzzle
  const { grid } = board
  if (grid === null) {
    console.log('Error getting puzzle!');
    return false;
  }
  const guesses = instantiateGuesses(grid)
  const { across, down } = createDownAndAcrossWordGroupings(board);

  return {
    board,
    guesses,
    created_at: new Date(),
    completed_at: null,
    mappings: {
      across,
      down,
    },
    scores: {
      claimedGuesses: [],
      claimedGuessesLookup: {
        // ben: [14, 23, 18],
      },
      incorrectGuesses: {
        // ben: [16, 24, 19],
      },
      editor: {
        // ben: 4
      },
      workhorse: {
        // ben: 31
      },
      longestWord: {
        // Temporarily disabled
        // ben: 'superbo'
      },
      finishingBlow: [
        // mimi: 'sumo'
      ],
      hotStreak: {
        // mimi: 8
      },
      toughLetters: {
        // ben: 2
      },
      thief: {
        // mimi: 4
      },
      highestAccuracy: {
        // mimi: 90
      },
      benchwarmer: {
        // mimi: 20
      }
    }
  }
}

const months = [
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '11',
  '12'
]

const addPuzzleDataToPuzzlesTable = async (puzzle) => {
  const response = await loadPuzzle(puzzle)

  const date = new Date(response.board.date)

  const year = date.getFullYear();
  const month = months[date.getMonth()];
  const day = date.toLocaleDateString('en', { day: '2-digit' });

  const puzzleId = Number("" + year + month + day)

  db.query('INSERT INTO puzzles(puzzle_id, data) VALUES(${puzzle_id}, ${data})', {
    puzzle_id: puzzleId,
    data: response,
  });
  return { puzzleId, data: response }
}


module.exports = {
  db,
  getValidKeys,
  updateGame,
  getPuzzle,
  insertCompletionTimestamp,
  insertPuzzle,
  addPuzzleDataToPuzzlesTable,
}
