const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const {
  findNewPuzzle,
  createDownAndAcrossWordGroupings,
  checkIfLetterAddsToScore
} = require('./data');
const db = require('./db');
const { getValidKeys } = require('./db');

const port = process.env.PORT || 4001;
const index = require("./routes/index");
const cors = require("cors");

const app = express();
app.use(cors());

app.use(index);

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

const instantiateGuesses = (grid) => grid.map(item => {
  if (item === '.') {
    return false
  } else {
    return ''
  }
})

const getPuzzle = async (day) => {
  const board = await findNewPuzzle(day || 'Monday');
  const { grid } = board
  const guesses = instantiateGuesses(grid)
  const { across, down } = createDownAndAcrossWordGroupings(board);

  return {
    board,
    guesses,
    mappings: {
      across,
      down,
    },
    scores: {
      claimedGuesses: [],
      claimedGuessesLookup: {
        // ben: [14, 23, 18],
      },
      longestWord: {
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

// Move to Heroku env
const randomColors = ["red", "purple", "blue"];

let startTime = Date.now();
let clientsHighlights = {};
let connectedClients = {};
let assignedColors = 0;

const startSocketServer = async () => {
  // This will hold all active puzzle boards
  // TODO: Add timestamp to puzzles and expire them
  let puzzles = {};
  const validKeys = (await getValidKeys()).map(key => key.name);

  io.on("connection", async (socket) => {
    console.log("New client: ", socket.id);

    // Assign to room and hand down board
    socket.on("join", async (room) => {
      // Reject invalid room keys
      if (!validKeys.includes(room)) {
        return socket.emit("reject", "invalid key");
      }

      // If the room doesn't have a puzzle yet, create one
      if (!puzzles[room]) {
        // No puzzle in memory, but maybe in DB?
        let puzzle;
        let puzzleFromDB;
        try {
          puzzleFromDB = await db.getPuzzle(room);
          // Catch for old puzzles without scores
          if (!puzzleFromDB[0].scores || !puzzleFromDB[0].scores.claimedGuessesLookup) {
            puzzleFromDB = [];
          }
        } catch (err) {
          console.log('ERROR: ', err)
        }

        if (puzzleFromDB.length > 0) {
          puzzleFromDB[0].guesses = JSON.parse(puzzleFromDB[0].guesses)
          puzzle = puzzleFromDB[0];
        } else {
          puzzle = await getPuzzle();

          try {
            db.insertPuzzle(room, puzzle.board, puzzle.mappings, puzzle.guesses, puzzle.scores)
          } catch (err) {
            console.log('ERROR: ', err)
          }
        }

        puzzles[room] = puzzle
      }

      // Send stuff down to new client
      console.log(socket.id, 'joining ', room)
      socket.join(room)

      // TODO: Combine
      socket.emit("board", puzzles[room].board);
      socket.emit("guesses", puzzles[room].guesses);
      socket.emit("scores", puzzles[room].scores);

      socket.emit("id", socket.id);
      socket.emit("timestamp", startTime);

      // Add client to list of clients
      connectedClients[socket.id] = { ...connectedClients[socket.id], ...{ room, name: 'Anon' } };

      // Count clients in room
      let count = 0
      for (const [key, value] of Object.entries(connectedClients)) {
        if (value.room === room) {
          count++
        }
      }

      // Tell everyone in the room about the new client
      io.to(room).emit("newPlayer", count);
    })

    socket.on("name", (name) => {
      if (name) {
        console.log(socket.id, ' name is ', name);
        connectedClients[socket.id] = { ...connectedClients[socket.id], ...{ name } };
      }
    })

    // Room agnostic code
    // Assigns a color for the client
    connectedClients[socket.id] = { ...connectedClients[socket.id], ...{ color: randomColors[assignedColors] } };
    assignedColors++;

    // hardcoded to number of randomColors
    if (assignedColors > 2) {
      assignedColors = 0;
    }

    socket.on("message", async (data) => {
      const { room } = connectedClients[socket.id];
      const { name, type, value } = data;

      // Catch for out-of-sync name
      if (name !== connectedClients[socket.id].name) {
        console.log(name, 'is not ', connectedClients[socket.id].name)
        connectedClients[socket.id].name = name
      }

      // Registers a square input letter change
      if (type === "input") {
        const { position, letter, iterator } = value;
        const correctLetter = puzzles[room] ? puzzles[room].board.grid[position - 1] : '?';

        // Check if input is actually a letter, and then if correct/incorrect
        // Checks if guess tile has already been correctly guessed by someone
        if (
          letter !== '' &&
          !puzzles[room].scores.claimedGuesses.includes(position)
        ) {
          if (
            correctLetter &&
            correctLetter.toLowerCase() === letter
          ) {
            checkIfLetterAddsToScore(puzzles[room], name, position, letter, true);

          } else {
            checkIfLetterAddsToScore(puzzles[room], name, position, letter, false);
          }
          io.to(room).emit("scores", puzzles[room].scores);
        }

        puzzles[room].guesses[position - 1] = letter;
        socket.to(room).emit("inputChange", { position: position - 1, letter });

        // Register guess in DB
        try {
          db.updateGame(room, puzzles[room].guesses, puzzles[room].scores);
        } catch (err) {
          console.log('ERROR: ', err)
        }
      }

      if (type === "newPuzzle") {
        console.log('New puzzle requested for room ', room)

        // Loading state for everyone in room
        io.in(room).emit("loading", true);
        const puzzle = await getPuzzle(value);
        puzzles[room] = puzzle;

        try {
          db.insertPuzzle(room, puzzle.board, puzzle.mappings, puzzle.guesses, puzzle.scores)
        } catch (err) {
          console.log('ERROR: ', err)
        }

        io.in(room).emit("guesses", puzzles[room].guesses);
        io.in(room).emit("board", puzzles[room].board);
        startTime = Date.now()
        io.in(room).emit("timestamp", startTime)

        // Clear old highlights for room
        let highlightsToKeep = {};
        for (const [key, value] of Object.entries(clientsHighlights)) {
          if (value.room !== room) {
            highlightsToKeep[key] = value;
          }
        }
        clientsHighlights = highlightsToKeep;
        socket.to(room).emit("newHighlight", clientsHighlights);
        io.in(room).emit("loading", false);
      }

      // Sends highlight information for clients
      if (type === "newHighlight") {
        const { color, name } = connectedClients[socket.id];
        clientsHighlights[socket.id] = { squares: value, color, room, name, id: socket.id };

        socket.to(room).emit("newHighlight", clientsHighlights);
      }
    });

    socket.on("disconnect", () => {
      const clientToDelete = connectedClients[socket.id];
      console.log(socket.id, ' left ', clientToDelete.room)
      if (clientToDelete) {
        // Check room before deleting
        const room = clientToDelete.room
        delete connectedClients[socket.id];
        delete clientsHighlights[socket.id];

        // Recount clients in room
        let count = 0
        for (const [key, value] of Object.entries(connectedClients)) {
          if (value.room === room) {
            count++
          }
        }
        io.to(room).emit("newPlayer", count);

        // TODO: Make highlights room specific
        io.to(room).emit("newHighlight", clientsHighlights);
      }
    });
  });
}

startSocketServer();

server.listen(port, () => console.log(`Listening on port ${port}`));
