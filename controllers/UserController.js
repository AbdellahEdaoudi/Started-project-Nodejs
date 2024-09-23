
const User = require('../models/User');

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
