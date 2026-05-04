import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (token && token.startsWith("Bearer")) {
      token = token.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");

      req.user = user;

      next();
    } else {
      res.status(401).json({ message: "Not authorized" });
    }
  } catch (error) {
    res.status(401).json({ message: "Token invalid" });
  }
};