const socketIo = require("socket.io");

module.exports = (server) => {
  console.log("connected");

  const io = socketIo(server);

  io.on("connection", (socket) => {
    socket.on("join room", (userId) => {
      // Join the user to a room based on their userId
      socket.join(userId);
    });

    socket.on("chat message", (message, recipientUserId) => {
      // Send the message to the specific user's room
      io.to(recipientUserId).emit("chat message", message);
    });

    socket.on("chat conversation", (message, recipientUserId) => {
      // Send the message to the specific user's room
      io.to(recipientUserId).emit("chat conversation", message);
    });

    socket.on("disconnect", () => {});
  });

  return io; // Export the io instance
};
