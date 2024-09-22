require('dotenv').config();
const express = require("express");
const app = express();
const cookiesParser = require("cookie-parser")
const cors = require("cors");
const AuthController = require("./controllers/AuthController");
const UserController = require("./controllers/UserController")
const BookController = require("./controllers/BookController")
const { verifyJWT } = require("./middleware/verifyJWT");
const { verifyRole } = require("./middleware/verifyRole");
const { connectDB } = require('./config/dbConnect');
const { corsOption } = require('./config/corsoptions');
const Usr = require('./models/User');
const PORT = 1111;
const path = require("path")


connectDB()
app.use(cors(corsOption));
app.use(cookiesParser())
app.use(express.json());
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// Auth Routes
app.post("/register", AuthController.registerUser);
app.post("/login", AuthController.loginUser);
app.post("/refresh", AuthController.refresh);
app.post("/logout", AuthController.logout);
// User Routes
app.get("/users", UserController.getUsers);
// Book Routes
app.get("/books", BookController.getAllBooks);
app.post("/books", BookController.addBook);
app.delete("/books/:id",verifyJWT, verifyRole("admin"), BookController.deleteBookById);





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