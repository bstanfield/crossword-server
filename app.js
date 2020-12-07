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
  const board = await findNewPuzzle('Monday');
  const { grid } = board
  const guesses = instantiateGuesses(grid)
  return { board, guesses }
}

const randomColors = ["red", "purple", "blue"];

const startTime = Date.now();
let clientsHighlights = {};
let connectedClients = {};
let assignedColors = 0;

const startSocketServer = async () => {
  const puzzle = await getPuzzle();
  const { board, guesses } = puzzle;
  io.on("connection", (socket) => {
    console.log('sending board: ', board)
    socket.emit("board", board);
    socket.emit("guesses", guesses);
    socket.emit("id", socket.id);
    socket.emit("timestamp", startTime);
    console.log("New client: ", socket.id);

    // Assigns a color for the client
    connectedClients[socket.id] = randomColors[assignedColors];
    assignedColors++;

    // hardcoded to number of randomColors
    if (assignedColors > 2) {
      assignedColors = 0;
    }

    // Tell all clients # of clients
    io.emit("newPlayer", connectedClients);

    socket.on("message", (data) => {
      console.log(`Client ${socket.id} sent a message.`);
      const { type, value } = data;

      // Registers a square input letter change
      if (type === "input") {
        const { position, letter, iterator } = value;

        guesses[position - 1] = letter;
        socket.broadcast.emit("inputChange", { position: position - 1, letter });
      }

      // Sends highlight information for clients
      if (type === "newHighlight") {
        const { id } = socket;
        const color = connectedClients[id];
        clientsHighlights[id] = { squares: value, color };
        console.log("client highlights: ", clientsHighlights);
        socket.broadcast.emit("newHighlight", clientsHighlights);
      }
    });

    socket.on("disconnect", () => {
      // console.log('~~~~~~~~~~~')
      // console.log(`${socket.id} disconnected`);
      // console.log('connected clients: ', connectedClients)
      const clientToDelete = connectedClients[socket.id];
      if (clientToDelete) {
        // console.log('Deleted client')
        delete connectedClients[socket.id];
        delete clientsHighlights[socket.id];
        io.emit("newPlayer", connectedClients);
        io.emit("newHighlight", clientsHighlights);
        // console.log('~~~~~~~~~~~')
      }
    });
  });
}

startSocketServer();



server.listen(port, () => console.log(`Listening on port ${port}`));
