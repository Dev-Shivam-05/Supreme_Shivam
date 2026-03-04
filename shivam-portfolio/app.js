const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const trackerMiddleware = require("./middlewares/trackerMiddleware");
const indexRoutes = require("./routes/indexRoutes");
const adminRoutes = require("./routes/adminRoutes");
const projectRoutes = require("./routes/projectRoutes");
const blogRoutes = require("./routes/blogRoutes");

dotenv.config();

const app = express();

connectDB();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "session_secret",
    resave: false,
    saveUninitialized: false
  })
);
app.use(flash());
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.use(trackerMiddleware);
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRoutes);
app.use("/admin", adminRoutes);
app.use("/projects", projectRoutes);
app.use("/blog", blogRoutes);

app.use((req, res) => {
  res.status(404).send("Not Found");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);