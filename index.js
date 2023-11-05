const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const { default: axios } = require("axios");
const { baseUrl } = require("./.routes");

const server = http.createServer(app);

const io = socketIo(server);

//   middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

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

app.post("/conversation/send/:id", async (req, res) => {
  try {
    const message = req.body;
    const recipientUserId = req.body.uuid;
    const id = req.params.id;
    const headers = req.headers;

    const result = await axios.post(
      `${baseUrl}/conversation/send/${id}`,
      message,
      { headers }
    );

    const response = result.data;
    const now = new Date();

    response.createdAt = now;

    io.to(recipientUserId).emit("chat message", response);

    res.status(200).json(result.data);
  } catch (error) {}
});

// get conversation
app.get("/conversation/conversations/:id", async (req, res) => {
  try {
    const recipientUserId = req.body.uuid;
    const id = req.params.id;
    const headers = req.headers;

    const result = await axios.get(
      `${baseUrl}/conversation/conversations/${id}`,
      { headers }
    );

    const response = result.data;
    const now = new Date();

    response.createdAt = now;

    io.to(recipientUserId).emit("chat conversation", response.unreadMsgRecords);

    res.status(200).json(result.data);
  } catch (error) {}
});

// connection to the server
server.listen(process.env.PORT || 8501, () => {
  console.log("Server running on port 8501");
});
