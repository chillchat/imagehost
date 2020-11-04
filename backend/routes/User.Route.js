import express from "express";
import UserModel from "../models/User.Model.js";
import Upload from "../uploader.js";

const User = express.Router();

User.post("/upload", Upload.single("image"), async (req, res) => {
  const destArr = req.file.destination.split("/");
  const uid = destArr[destArr.length - 1];
  const file = { ...req.file, timestamp: Date.now() };
  const user = await UserModel.findOneAndUpdate(
    { id: uid },
    { $push: { uploads: file } },
    { new: true }
  );
  res.json({ upload: file, uid: user.toJSON().id });
});

User.delete("/upload", async (req, res) => {
  if (!req.headers.authorization) {
    return res.sendStatus(401);
  }
  if (!req.body.file) {
    return res.sendStatus(400);
  }
  const user = await UserModel.findOne({ token: req.headers.authorization });
  user.uploads = user.uploads.filter(f => f.filename !== req.body.file);
  user.save();
  res.sendStatus(201)
});

User.get("/uploads", async (req, res) => {
  if (!req.headers.authorization) {
    return res.sendStatus(401);
  }
  const user = await UserModel.findOne({ token: req.headers.authorization });
  res.json(user.toJSON().uploads);
});

User.get("/:id/uploads", async (req, res) => {
  const user = await UserModel.findOne({ id: req.params.id });
  if (!user) {
    return res.sendStatus(404);
  }
  res.json(user.toJSON().uploads);
});

export default User;
