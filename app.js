require("dotenv").config();
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

const connectDB = require("./config/database");
const { hostRouter } = require("./routers/hostRouter");
const storeRouter = require("./routers/storeRouter");
const bookingRouter = require("./routers/bookingRouter");
const reviewRouter = require("./routers/reviewRouter");
const authRouter = require("./routers/authRouter");
const errorController = require("./controllers/errorController");
const { isAuth } = require("./middleware/authMiddleware");

const app = express();
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/airbnb";

const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

app.set("view engine", "ejs");
app.set("views", "views");

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "my-secret-key",
    resave: false,
    saveUninitialized: false,
    store,
  })
);

app.use(storeRouter);
app.use(reviewRouter);
app.use(bookingRouter);
app.use(authRouter);
app.use("/host", isAuth, hostRouter);

app.use(errorController.get404);

const PORT = process.env.PORT || 3001;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed:", err);
  });
