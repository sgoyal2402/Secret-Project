//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const url =
  "mongodb+srv://admin-surya:<password>@cluster0-admca.mongodb.net/userDB";
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
};

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "This is our little secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(url, options);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile);
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);
app.get("/", (req, res) => {
  res.render("home");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/secrets", (req, res) => {
  let logIn = 0;
  if (req.isAuthenticated()) {
    logIn = 1;
  }
  User.find({ secret: { $ne: null } }, (err, docs) => {
    if (err) console.log(err);
    else {
      if (docs) {
        res.render("secrets", { usersWithSecrets: docs, logIn: logIn });
      }
    }
  });
});

app.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else res.redirect("/login");
});

app.post("/submit", (req, res) => {
  const submittedSecret = req.body.secret;
  console.log(req.user);
  User.findById(req.user.id, (err, doc) => {
    if (err) console.log(err);
    else {
      if (doc) {
        doc.secret = submittedSecret;
        doc.save(() => {
          res.redirect("/secrets");
        });
      }
    }
  });
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.post("/register", (req, res) => {
  User.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, () => {
          res.redirect("/secrets");
        });
      }
    }
  );
});

app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, (err) => {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/secrets");
      });
    }
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running successfully");
});
