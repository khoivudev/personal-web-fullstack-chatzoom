const createError = require("http-errors");
const moment = require("moment");
const mongoose = require("mongoose");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const expressLayouts = require("express-ejs-layouts");
const flash = require("connect-flash");
require("dotenv/config");

const express = require("express");
const http = require("http");
const session = require("express-session");

const passport = require("passport");
//Passport config
require("./config/passport")(passport);

const formatMessage = require("./utils/chat/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/chat/users");
const {
  onAuthorizeSuccess,
  onAuthorizeFail,
} = require("./utils/chat/socket_auth");
const passportSocketIo = require("passport.socketio");
const MongoStore = require("connect-mongo")(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });

const userRouter = require("./routes/user");
const chatRouter = require("./routes/chat");

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set("view engine", "ejs");
app.use(logger("dev"));

//Body Parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

//Express Session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
    key: "express.sid",
    store: store,
  })
);

//Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Connect Flash
app.use(flash());

//Global Vars
app.use((req, res, next) => {
  //App message
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");

  //User Authenticate
  res.locals.user_is_logged_in = req.isAuthenticated();
  res.locals.user = req.user;

  next();
});

//Routes
app.get("/", (req, res) => {
  res.redirect("/chat");
});

app.use("/user", userRouter);
app.use("/chat", chatRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("pages/error");
});

//Connect to DB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(console.log("MongoDB Connected!"))
  .catch((err) => console.log(err));

//INIT SOCKET
io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: "express.sid",
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail,
  })
);

const botName = "K-Zone Bot";
//Run when client connect
io.on("connection", (socket) => {
  /*
    WAY1: Emit message for the user that connecting
        socket.emit();
    WAY2: Emit message to all user EXCEPT the user connecting
        socket.broadcast.emit();
    WAY3: Emit message for all
        io.emit()
    */
  socket.on("joinRoom", ({ room }) => {
    const user = userJoin(socket.id, socket.request.user.username, room);

    socket.join(user.room);

    //Welcome current user
    socket.emit("message", {
      username: botName,
      text: "Welcome to ChatRoom!",
      time: moment().format("h:mm a"),
      client: socket.request.user.username,
    });

    //Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    //Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  //Listen for chat message
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(`${user.username}`, msg));
  });

  //Run when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );
    }
  });
});

const PORT = process.env.PORT;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
