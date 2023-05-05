const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema(
  {
    withdrawBy: { type: String },
    bankName: { type: String },
    accountNo: { type: String },
    accountName: { type: String },
    amount: { type: String },
    status: { type: String, default: "Pending" },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", InvoiceSchema);
