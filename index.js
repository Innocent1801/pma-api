const express = require("express");
const app = express();
const http = require("http");

const server = http.createServer(app);
const io = require("./services/socket")(server);

const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const router = require("./routes/index");

// io(server);

dotenv.config();

// connection to database
mongoose.set("strictQuery", true);
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database connected"))
  .catch((err) => console.log(err));

//   middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(morgan("common"));
app.use(helmet());

app.use(router);

// connection to the server
server.listen(process.env.PORT || 8501, () => {
  console.log("Server running on port 8501");
});
