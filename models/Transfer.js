const mongoose = require("mongoose");

const TransferSchema = new mongoose.Schema(
  {
    sender: { type: String },
    receiver: { type: String },
    receiverId: { type: String },
    amount: { type: Number },
    remark: { type: String },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transfer", TransferSchema);
