import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  id: Number,
  password: String,
  uploads: {
    type: Array,
    default: []
  },
  token: String
});

const User = mongoose.model("Users", UserSchema);

export default User;
