const mongoose = require("mongoose");

const LoginSchema = new mongoose.Schema(
  {
    login: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Login", LoginSchema);
