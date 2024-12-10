
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require('../models/User');
const nodemailer = require("nodemailer");


exports.registerUser = async (req, res) => {
  try {
    console.log("Request Body:", req.body);

    const { name, email, pass, role } = req.body;

    if (!name || !email || !pass) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const foundUser = await User.findOne({ email }).exec();
    if (foundUser) {
      return res.status(401).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(pass, 10);
    const user = new User({ name, email, pass: hashedPassword, role });
    await user.save();

    const accessToken = jwt.sign(
      { UserInfo: { id: user._id, role: user.role } },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30m" }
    );

    const refreshToken = jwt.sign(
      { UserInfo: { id: user._id, role: user.role } },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: false, // true if using HTTPS
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.loginUser = async (req, res) => {
  const { email, pass } = req.body;
  if (!email || !pass) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const foundUser = await User.findOne({ email }).exec();
    if (!foundUser) {
      return res.status(401).json({ message: "User does not exist" });
    }
    const match = await bcrypt.compare(pass, foundUser.pass);
    if (!match) return res.status(401).json({ message: "Wrong Password" });
    const accessToken = jwt.sign(
      { UserInfo: { id: foundUser._id, role: foundUser.role } },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn:"15m"}
    );
    const refreshToken = jwt.sign(
      { UserInfo: { id: foundUser._id, role: foundUser.role } },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: false,  // true for https
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({
      accessToken,
      email: foundUser.email,
      name: foundUser.name,      
      role: foundUser.role,

    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.refresh = (req, res) => {
  const cookies = req.cookies;
  console.log("Cookies:", cookies); 
  if (!cookies?.jwt) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const refreshToken = cookies.jwt;
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const foundUser = await User.findById(user.UserInfo.id).exec();
    if (!foundUser) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const accessToken = jwt.sign(
      { UserInfo: { id: foundUser._id, role: foundUser.role } },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30m"}
    );
    
    return res.json({ accessToken });
  });
};

exports.logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  res.clearCookie('jwt', {
    httpOnly: true,
    sameSite: 'None',
    secure: true,
  });
  res.json({ message: 'Cookie cleared' });
};


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD_EMAIL,
  }
});

exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const user = await User.findOne({ email }).exec();
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = jwt.sign(
      { id: user._id },
      process.env.RESET_PASSWORD_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: `${process.env.EMAIL}`,
      to: email,
      subject: "Password Reset Request",
      html: `<p>Click the link below to reset your password:</p>
             <a href="${resetLink}">${resetLink}</a>`,
    });

    res.json({ 
      message: "Password reset link sent to your email.",
      resetToken : resetToken
     });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword)
    return res.status(400).json({ message: "Token and new password are required" });

  try {
    const decoded = jwt.verify(token, process.env.RESET_PASSWORD_TOKEN_SECRET);
    const user = await User.findById(decoded.id).exec();

    if (!user) return res.status(404).json({ message: "User not found" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.pass = hashedPassword;
    await user.save();

    res.json({ message: "Password has been reset successfully." });
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

exports.getUsers = async (req, res) => {
  try {
      const users = await User.find().select("-password").lean();
      res.json(users);
  } catch (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ message: "Error fetching users", error: err.message });
  }
};

exports.deleteAllUsers = async (req, res) => {
  try {
      await User.deleteMany({});
      res.json({ message: "All users deleted successfully" });
  } catch (err) {
      res.status(500).json({ message: "Error deleting all users", error: err.message });
  }
};
