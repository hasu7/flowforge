
import bcrypt from "bcryptjs";
import User from "../models/user.js";
import { generateToken } from "../utils/auth.js";

const isProduction =
  process.env.CLIENT_URL?.startsWith("https://");

const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction
      ? "none"
      : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({
      email
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists"
      });
    }

    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    const user = await User.create({
      name,
      email,
      passwordHash
    });

    const token = generateToken(
      user._id.toString()
    );

    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create account"
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password"
      });
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.passwordHash
      );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password"
      });
    }

    const token = generateToken(
      user._id.toString()
    );

    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to log in"
    });
  }
};

export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email
    }
  });
};

export const logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction
      ? "none"
      : "lax"
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully"
  });
};
