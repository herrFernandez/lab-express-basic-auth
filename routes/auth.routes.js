const router = require("express").Router();

const { User } = require("../models/User.model");
const {
  ensureUserIsLoggedOut,
  ensureUserIsLoggedIn,
} = require("../middlewares/loginChecks");
const { ensureUserIsSubscribed } = require("../middlewares/subscribedCheck");
const bcryptjs = require("bcryptjs");
const saltRounds = 10;

// SIgn Up
router.get("/signup", ensureUserIsLoggedOut, (req, res, next) => {
  res.render("auth/signup");
});

router.post("/signup", async (req, res, next) => {
  const { email, passwordHash } = req.body;

  const salt = await bcryptjs.genSalt(saltRounds);
  console.log(salt);

  const hash = await bcryptjs.hash(passwordHash, salt);
  console.log(hash);

  const newUser = new User({ email, passwordHash: hash });
  await newUser.save();

  res.redirect("/main");
});

// main

router.get("/main", ensureUserIsLoggedIn, async (req, res) => {
  const user = await User.findOne({ email: req.session.currentUser.email });

  res.render("auth/main", { email: user.email });
});

router.post("/logout", (req, res, next) => {
  console.log("logging out...");
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

// Login

router.get("/login", ensureUserIsLoggedOut, (req, res) => {
  res.render("auth/login");
});

router.post("/login", async (req, res) => {
  console.log(req.body);

  const existingUser = await User.findOne({ email: req.body.email });

  if (!existingUser) {
    console.log("Failed to find user with that email");
    return res.render("auth/login", {
      error: "Failed to find user with that email, Sign up first please!",
    });
  }

  const passwordIsCorrect = await bcryptjs.compare(
    req.body.passwordHash,
    existingUser.passwordHash
  );

  if (!passwordIsCorrect) {
    console.log("wrong password");
    return res.render("auth/login", { error: "there was an error logging in" });
  }

  console.log("correct password!");
  req.session.currentUser = {
    email: existingUser.email,
    subscribed: existingUser.subscribed,
  };
  return res.redirect("/main");
});




// Private area

router.get("/subscribe", ensureUserIsLoggedIn, (req, res) => {
  res.render("auth/subscribe");
});

router.get(
  "/private-area",
  ensureUserIsLoggedIn,
  ensureUserIsSubscribed,
  (req, res) => {
    res.render("auth/private");
  }
);

module.exports = router;
