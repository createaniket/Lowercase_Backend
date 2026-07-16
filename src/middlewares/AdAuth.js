const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const AdAuth = async (req, res, next) => {
  try {
    const header = req.header("Authorization");
    if (!header) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = header.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.AdminTokenKey);

    const admin = await Admin.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!admin) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    req.admin = admin;
    req.token = token;
    return next();
  } catch (e) {
    return res.status(401).json({ error: "Not authorized" });
  }
};

module.exports = AdAuth;
