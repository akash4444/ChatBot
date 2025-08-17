import User from "../models/userModel.js";
import { hashPassword, comparePassword } from "../utils/encrypt.js";
import jwt from "jsonwebtoken";

// Existing signup & login functions ...

// Validate token endpoint
export const validateToken = async (req, res) => {
  let token;

  // Check authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by decoded id
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return res.status(401).json({ message: "Invalid token" });

      return res.json({ valid: true, user });
    } catch (error) {
      return res.status(401).json({ valid: false, message: "Token invalid" });
    }
  }

  if (!token) {
    return res.status(401).json({ valid: false, message: "No token provided" });
  }
};

export const signup = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await hashPassword(password);

    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    // Token valid for 1 minute
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    // Store token in user document
    user.currentToken = token;
    await user.save();

    res.json({
      token,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        _id: user._id,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
