import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import config from "./private/config.js";
import cors from "cors";
import passportDiscord from "passport-discord";
import passport from "passport";
import express from "express";
import mongoose from "mongoose";
import UserRouter from "./routes/User.Route.js";
import jwt from "jsonwebtoken";
import argon2 from "argon2";
import User from "./models/User.Model.js";
import fs from "fs";
const DiscordStrategy = passportDiscord.Strategy;

mongoose.connect(config.database.uri, {
  dbName: config.database.name,
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB error:"));
db.on("open", () => {
  console.log("Connected to MongoDB");
});

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(
  new DiscordStrategy(
    {
      clientID: config.clientID,
      clientSecret: config.clientSecret,
      callbackURL: "http://localhost:4200/api/auth/callback",
      scope: ["identify", "email"]
    },
    (access, refresh, profile, cb) => {
      return cb(null, { ...profile, access, refresh });
    }
  )
);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  req.db = db;
  next();
});
app.use("/", express.static("BHCC"))
app.use("/api/users", UserRouter);
app.get("/:id/:file", async (req, res) => {
  const user = await User.findOne({ id: req.params.id });
  const file = user.toJSON().uploads.find(f => f.filename === req.params.file);
  res.sendFile(file.path);
});
app.get("/:id/:file/info", async (req, res) => {
  const user = await User.findOne({ id: req.params.id });
  const file = user.toJSON().uploads.find(f => f.filename === req.params.file);
  res.json(file);
});
app.get("/api/auth", passport.authenticate("discord"));

app.post(
  "/api/auth/callback",
  passport.authenticate("discord", {
    failureMessage: "Failed to authenticate",
    session: false
  }),
  async (req, res) => {
    if (!(await User.findOne({ id: req.user.id }))) {
      const password = await argon2
        .hash(req.body.password)
        .catch(err => res.status(500).json(err));
      if (typeof password === "string") {
        console.log(password);
        const token = jwt.sign(req.user.id, password);
        const user = await User.create({
          id: req.user.id,
          password,
          uploads: [],
          token
        });

        const userUploadPath = path.join(
          path.resolve(__dirname, "uploads"),
          `${user.toJSON().id}`
        );
        if (!fs.existsSync(userUploadPath)) {
          fs.mkdirSync(userUploadPath);
        }

        res.json(user.toJSON());
      }
    } else {
      const user = await User.findOne({ id: req.user.id });
      const userUploadPath = path.join(
        path.resolve(__dirname, "uploads"),
        `${user.toJSON().id}`
      );
      if (!fs.existsSync(userUploadPath)) {
        fs.mkdirSync(userUploadPath);
      }
      res.json(user.toJSON());
    }
  }
);
app.listen(4200, () => {
  console.log("Listening on PORT 4200");
});
