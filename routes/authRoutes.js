const express = require("express");
const app = express.Router();
const AuthController = require("../controllers/AuthController")
const { verifyJWT } = require("../middleware/verifyJWT");
const { verifyRole } = require("../middleware/verifyRole");

// Auth Routes
app.get("/users", AuthController.getUsers);
app.delete("/users", AuthController.deleteAllUsers);
app.post("/register", AuthController.registerUser);
app.post("/login", AuthController.loginUser);
app.post("/refresh", AuthController.refresh);
app.post("/logout", AuthController.logout);
app.post("/request-password-reset", AuthController.requestPasswordReset);
app.post("/reset-password", AuthController.resetPassword);


module.exports = app ;