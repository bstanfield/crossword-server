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
    origin: '*'
  }
});

let boardGuesses = ['t', 'a', null, null, null, false, null, null, null, null, false, null, null, null, null, null, null, null, null, null, false, null, null, null, null, false, null, null, null, null, null, null, null, null, null, false, null, null, null, null, null, null, null, null, null, false, false, null, null, null, null, false, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, false, null, null, null, null, null, null, false, null, null, null, false, null, null, null, null, false, false, false, null, null, null, false, null, null, null, null, false, false, false, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, false, false, false, null, null, null, null, false, null, null, null, false, false, false, null, null, null, null, false, null, null, null, false, null, null, null, null, null, null, false, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, false, null, null, null, null, false, false, null, null, null, null, null, null, null, null, null, false, null, null, null, null, null, null, null, null, null, false, null, null, null, null, false, null, null, null, null, null, null, null, null, null, false, null, null, null, null, false, null, null, null, null, null]

io.on("connection", (socket) => {
  console.log("New client connected");
  getBoardAndEmit(socket)

  socket.on('message', data => {
    const { position, letter, iterator } = data
    console.log('message received!', data)
    boardGuesses[position - 1] = letter
    io.sockets.emit("FromAPI", boardGuesses);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});



const getBoardAndEmit = socket => {
  // Emitting a new message. Will be consumed by the client
  socket.emit("FromAPI", boardGuesses);
};

server.listen(port, () => console.log(`Listening on port ${port}`));