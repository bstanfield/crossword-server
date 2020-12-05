const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const port = process.env.PORT || 4001;
const index = require("./routes/index");
const cors = require('cors');

const app = express();
app.use(cors());

app.use(index);

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: '*',
  }
});

const randomColors = ['red', 'purple', 'blue']

let boardGuesses = ["", "", "", false, false, "", "", "", "", "", false, "", "", "", "", "", "", "", "", false, "", "", "", "", "", false, "", "", "", "", "", "", "", "", "", "", "", "", "", "", false, "", "", "", "", false, "", "", "", "", "", false, "", "", "", "", false, "", "", "", "", "", "", "", "", "", "", false, false, "", "", "", "", "", "", "", "", "", false, "", "", "", false, "", "", "", "", "", "", "", "", "", "", false, false, "", "", "", "", false, "", "", "", "", "", false, false, false, "", "", "", "", "", "", "", "", "", false, false, false, "", "", "", "", "", false, "", "", "", "", false, false, "", "", "", "", "", "", "", "", "", "", false, "", "", "", false, "", "", "", "", "", "", "", "", "", false, false, "", "", "", "", "", "", "", "", "", "", false, "", "", "", "", false, "", "", "", "", "", false, "", "", "", "", false, "", "", "", "", "", "", "", "", "", "", "", "", "", "", false, "", "", "", "", "", false, "", "", "", "", "", "", "", "", false, "", "", "", "", "", false, false, "", "", ""]
let clientsHighlights = {}
let connectedClients = {}
let assignedColors = 0
let secondsElapsed = 0
setInterval(() => {
  secondsElapsed++
}, 1000)

io.on("connection", (socket) => {
  socket.emit('boardGuesses', boardGuesses);
  socket.emit('id', socket.id)
  socket.emit('secondsElapsed', secondsElapsed)
  console.log('New client: ', socket.id);

  // Assigns a color for the client
  connectedClients[socket.id] = randomColors[assignedColors]
  assignedColors++

  // hardcoded to number of randomColors
  if (assignedColors > 2) {
    assignedColors = 0
  }

  // Tell all clients # of clients
  io.emit('newPlayer', connectedClients)

  socket.on('message', data => {
    console.log(`Client ${socket.id} sent a message.`);
    const { type, value } = data

    // Registers a square input letter change
    if (type === 'input') {
      const { position, letter, iterator } = value;

      boardGuesses[position - 1] = letter;
      socket.broadcast.emit('inputChange', { position: position - 1, letter });
    }

    // Sends highlight information for clients
    if (type === 'newHighlight') {
      const { id } = socket;
      const color = connectedClients[id]
      clientsHighlights[id] = { squares: value, color }
      console.log('client highlights: ', clientsHighlights)
      socket.broadcast.emit('newHighlight', clientsHighlights)
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
      io.emit('newPlayer', connectedClients)
      io.emit('newHighlight', clientsHighlights)
      // console.log('~~~~~~~~~~~')
    }
  });
});

server.listen(port, () => console.log(`Listening on port ${port}`));