const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({
      message: "Invalid JSON payload",
    });
  }
  next(error);
});

// ====================
// User Schema
// ====================
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

// ====================
// Test API
// ====================
app.get("/", (req, res) => {
  res.json({
    message: "API is running",
  });
});

// ====================
// REGISTER API
// ====================
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);

    if (error?.code === 11000) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
});

// ====================
// LOGIN API
// ====================
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
});

const startServer = async () => {
  if (!process.env.MONGO_URI) {
    console.warn("MONGO_URI is not set. Skipping MongoDB connection.");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Atlas connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
