
exports.verifyRole = (role) => {
    return (req, res, next) => {
      if (req.user.UserInfo.role !== role) {
        return res.status(403).json({ message: "Access denied" });
      }
      next();
    };
  };