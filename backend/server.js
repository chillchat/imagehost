import config from "./private/config.js"
import cors from "cors"
import express from "express"
import mongoose from "mongoose"
import UserRouter from "./routes/User.Route.js"

mongoose.connect(config.database.uri, {
  dbName: config.database.name,
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const db = mongoose.connection
db.on("error", console.error.bind(console, "MongoDB error:"))
db.on("open", () => {
  console.log("Connected to MongoDB")
})

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use((req, res, next) => {
  req.db = db
  next()
})
app.use("/users", UserRouter)
app.listen(4200, () => {
  console.log("Listening on PORT 4200")
})