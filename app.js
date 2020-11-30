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

const randomColors = ['#FCEE7F', '#FF2865', '#A13BE0', '#28CBFF']

let boardGuesses = ['', '', '', '', false, '', '', '', '', '', false, '', '', '', '', '', '', '', '', false, '', '', '', '', '', false, '', '', '', '', '', '', '', '', '', '', '', '', '', '', false, '', '', '', '', '', '', '', '', '', '', false, '', '', '', '', '', '', '', '', false, false, '', '', '', false, '', '', '', '', '', '', '', '', '', '', '', '', false, '', '', '', false, '', '', '', '', false, false, false, '', '', '', '', '', '', '', '', false, false, '', '', '', '', '', '', '', '', '', false, '', '', '', '', '', false, '', '', '', '', '', '', '', '', '', false, false, '', '', '', '', '', '', '', '', false, false, false, '', '', '', '', false, '', '', '', false, '', '', '', '', '', '', '', '', '', '', '', '', false, '', '', '', false, false, '', '', '', '', '', '', '', '', false, '', '', '', '', '', '', '', '', '', '', false, '', '', '', '', '', '', '', '', '', '', '', '', '', '', false, '', '', '', '', '', false, '', '', '', '', '', '', '', '', false, '', '', '', '', '', false, '', '', '', '']
let clientsHighlights = {}
let connectedClients = {}

io.on("connection", (socket) => {
  socket.emit('inputChange', boardGuesses);
  console.log('New client: ', socket.id);

  // Assigns a color for the client
  connectedClients[socket.id] = randomColors[Math.floor(Math.random() * randomColors.length)]

  // Tell all clients # of clients
  io.emit('newPlayer', connectedClients)

  socket.on('message', data => {
    console.log(`Client ${socket.id} sent a message.`);
    const { type, value } = data

    // Registers a square input letter change
    if (type === 'input') {
      const { position, letter, iterator } = value;

      boardGuesses[position - 1] = letter;
      socket.broadcast.emit('inputChange', boardGuesses);
    }

    // Sends highlight information for clients
    if (type === 'newHighlight') {
      const { id } = socket;
      const color = connectedClients[id]
      console.log('A player highlighted a new clue.')
      clientsHighlights[id] = { squares: value, color }
      console.log('sending this: ', clientsHighlights)
      socket.broadcast.emit('newHighlight', clientsHighlights)
    }
  });


  socket.on("disconnect", () => {
    console.log('~~~~~~~~~~~')
    console.log(`${socket.id} disconnected`);
    console.log('connected clients: ', connectedClients)
    const clientToDelete = connectedClients[socket.id];
    if (clientToDelete) {
      console.log('Deleted client')
      delete connectedClients[socket.id];
      delete clientsHighlights[socket.id];
      io.emit('newPlayer', connectedClients)
      io.emit('newHighlight', clientsHighlights)
      console.log('~~~~~~~~~~~')
    }
  });
});

server.listen(port, () => console.log(`Listening on port ${port}`));