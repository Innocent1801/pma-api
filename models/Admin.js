const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
  {
    aai: { type: String, default: "pma/20-22/admin" },
    firstName: { type: String },
    lastName: { type: String },
    username: { type: String },
    email: { type: String },
    password: { type: String },
    adminRole: { type: String, default: "admin" },
    isAdmin: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", AdminSchema);
