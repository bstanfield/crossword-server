const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { findNewPuzzle } = require('./data')

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

const getPuzzle = async () => {
  // Hardcoded dayz for now
  const board = await findNewPuzzle('Tuesday');
  const { grid } = board
  const guesses = instantiateGuesses(grid)
  return { board, guesses }
}

const randomColors = ["red", "purple", "blue"];

let startTime = Date.now();
let clientsHighlights = {};
let connectedClients = {};
let assignedColors = 0;

const startSocketServer = async () => {
  let puzzles = {};
  puzzle = await getPuzzle();
  io.on("connection", async (socket) => {
    console.log("New client: ", socket.id);

    // Assign to room and hand down board
    socket.on("join", async (room) => {
      // If the room doesn't have a puzzle yet, create one
      if (!puzzles[room]) {
        console.log('creating puzzle for new room ', room)
        puzzles[room] = await getPuzzle();
      }

      // Send stuff down new client
      console.log(socket.id, 'joining ', room)
      socket.join(room)

      socket.emit("board", puzzles[room].board);
      socket.emit("guesses", puzzles[room].guesses);
      socket.emit("id", socket.id);
      socket.emit("timestamp", startTime);

      // Add client to list of clients
      connectedClients[socket.id] = { ...connectedClients[socket.id], ...{ room } };

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

    // Room agnostic code
    // Assigns a color for the client
    connectedClients[socket.id] = { ...connectedClients[socket.id], ...{ color: randomColors[assignedColors] } };
    assignedColors++;

    // hardcoded to number of randomColors
    if (assignedColors > 2) {
      assignedColors = 0;
    }

    socket.on("message", async (data) => {
      console.log(`Client ${socket.id} sent a message.`);
      const { room } = connectedClients[socket.id];
      const { type, value } = data;

      // Registers a square input letter change
      if (type === "input") {
        const { position, letter, iterator } = value;

        puzzles[room].guesses[position - 1] = letter;
        socket.to(room).emit("inputChange", { position: position - 1, letter });
      }

      // This is quite slow...
      if (type === "newPuzzle") {
        console.log('New puzzle requested for room ', room)

        // Loading state for everyone in room
        io.in(room).emit("alert", "loading");
        puzzles[room] = await getPuzzle();
        io.in(room).emit("board", puzzles[room].board);
        io.in(room).emit("guesses", puzzles[room].guesses);
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
      }

      // Sends highlight information for clients
      if (type === "newHighlight") {
        const color = connectedClients[socket.id].color;
        clientsHighlights[socket.id] = { squares: value, color, room };

        socket.to(room).emit("newHighlight", clientsHighlights);
      }
    });

    socket.on("disconnect", () => {
      const clientToDelete = connectedClients[socket.id];
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
