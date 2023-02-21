const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const handlebars = require("express-handlebars");
const path = require("path");
require("dotenv").config();
const route = require("./resource/router");
const app = express();
const port = 3001;

app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: "https://figureshop-beta.vercel.app",
    methods: "GET,POST,PUT,DELETE",
  })
);
app.engine(
  "hbs",
  handlebars({
    extname: ".hbs",
  })
);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "resource/views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "build")));

route(app);

app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(process.env.PORT || port, () => {
  console.log(`App listening on port ${port}`);
});
