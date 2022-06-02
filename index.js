const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

async function emitSocketsActivos() {
  const sockets = await io.fetchSockets();
  const chatAactivos = [];
  for (const socket of sockets) {
    chatAactivos.push(socket.username);
  }

  io.emit("users active", { actives: chatAactivos });
}

io.on("connection", (socket) => {
  emitSocketsActivos();

  // CUANDO SE CONECTE
  socket.on("connect", () => {});

  // CUANDO SE DESCONECTA
  socket.on("disconnect", (reason) => {
    // actualizamos activos
    emitSocketsActivos();
    io.except(socket.id).emit("alert disconnect", {
      msg: "se desconecto!",
      user: socket.username,
    });
  });

  // CUANDO SE ENVIE UN MENSAJE
  socket.on("chat message", (anotherSocketId, msg) => {
    io.except(anotherSocketId).emit("chat message", {
      user: socket.username,
      msg,
    });
  });

  // CUANDO ESCRIBA
  socket.on("statusPress", (anotherSocketId, msg) => {
    io.except(anotherSocketId).emit("statusPress", socket.username + msg);
  });

  // CUANDO DEJE DE ESCRIBIR
  socket.on("statusUp", (anotherSocketId, msg) => {
    io.except(anotherSocketId).emit("statusUp", msg);
  });

  // AÑADIR USERNAME
  socket.on("set username", (username) => {
    socket.username = username;
    emitSocketsActivos();
  });
});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
