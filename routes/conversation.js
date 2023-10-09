const router = require("express").Router();
const {
  sendMesageNotification,
} = require("../config/messageNotification.config");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Users = require("../models/Users");
const { verifyTokenAndAuthorization } = require("./jwt");

// send message
router.post("/send/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = req.user;
    const sender = await Users.findById(user.id);
    const findConversation = await Conversation.findById(req.params.id);

    if (findConversation) {
      if (
        findConversation.sender === user.id ||
        findConversation.receiver === user.id
      ) {
        const newMessage = new Message({
          conversationId: findConversation._id,
          message: req.body.message,
          sender: user.id,
        });

        if (findConversation.sender === user.id) {
          await findConversation.updateOne({ $set: { isReceiverRead: false } });

          await findConversation.updateOne({ $set: { isSenderRead: true } });
        } else if (findConversation.receiver === user.id) {
          await findConversation.updateOne({ $set: { isSenderRead: false } });

          await findConversation.updateOne({ $set: { isReceiverRead: true } });
        }

        await findConversation.updateOne({
          $set: { lastMessage: newMessage.message },
        });

        if (findConversation.sender === user.id) {
          await findConversation.updateOne({
            $set: { messages: findConversation.receiverMessages + 1 },
          });
        } else if (findConversation.receiver === user.id) {
          await findConversation.updateOne({
            $set: { messages: findConversation.senderMessages + 1 },
          });
        }

        await newMessage.save();

        res.status(200).json(newMessage);

        if (findConversation.sender === user.id) {
          const receiver = await Users.findById(findConversation.receiver);

          sendMesageNotification(
            (messageSender = sender.firstName),
            (messageReceiver = receiver.email)
          );
        } else if (findConversation.receiver === user.id) {
          const receiver = await Users.findById(findConversation.sender);

          sendMesageNotification(
            (messageSender = sender.firstName),
            (messageReceiver = receiver.email)
          );
        }
      } else {
        res.status(403).json("You do not have permission to send this message");
      }
    } else {
      res.status(404).json("Conversation cannot be found.");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// open message
router.get("/open/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = req.user;
    const findConversation = await Conversation.findById(req.params.id);

    const { page } = req.query;
    const pageSize = 10; // Number of items to return per page

    if (findConversation) {
      const findMessages = await Message.find({
        conversationId: findConversation._id,
      })
        .sort({ createdAt: -1 }) // Sort in descending order
        .select()
        .skip((parseInt(page) - 1) * pageSize)
        .limit(pageSize);

      const totalRecords = await Message.countDocuments();

      const totalPages = Math.ceil(totalRecords / pageSize);
      const currentPage = parseInt(page) || 1;

      if (
        findConversation.sender === user.id ||
        findConversation.receiver === user.id
      ) {
        if (findConversation.sender === user.id) {
          await findConversation.updateOne({ $set: { isSenderRead: true } });
          await findConversation.updateOne({ $set: { senderMessages: 0 } });
        } else if (findConversation.receiver === user.id) {
          await findConversation.updateOne({ $set: { isReceiverRead: true } });
          await findConversation.updateOne({ $set: { receiverMessages: 0 } });
        }

        const response = {
          totalPages,
          currentPage,
          length: totalRecords,
          conversation: findMessages,
        };

        res.status(200).json(response);
      } else {
        res.status(403).json("You do not have permission to send this message");
      }
    } else {
      res.status(404).json("Conversation cannot be found.");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json("Connection error!");
  }
});

// get message conversation
router.get(
  "/conversation/:id",
  verifyTokenAndAuthorization,
  async (req, res) => {
    try {
      const user = req.user;
      const findConversation = await Conversation.findById(req.params.id);

      if (findConversation) {
        if (
          findConversation.sender === user.id ||
          findConversation.receiver === user.id
        ) {
          res.status(200).json(findConversation);
        } else {
          res
            .status(403)
            .json("You do not have permission to send this message");
        }
      } else {
        res.status(404).json("Conversation cannot be found.");
      }
    } catch (err) {
      res.status(500).json("Connection error!");
    }
  }
);

// get conversations
router.get(
  "/conversations/:param",
  verifyTokenAndAuthorization,
  async (req, res) => {
    try {
      // Pagination parameters
      const { query, page } = req.query;
      const pageSize = 10; // Number of items to return per page

      const findConversation = await Conversation.find({
        $or: [{ sender: req.params.param }, { receiver: req.params.param }],
      })
        .sort({ createdAt: -1 }) // Sort in descending order
        .select()
        .skip((parseInt(page) - 1) * pageSize)
        .limit(pageSize);

      const totalRecords = await Conversation.countDocuments();

      const totalPages = Math.ceil(totalRecords / pageSize);
      const currentPage = parseInt(page) || 1;

      const response = {
        totalPages,
        currentPage,
        length: totalRecords,
        conversation: findConversation,
      };

      if (response.length > 0) {
        res.status(200).json(response);
      } else {
        res.status(404).json("Conversation cannot be found.");
      }
    } catch (err) {
      res.status(500).json("Connection error!");
    }
  }
);

// close conversation
router.put(
  "/close-conversation/:id",
  verifyTokenAndAuthorization,
  async (req, res) => {
    try {
      const user = req.user;
      const findConversation = await Conversation.findById(req.params.id);
      if (findConversation) {
        if (
          findConversation.sender === user.id ||
          findConversation.receiver === user.id
        ) {
          if (!findConversation.isClosed) {
            await findConversation.updateOne({ $set: { isClosed: true } });

            res.status(200).json("This conversation has been closed");
          } else {
            res
              .status(403)
              .json(
                "This conversation has been closed. You cannot have access to it anymore"
              );
          }
        } else {
          res
            .status(403)
            .json("You do not have permission to send this message");
        }
      } else {
        res.status(404).json("Conversation cannot be found.");
      }
    } catch (err) {
      res.status(500).json("Connection error!");
    }
  }
);

module.exports = router;
