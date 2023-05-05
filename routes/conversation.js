const router = require("express").Router();
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { verifyTokenAndAuthorization } = require("./jwt");

// send message
router.post("/send/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = req.user;
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
    if (findConversation) {
      const findMessages = await Message.find({
        conversationId: findConversation._id,
      });
      if (
        findConversation.sender === user.id ||
        findConversation.receiver === user.id
      ) {
        if (findConversation.sender === user.id) {
        }
        if (findConversation.sender === user.id) {
          await findConversation.updateOne({ $set: { isSenderRead: true } });
          await findConversation.updateOne({ $set: { senderMessages: 0 } });
        } else if (findConversation.receiver === user.id) {
          await findConversation.updateOne({ $set: { isReceiverRead: true } });
          await findConversation.updateOne({ $set: { receiverMessages: 0 } });
        }
        res.status(200).json(findMessages);
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
      const findConversation = await Conversation.find({
        $or: [{ sender: req.params.param }, { receiver: req.params.param }],
      });
      if (findConversation) {
        res.status(200).json(findConversation);
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
