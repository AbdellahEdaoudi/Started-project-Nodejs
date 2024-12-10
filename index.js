require('dotenv').config();
const express = require("express");
const app = express();
const cookiesParser = require("cookie-parser")
const cors = require("cors");
const PORT = 1111;
const { connectDB } = require('./config/dbConnect');
const { corsOption } = require('./config/corsoptions');
const authRoutes = require("./routes/authRoutes")
const path = require("path")


connectDB()
app.use(cors(corsOption));
app.use(cookiesParser())
app.use(express.json());
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Routes
app.use("/api", authRoutes);


app.use("/",express.static(path.join(__dirname,"public")));
app.get('/',(req,res)=>{
  res.sendFile(path.join(__dirname,"./Views/index.html"))
})
app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ message: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});