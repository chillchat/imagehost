import crypto from "crypto"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const UserSchema = new mongoose.Schema({
  id: Number,
  email: String,
  username: String,
  password: String,
  uploads: {
    type: Array,
    default: []
  },
  _salt: String,
  token: String
})

const User = mongoose.model("Users", UserSchema)

export default User

export async function createUser(u) {
  const salt = crypto.randomBytes(16).toString("hex")
  const password = crypto.scryptSync(u.password, salt, 64).toString("base64")
  const user = {
    id: Date.now(),
    email: u.email,
    username: u.username,
    password,
    _salt: salt
  }
  const token = jwt.sign(user, salt)
  user.token = token
  return (await User.create(user))
}

export async function verifyToken(token) {
  const salt = (await User.findOne({ token })).toJSON()._salt
  return jwt.verify(token, salt)
}

export async function getUser(id) {
  return (await User.findOne({ id }))
}