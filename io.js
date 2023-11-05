const socket = require("socket.io");

const io = (server) => {
  const socketIo = socket(server);

  return socketIo;
};

module.exports = { io };
