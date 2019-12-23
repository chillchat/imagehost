import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import express from "express"
import fs from "fs"
import { createUser, getUser, verifyToken } from "../models/User.Model.js"
import Upload from "../uploader.js"
const User = express.Router()

User.post("/register", async (req, res, next) => {
  const user = await createUser(req.body).catch((err) => {
    if (err) res.status(500).json(err)
  })
  console.log(user)
  res.json(user.toJSON().token)
  const userUploadPath = path.join(path.resolve(__dirname, "..", "uploads"), `${user.toJSON().id}`)
  if (!fs.existsSync(userUploadPath)) {
    fs.mkdirSync(userUploadPath);
  }
})

User.post("/login", async (req, res, next) => {
  const token = req.headers.authorization
  const verified = await verifyToken(token).catch((err) => {
    if (err) res.status(500).json(err)
  })
  console.log(verified)
  const user = await getUser(verified.id).catch((err) => {
    if (err) res.status(500).json(err)
  })
  console.log(user)
  res.json(user)
})

User.post("/upload/image", async (req, res, next) => {
  const token = req.headers.authorization
  const verified = await verifyToken(token).catch((err) => {
    if (err) res.status(500).json(err)
  })
  const user = await getUser(verified.id).catch((err) => {
    if (err) res.status(500).json(err)
  })
  req.user = user
  next(null)
}, Upload.single("image"), async (req, res, next) => {
  res.send({ file: req.file, userID: req.user.id })
  req.user.uploads.push(req.file)
  req.user.save()
})

User.get("/:id/uploads/:file", async (req, res, next) => {
  const user = await getUser(req.params.id).catch((err) => {
    if (err) res.status(500).json(err)
  })
  const filePath = user.toJSON().uploads.find(f => f.filename === req.params.file).path
  res.sendFile(filePath)
})

export default User