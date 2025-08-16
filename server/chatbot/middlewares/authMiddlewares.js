import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const authMiddleware = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      if (user.currentToken !== token)
        return res.status(401).json({ message: "Unauthorized: Invalid token" });

      req.user = user;
      next();
    } catch (error) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Token invalid or expired" });
    }
  } else {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }
};
